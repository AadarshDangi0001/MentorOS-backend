import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import passport from './config/passport';
import { ENV } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import logger from './utils/logger';

const app: Application = express();

// ─── Security Headers ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: ENV.IS_PROD,
    crossOriginEmbedderPolicy: ENV.IS_PROD,
  })
);

// ─── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ENV.CLIENT_URL.split(',').map((u) => u.trim());
      console.log('CORS Request Origin:', origin, 'Allowed list:', allowed);
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ─── Request Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// ─── Passport (OAuth) ─────────────────────────────────────────
app.use(passport.initialize()); // No sessions — JWT only

// ─── Sanitization ─────────────────────────────────────────────
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution

// ─── Compression ──────────────────────────────────────────────
app.use(compression());

// ─── HTTP Logging ─────────────────────────────────────────────
if (!ENV.IS_PROD) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (_req, res) => res.statusCode < 400, // Only log errors in prod
    })
  );
}

// ─── Rate Limiting ────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Trust Proxy (for Nginx/load balancers) ───────────────────
app.set('trust proxy', 1);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
