import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),

  REDIS_URL: z.string(),

  JWT_SECRET: z.string(),
  TICKET_SECRET: z.string(),

  STRIPE_SECRET_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;