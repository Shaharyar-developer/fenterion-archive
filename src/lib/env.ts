import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  server: {
    SITE_URL: z.url(),
  },
  runtimeEnv: {
    SITE_URL: process.env.SITE_URL,
  },
});
