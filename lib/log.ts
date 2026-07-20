// lib/log.ts — Structured JSON logger for production safety
type LogLevel = 'error' | 'warn' | 'info';

function sanitize(val: unknown): unknown {
  if (!val || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Error) {
    const errWithCode = val as Error & { code?: unknown };
    return {
      name: val.name,
      message: '[REDACTED]',
      stack: '[REDACTED]',
      ...(errWithCode.code ? { code: errWithCode.code } : {}),
    };
  }
  if (Array.isArray(val)) {
    return (val as unknown[]).map(sanitize);
  }
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
    const keyLower = key.toLowerCase();
    if (['message', 'details', 'hint', 'query', 'parameters', 'stack', 'error', 'err', 'password', 'token', 'secret'].includes(keyLower)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitize(value);
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && level === 'info') return;

  const sanitizedContext = context ? (sanitize(context) as Record<string, unknown>) : {};

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitizedContext,
  };

  // In production, use console.error for errors (visible in Vercel logs);
  // in dev, use console.log for visibility.
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
};
