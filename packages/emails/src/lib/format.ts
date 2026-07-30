export function money(amount: number, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function date(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function dateLong(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

export function dateTime(iso: string, locale = 'en-US', timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(timeZone ? { timeZone, timeZoneName: 'short' } : {}),
  }).format(new Date(iso));
}

export function percent(rate: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(rate);
}

export function compactNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Whole days from `from` to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, from: Date): number {
  const startOfDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((startOfDay(new Date(iso)) - startOfDay(from)) / 86_400_000);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
