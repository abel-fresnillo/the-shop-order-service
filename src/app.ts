import './instrumentation';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { ordersRouter } from './routes/orders';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '16kb' }));

  const allowedOriginsSet = new Set(config.ALLOWED_ORIGINS);
  const allowedOriginPattern = config.ALLOWED_ORIGIN_PATTERN
    ? new RegExp(config.ALLOWED_ORIGIN_PATTERN)
    : null;

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOriginsSet.has(origin) || allowedOriginPattern?.test(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };

  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    })
  );

  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    const key = req.headers['x-api-key'];
    if (!key || key !== config.ORDER_API_KEY) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    next();
  });

  app.use(ordersRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
  });

  return app;
}
