/**
 * Simple logger utility for Qarte
 * In production: info/warn/error output structured JSON for Vercel logs
 * In development: human-readable console output
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    } else {
      console.log(JSON.stringify({ level: 'info', msg: args[0], data: args.slice(1), ts: new Date().toISOString() }));
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    } else {
      console.warn(JSON.stringify({ level: 'warn', msg: args[0], data: args.slice(1), ts: new Date().toISOString() }));
    }
  },

  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error);
    } else {
      console.error(JSON.stringify({
        level: 'error', msg: message, ts: new Date().toISOString(),
        error: error instanceof Error ? { message: error.message, code: (error as any).code } : error,
      }));
    }
  },

  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
};

export default logger;
