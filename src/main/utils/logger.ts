import { app } from 'electron'

const isDev = !app.isPackaged

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const formatMessage = (level: LogLevel, ...args: unknown[]): string => {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}]`
}

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.log(formatMessage('debug'), ...args)
    }
  },
  info: (...args: unknown[]): void => {
    console.log(formatMessage('info'), ...args)
  },
  warn: (...args: unknown[]): void => {
    console.warn(formatMessage('warn'), ...args)
  },
  error: (...args: unknown[]): void => {
    console.error(formatMessage('error'), ...args)
  },
}

