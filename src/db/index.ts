import { neon } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

const sql = neon(process.env.DATABASE_URL!);
export const db =
  process.env.NODE_ENV === "development"
    ? pgDrizzle(env.DATABASE_URL, { schema })
    : neonDrizzle({ client: sql, schema });
