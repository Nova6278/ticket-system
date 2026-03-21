import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { db } from './config/database';
import { redis } from './config/redis';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import eventRoutes from './modules/events/events.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import ticketRoutes from './modules/tickets/tickets.routes';
import paymentRoutes from './modules/payments/payments.routes';

dotenv.config();

const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Service unavailable',
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

export default app;