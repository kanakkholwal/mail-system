export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type LogFields = Record<string, unknown>;

export interface Logger {
  level: LogLevel;
  child(fields: LogFields): Logger;
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

const RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const REDACT = /^(authorization|cookie|api[-_]?key|password|secret|token)$/i;

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = REDACT.test(key) ? '[redacted]' : value;
  }
  return out;
}

export type Sink = (line: string) => void;

export function createLogger(level: LogLevel, sink: Sink = console.log, base: LogFields = {}): Logger {
  const emit = (at: Exclude<LogLevel, 'silent'>, event: string, fields?: LogFields): void => {
    if (RANK[at] < RANK[level]) return;
    sink(
      JSON.stringify({
        time: new Date().toISOString(),
        level: at,
        event,
        ...base,
        ...(fields ? redact(fields) : {}),
      }),
    );
  };

  return {
    level,
    child: (fields) => createLogger(level, sink, { ...base, ...redact(fields) }),
    debug: (event, fields) => emit('debug', event, fields),
    info: (event, fields) => emit('info', event, fields),
    warn: (event, fields) => emit('warn', event, fields),
    error: (event, fields) => emit('error', event, fields),
  };
}
