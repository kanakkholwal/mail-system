import type { CatalogueEntry } from '@/lib/catalogue';
import styles from './template-card.module.css';

export function TemplateCard({ entry }: { entry: CatalogueEntry }) {
  const printable = entry.modes.includes('document');

  return (
    <a href={`/t/${entry.key}`} className={styles.card}>
      <div className={styles.thumb}>
        {/* Loaded on demand: 21 eager previews would be a megabyte of markup. */}
        <iframe
          src={`/api/preview/${entry.key}`}
          title={`${entry.name} preview`}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
        />
        <span className={styles.scrim} aria-hidden="true" />
      </div>

      <div className={styles.meta}>
        <h3 className={styles.name}>{entry.name}</h3>
        <p className={styles.subject}>{entry.subject}</p>
        <p className={entry.primaryAction === '' ? styles.noAction : styles.action}>
          {entry.primaryAction === '' ? 'No call to action, by design' : entry.primaryAction}
        </p>

        {(printable || entry.requiresUnsubscribe) && (
          <div className={styles.tags}>
            {printable && <span className={styles.tag}>A4</span>}
            {entry.requiresUnsubscribe && <span className={styles.tag}>Marketing</span>}
          </div>
        )}
      </div>
    </a>
  );
}
