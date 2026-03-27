import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Load environment variables explicitly
dotenv.config();

export default defineConfig({
  /* We use the datasource block exactly as documented by the new Prisma 7 spec */
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
