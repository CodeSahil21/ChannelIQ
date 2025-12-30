import 'dotenv/config';
import { defineConfig } from '@prisma/config';

declare const process: {
  env: Record<string, string | undefined>;
};

// Prefer DIRECT_URL (non-pooled 5432) for migrations; fallback to DATABASE_URL
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'Prisma config: Missing DIRECT_URL and DATABASE_URL. Set one in .env for migrations.'
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url,
  },
});
