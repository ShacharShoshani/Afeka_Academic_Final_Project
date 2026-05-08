import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: path.resolve(__dirname, '.env') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export default defineConfig({
  schema: path.resolve(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url,
  },
});
