import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  server: {
    SITE_URL: z.url(),
    DATABASE_URL: z.string(),
    PLUNK_API_KEY: z.string(),
  },
  runtimeEnv: {
    SITE_URL: process.env.SITE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    PLUNK_API_KEY: process.env.PLUNK_API_KEY,
  },
});
