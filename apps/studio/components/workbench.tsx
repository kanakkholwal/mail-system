'use client';

import type { RenderMode, TemplateMeta } from '@better-mailer/emails';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { writeAt, type JsonValue, type Path, type SchemaNode } from '@/lib/json-schema';
import type { RenderOutcome } from '@/lib/catalogue';
import { SchemaForm } from './schema-form';
import styles from './workbench.module.css';

const MODE_LABEL: Record<RenderMode, string> = { email: 'Email', web: 'Web page', document: 'A4 document' };
const WIDTH: Record<RenderMode, { wide: number; narrow: number }> = {
  email: { wide: 600, narrow: 375 },
  web: { wide: 720, narrow: 375 },
  document: { wide: 820, narrow: 420 },
};

/** Gmail clips a message past this, hiding the footer and the unsubscribe link. */
const GMAIL_CLIP = 102_400;

type Tab = 'preview' | 'text' | 'html';

interface Props {
  meta: TemplateMeta;
  schema: SchemaNode;
  sample: JsonValue;
  initial: RenderOutcome;
}

export function Workbench({ meta, schema, sample, initial }: Props) {
  const [payload, setPayload] = useState<JsonValue>(sample);
  const [mode, setMode] = useState<RenderMode>(meta.modes[0] ?? 'email');
  const [narrow, setNarrow] = useState(false);
  const [tab, setTab] = useState<Tab>('preview');
  const [outcome, setOutcome] = useState<RenderOutcome>(initial);
  const [stale, setStale] = useState(false);

  const pending = useRef<AbortController | undefined>(undefined);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    setStale(true);
    const timer = setTimeout(() => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;

      fetch('/api/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: meta.key, mode, payload }),
        signal: controller.signal,
      })
        .then((response) => response.json() as Promise<RenderOutcome>)
        .then((next) => {
          setOutcome(next);
          setStale(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setStale(false);
        });
    }, 320);

    return () => clearTimeout(timer);
  }, [payload, mode, meta.key]);

  const emit = useCallback((path: Path, next: JsonValue | undefined) => {
    setPayload((current) => writeAt(current, path, next));
  }, []);

  const errors = useMemo(
    () => new Map(outcome.issues.map((issue) => [issue.path, issue.message])),
    [outcome.issues],
  );

  const width = narrow ? WIDTH[mode].narrow : WIDTH[mode].wide;
  const clipped = outcome.bytes > GMAIL_CLIP;

  const copyCurl = (): void => {
    const command = [
      `curl -X POST "$BETTER_MAILER_URL/v1/send" \\`,
      `  -H "Authorization: Bearer $BETTER_MAILER_KEY" \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${JSON.stringify({ template: meta.key, to: 'someone@example.com', payload })}'`,
    ].join('\n');
    void navigator.clipboard.writeText(command);
  };

  const downloadDesign = (): void => {
    window.open(`/api/design/${meta.key}?mode=${mode}`, '_blank', 'noopener');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.rail}>
        <header className={styles.railHead}>
          <a href="/" className={styles.back}>
            All templates
          </a>
          <h1 className={styles.title}>{meta.name}</h1>
          <p className={styles.description}>{meta.description}</p>
          <div className={styles.badges}>
            <span className={styles.badge}>{meta.genre}</span>
            {meta.requiresUnsubscribe && <span className={styles.badge}>unsubscribe enforced</span>}
            <span className={styles.badge}>{meta.modes.join(' · ')}</span>
          </div>
        </header>

        <SchemaForm schema={schema} value={payload} errors={errors} emit={emit} />
      </aside>

      <section className={styles.stage}>
        <div className={styles.toolbar}>
          <div className={styles.segmented} role="group" aria-label="Render mode">
            {meta.modes.map((option) => (
              <button key={option} type="button" aria-pressed={option === mode} onClick={() => setMode(option)}>
                {MODE_LABEL[option]}
              </button>
            ))}
          </div>

          <div className={styles.segmented} role="group" aria-label="Viewport width">
            <button type="button" aria-pressed={!narrow} onClick={() => setNarrow(false)}>
              {WIDTH[mode].wide}
            </button>
            <button type="button" aria-pressed={narrow} onClick={() => setNarrow(true)}>
              {WIDTH[mode].narrow}
            </button>
          </div>

          <div className={styles.spacer} />

          <div className={styles.segmented} role="group" aria-label="Output">
            {(['preview', 'text', 'html'] as Tab[]).map((option) => (
              <button key={option} type="button" aria-pressed={option === tab} onClick={() => setTab(option)}>
                {option === 'preview' ? 'Preview' : option === 'text' ? 'Plain text' : 'HTML'}
              </button>
            ))}
          </div>

          <button type="button" className={styles.action} onClick={downloadDesign}>
            Design JSON
          </button>
          <button type="button" className={styles.action} onClick={copyCurl}>
            Copy curl
          </button>
        </div>

        {!outcome.ok && (
          <p className={styles.problem} role="status">
            {outcome.message ?? 'This payload does not render yet.'}
          </p>
        )}

        <div className={styles.inbox} aria-label="Inbox row preview">
          <span className={styles.inboxFrom}>{subjectSender(payload)}</span>
          <span className={styles.inboxSubject}>{outcome.subject || '—'}</span>
          <span className={styles.inboxPreview}>{outcome.previewText}</span>
        </div>

        <div className={`${styles.canvas} ${stale ? styles.stale : ''}`} data-mode={mode}>
          {tab === 'preview' && (
            <iframe
              className={styles.frame}
              style={{ width }}
              srcDoc={outcome.html}
              title={`${meta.name} rendered as ${MODE_LABEL[mode]}`}
            />
          )}
          {tab === 'text' && <pre className={styles.plain}>{outcome.text}</pre>}
          {tab === 'html' && <pre className={styles.plain}>{outcome.html}</pre>}
        </div>

        <footer className={styles.stats}>
          <span>
            <b className="mono">{(outcome.bytes / 1024).toFixed(1)} KB</b> of HTML
          </span>
          <span className={clipped ? styles.warn : undefined}>
            {clipped ? 'Over the Gmail clip threshold' : `${Math.round((outcome.bytes / GMAIL_CLIP) * 100)}% of the Gmail clip limit`}
          </span>
          <span>
            <b className="mono">{outcome.previewText.length}</b>/140 preheader
          </span>
        </footer>
      </section>
    </div>
  );
}

function subjectSender(payload: JsonValue): string {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return 'Sender';
  const branding = (payload as Record<string, JsonValue>).branding;
  if (branding === null || typeof branding !== 'object' || Array.isArray(branding)) return 'Sender';
  const name = (branding as Record<string, JsonValue>).name;
  return typeof name === 'string' ? name : 'Sender';
}
