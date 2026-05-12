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
  // Whole positive number of seconds. Rejects "7d" loudly instead of silently coercing it to 7.
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+$/, 'JWT_EXPIRES_IN must be a whole number of seconds (e.g. 604800)')
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(7 * 24 * 60 * 60),
});

export const env = envSchema.parse(process.env);
