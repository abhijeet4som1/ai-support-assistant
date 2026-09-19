import { pino, type LoggerOptions } from 'pino';

import { type Config } from './config.js';

/** Shared pino options for Fastify (`logger:`) and standalone loggers (worker). */
export function loggerOptions(cfg: Pick<Config, 'LOG_LEVEL' | 'LOG_PRETTY'>): LoggerOptions {
  return {
    level: cfg.LOG_LEVEL,
    ...(cfg.LOG_PRETTY
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          },
        }
      : {}),
    redact: ['req.headers.authorization'],
  };
}

export const createLogger = (cfg: Pick<Config, 'LOG_LEVEL' | 'LOG_PRETTY'>) =>
  pino(loggerOptions(cfg));

/** Minimal structural logger type satisfied by pino's Logger and Fastify's request/app logger. */
export interface AppLogger {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
}
