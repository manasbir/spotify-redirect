import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/drizzle',
  schema: './src/drizzle/schema.ts',
  dialect: 'sqlite',
  // driver: 'd1-http',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/1ea24b79c876b5c84a4886f22aa3fd308913df2cea02db2388aee0d9736a0482.sqlite',
  },
});
