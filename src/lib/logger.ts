/**
 * Logger Utility
 * Centralized logging with component context for debugging
 */

interface Logger {
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

/**
 * Creates a logger instance with a component context prefix
 * @param component - The name of the component/module using the logger
 * @returns A logger object with info, warn, and error methods
 */
export function createLogger(component: string): Logger {
  return {
    info: (...args: any[]) => {
      console.log(`[${component}]`, ...args)
    },
    warn: (...args: any[]) => {
      console.warn(`[${component}]`, ...args)
    },
    error: (...args: any[]) => {
      console.error(`[${component}]`, ...args)
    }
  }
}

/**
 * Default logger for general use without component context
 */
export const logger = {
  info: (...args: any[]) => console.log('[App]', ...args),
  warn: (...args: any[]) => console.warn('[App]', ...args),
  error: (...args: any[]) => console.error('[App]', ...args)
}
