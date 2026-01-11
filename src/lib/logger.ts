/**
 * Simple logger utility for Qarte
 * In production, logs are suppressed unless explicitly needed
 * TODO: Replace with a proper logging service (Sentry, LogRocket, etc.)
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log error messages
   * These are always logged as they indicate problems
   * In production, these should be sent to a monitoring service
   */
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error);
    } else {
      // In production, you would send to Sentry/LogRocket here
      // For now, we still log errors but without stack traces
      console.error('[ERROR]', message);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
};

export default logger;
