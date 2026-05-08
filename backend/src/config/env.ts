import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.number().default(7 * 24 * 60 * 60), // 7 days in seconds
});

const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN ?? '');
if (isNaN(JWT_EXPIRES_IN)) {
  throw new Error('JWT_EXPIRES_IN must be a valid number');
}

export const env = envSchema.parse({ ...process.env, JWT_EXPIRES_IN });
