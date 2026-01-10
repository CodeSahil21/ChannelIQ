import 'dotenv/config';
import { defineConfig } from '@prisma/config';

declare const process: {
  env: Record<string, string | undefined>;
};

// Prefer DIRECT_URL (non-pooled 5432) for migrations; fallback to DATABASE_URL
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url,
  },
});
