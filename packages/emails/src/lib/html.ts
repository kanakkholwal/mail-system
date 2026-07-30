const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Custom-tool exporters build raw HTML strings and Elements does not sanitise
 * them by default, so every interpolated value has to pass through here.
 */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/** Only http(s) and mailto survive, so a hostile payload cannot inject javascript:. */
export function safeUrl(value: unknown): string {
  const raw = String(value ?? '').trim();
  return /^(https?:|mailto:)/i.test(raw) ? esc(raw) : '#';
}

export function joinCss(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join('');
}
