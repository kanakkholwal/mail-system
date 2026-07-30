'use client';

import { titleFor, type JsonValue, type SchemaNode } from '@/lib/json-schema';
import { Field, type Emit } from './field';
import styles from './form.module.css';

/** Brand, legal, sender and locale are the same on every send, so they fold away. */
const SETTINGS = ['branding', 'legal', 'sender', 'locale'];

interface Props {
  schema: SchemaNode;
  value: JsonValue;
  errors: Map<string, string>;
  emit: Emit;
}

export function SchemaForm({ schema, value, errors, emit }: Props) {
  const object = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const entries = Object.entries(schema.properties ?? {});
  const content = entries.filter(([key]) => !SETTINGS.includes(key));
  const settings = entries.filter(([key]) => SETTINGS.includes(key));
  const settingsErrors = [...errors.keys()].filter((path) => SETTINGS.includes(path.split('.')[0] ?? '')).length;

  const field = ([key, node]: [string, SchemaNode]) => (
    <Field
      key={key}
      node={node}
      path={[key]}
      value={(object as Record<string, JsonValue>)[key]}
      required={schema.required?.includes(key) ?? false}
      errors={errors}
      emit={emit}
      label={titleFor(key)}
    />
  );

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <div className={styles.section}>{content.map(field)}</div>

      <details className={styles.settings}>
        <summary>
          Brand, legal and sender
          {settingsErrors > 0 && <span className={styles.badge}>{settingsErrors}</span>}
        </summary>
        <div className={styles.settingsBody}>{settings.map(field)}</div>
      </details>
    </form>
  );
}
