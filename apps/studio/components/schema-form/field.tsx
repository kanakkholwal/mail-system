'use client';

import { memo } from 'react';
import {
  blankFor,
  discriminant,
  pathKey,
  titleFor,
  variantFor,
  type JsonValue,
  type Path,
  type SchemaNode,
} from '@/lib/json-schema';
import styles from './field.module.css';

export type Emit = (path: Path, next: JsonValue | undefined) => void;

interface FieldProps {
  node: SchemaNode;
  path: Path;
  value: JsonValue | undefined;
  required: boolean;
  errors: Map<string, string>;
  emit: Emit;
  label?: string;
}

const isHexColour = (node: SchemaNode): boolean => Boolean(node.pattern?.includes('0-9a-fA-F'));
const isLongText = (node: SchemaNode): boolean => (node.maxLength ?? 0) >= 120;

function inputType(node: SchemaNode): string {
  switch (node.format) {
    case 'email':
      return 'email';
    case 'uri':
      return 'url';
    case 'date':
      return 'date';
    case 'date-time':
      return 'datetime-local';
    default:
      return 'text';
  }
}

/** datetime-local wants a bare local stamp; the schema wants a full ISO string. */
function toLocalStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function Row({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.row}>
      <span className={styles.rowHead}>
        <span className={styles.rowLabel}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

export const Field = memo(function Field({ node, path, value, required, errors, emit, label }: FieldProps) {
  const title = label ?? titleFor(String(path.at(-1) ?? ''));
  const error = errors.get(pathKey(path));

  if (node.const !== undefined) return null;

  if (node.oneOf?.length) {
    const key = discriminant(node);
    const active = variantFor(node, value);
    const variant = node.oneOf[active];

    return (
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{title}</legend>
        {key && (
          <div className={styles.segmented} role="group">
            {node.oneOf.map((option, index) => (
              <button
                key={String(option.properties?.[key]?.const ?? index)}
                type="button"
                aria-pressed={index === active}
                onClick={() => emit(path, blankFor(option))}
              >
                {titleFor(String(option.properties?.[key]?.const ?? index))}
              </button>
            ))}
          </div>
        )}
        {variant && (
          <Field node={variant} path={path} value={value} required={required} errors={errors} emit={emit} label="" />
        )}
      </fieldset>
    );
  }

  if (node.type === 'object' && node.properties) {
    const object = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const children = Object.entries(node.properties).filter(([, child]) => child.const === undefined);

    const body = children.map(([key, child]) => (
      <Field
        key={key}
        node={child}
        path={[...path, key]}
        value={(object as Record<string, JsonValue>)[key]}
        required={node.required?.includes(key) ?? false}
        errors={errors}
        emit={emit}
      />
    ));

    if (label === '') return <>{body}</>;
    return (
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{title}</legend>
        {body}
      </fieldset>
    );
  }

  if (node.type === 'array' && node.items) {
    const items = Array.isArray(value) ? value : [];
    const atMax = node.maxItems !== undefined && items.length >= node.maxItems;
    const atMin = items.length <= (node.minItems ?? 0);

    return (
      <fieldset className={styles.group}>
        <legend className={styles.legend}>
          {title}
          <span className={styles.count}>{items.length}</span>
        </legend>

        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.itemIndex}>{index + 1}</span>
              <button
                type="button"
                className={styles.remove}
                disabled={atMin}
                onClick={() => emit([...path, index], undefined)}
                aria-label={`Remove ${title} ${index + 1}`}
              >
                Remove
              </button>
            </div>
            <Field
              node={node.items as SchemaNode}
              path={[...path, index]}
              value={item}
              required
              errors={errors}
              emit={emit}
              label=""
            />
          </div>
        ))}

        <button
          type="button"
          className={styles.add}
          disabled={atMax}
          onClick={() => emit([...path, items.length], blankFor(node.items as SchemaNode))}
        >
          {atMax ? `Maximum ${node.maxItems}` : `Add ${title.toLowerCase()}`}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </fieldset>
    );
  }

  if (node.type === 'boolean') {
    return (
      <label className={styles.switchRow}>
        <input type="checkbox" checked={value === true} onChange={(event) => emit(path, event.target.checked)} />
        <span className={styles.rowLabel}>{title}</span>
        {error && <span className={styles.error}>{error}</span>}
      </label>
    );
  }

  if (node.type === 'integer' || node.type === 'number') {
    const step = node.type === 'integer' ? 1 : 'any';
    return (
      <Row label={title} error={error} hint={required ? undefined : 'optional'}>
        <input
          className={styles.input}
          type="number"
          inputMode="decimal"
          step={step}
          {...(node.minimum === undefined ? {} : { min: node.minimum })}
          {...(node.maximum === undefined ? {} : { max: node.maximum })}
          value={typeof value === 'number' ? value : ''}
          onChange={(event) => emit(path, event.target.value === '' ? undefined : Number(event.target.value))}
        />
      </Row>
    );
  }

  const text = typeof value === 'string' ? value : '';
  const change = (next: string): void => emit(path, next === '' && !required ? undefined : next);

  if (node.enum?.length) {
    return (
      <Row label={title} error={error}>
        <select className={styles.input} value={text} onChange={(event) => change(event.target.value)}>
          {!required && <option value="">Not set</option>}
          {node.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {titleFor(String(option))}
            </option>
          ))}
        </select>
      </Row>
    );
  }

  if (isHexColour(node)) {
    return (
      <Row label={title} error={error} hint={required ? undefined : 'optional'}>
        <span className={styles.colour}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(text) ? text : '#000000'} onChange={(event) => change(event.target.value)} />
          <input className={styles.input} value={text} placeholder="#1F4BF5" onChange={(event) => change(event.target.value)} />
        </span>
      </Row>
    );
  }

  if (isLongText(node)) {
    return (
      <Row
        label={title}
        error={error}
        hint={node.maxLength ? `${text.length}/${node.maxLength}` : undefined}
      >
        <textarea
          className={styles.input}
          rows={3}
          maxLength={node.maxLength ?? undefined}
          value={text}
          onChange={(event) => change(event.target.value)}
        />
      </Row>
    );
  }

  const type = inputType(node);
  const shown = type === 'datetime-local' && text ? toLocalStamp(text) : text;

  return (
    <Row label={title} error={error} hint={required ? undefined : 'optional'}>
      <input
        className={styles.input}
        type={type}
        value={shown}
        onChange={(event) => {
          const raw = event.target.value;
          if (type !== 'datetime-local') return change(raw);
          if (raw === '') return change('');
          const parsed = new Date(raw);
          change(Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString());
        }}
      />
    </Row>
  );
});
