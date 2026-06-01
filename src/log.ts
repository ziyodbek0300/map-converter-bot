// Minimal structured logger. Emits one JSON line per event so logs stay
// greppable (`pm2 logs`) and machine-parseable, without pulling in a logging
// dependency. Level is read once from LOG_LEVEL (default "info").

type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function thresholdFromEnv(): number {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return ORDER[raw as Level] ?? ORDER.info;
}

const threshold = thresholdFromEnv();

/** A structured field bag attached to a log event. */
type Fields = Record<string, unknown>;

function emit(level: Level, event: string, fields?: Fields): void {
  if (ORDER[level] < threshold) return;
  // ISO timestamp first so every line is self-dated when read via `pm2 logs`.
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Fields) => emit('debug', event, fields),
  info: (event: string, fields?: Fields) => emit('info', event, fields),
  warn: (event: string, fields?: Fields) => emit('warn', event, fields),
  error: (event: string, fields?: Fields) => emit('error', event, fields),
};
