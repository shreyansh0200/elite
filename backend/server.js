import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.js';
import ai from './routes/ai.js';
import auth from './routes/auth.js';
import buyer from './routes/buyer.js';
import farmer from './routes/farmer.js';
import mandi from './routes/mandi.js';
import market from './routes/market.js';
import notifications from './routes/notifications.js';

const app = express();
const port = Number(process.env.PORT || 5000);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: false,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'agrisync-api',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', auth);
app.use('/api/farmer', farmer);
app.use('/api/market', market);
app.use('/api/buy', buyer);
app.use('/api/notifications', notifications);
app.use('/api/mandi', mandi);
app.use('/api/ai', ai);

app.use((_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`AgriSync API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start AgriSync API:', error);
    process.exit(1);
  }
}

start();
