import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  server: {
    SITE_URL: z.url(),
    DATABASE_URL: z.string(),
    PLUNK_API_KEY: z.string(),
    R2_ENDPOINT: z.string(),
    R2_ACCESS: z.string(),
    R2_SECRET: z.string(),
  },
  runtimeEnv: {
    SITE_URL: process.env.SITE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    PLUNK_API_KEY: process.env.PLUNK_API_KEY,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCESS: process.env.R2_ACCESS,
    R2_SECRET: process.env.R2_SECRET,
  },
});
