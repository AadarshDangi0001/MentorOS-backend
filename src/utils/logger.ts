import winston from 'winston';
import { ENV } from '../config/env';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: ENV.IS_PROD ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    ENV.IS_PROD ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console(),
    ...(ENV.IS_PROD
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

export default logger;
