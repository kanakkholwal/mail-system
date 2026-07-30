export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type NodeType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';

/**
 * The exact subset Zod 4 emits for this catalogue: no $ref, no allOf, no
 * additionalProperties. Verified by walking all 21 template schemas.
 */
export interface SchemaNode {
  type?: NodeType;
  properties?: Record<string, SchemaNode>;
  required?: string[];
  items?: SchemaNode;
  oneOf?: SchemaNode[];
  enum?: JsonPrimitive[];
  const?: JsonPrimitive;
  format?: 'email' | 'uri' | 'date' | 'date-time';
  pattern?: string;
  default?: JsonValue;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  minItems?: number;
  maxItems?: number;
}

export type Path = (string | number)[];

export function pathKey(path: Path): string {
  return path.join('.');
}

export function readAt(value: JsonValue, path: Path): JsonValue | undefined {
  let cursor: JsonValue | undefined = value;
  for (const step of path) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return undefined;
    cursor = Array.isArray(cursor) ? cursor[step as number] : cursor[step as string];
  }
  return cursor;
}

/** Structural clone down the path only, so React sees a new reference where it matters. */
export function writeAt(root: JsonValue, path: Path, next: JsonValue | undefined): JsonValue {
  if (path.length === 0) return next ?? null;
  const [head, ...rest] = path;

  if (typeof head === 'number') {
    const list = Array.isArray(root) ? [...root] : [];
    if (rest.length === 0) {
      if (next === undefined) list.splice(head, 1);
      else list[head] = next;
    } else {
      list[head] = writeAt(list[head] ?? {}, rest, next);
    }
    return list;
  }

  const object = root !== null && typeof root === 'object' && !Array.isArray(root) ? { ...root } : {};
  const key = String(head);
  if (rest.length === 0) {
    if (next === undefined) delete object[key];
    else object[key] = next;
  } else {
    object[key] = writeAt(object[key] ?? {}, rest, next);
  }
  return object;
}

/** A oneOf built from a literal discriminant, which is how sender and similar unions arrive. */
export function discriminant(node: SchemaNode): string | undefined {
  if (!node.oneOf?.length) return undefined;
  const first = node.oneOf[0];
  const candidates = Object.entries(first?.properties ?? {})
    .filter(([, child]) => child.const !== undefined)
    .map(([key]) => key);
  return candidates.find((key) => node.oneOf?.every((variant) => variant.properties?.[key]?.const !== undefined));
}

export function variantFor(node: SchemaNode, value: JsonValue | undefined): number {
  const key = discriminant(node);
  if (!key || value === null || typeof value !== 'object' || Array.isArray(value)) return 0;
  const found = node.oneOf?.findIndex((variant) => variant.properties?.[key]?.const === value[key]);
  return found === undefined || found < 0 ? 0 : found;
}

export function blankFor(node: SchemaNode): JsonValue {
  if (node.default !== undefined) return node.default;
  if (node.const !== undefined) return node.const;
  if (node.enum?.length) return node.enum[0] ?? '';

  switch (node.type) {
    case 'object': {
      const out: Record<string, JsonValue> = {};
      for (const key of node.required ?? []) {
        const child = node.properties?.[key];
        if (child) out[key] = blankFor(child);
      }
      return out;
    }
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'integer':
    case 'number':
      return node.minimum ?? 0;
    default:
      return '';
  }
}

const TITLES: Record<string, string> = {
  ctaUrl: 'CTA URL',
  logoUrl: 'Logo URL',
  otp: 'OTP',
  url: 'URL',
  vatRate: 'VAT rate',
};

export function titleFor(key: string): string {
  if (TITLES[key]) return TITLES[key] as string;
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
