import { z } from "zod";

const schema = z.object({ DATABASE_URL: z.string().url(), SESSION_SECRET: z.string().min(32) });
export const env = schema.parse({ DATABASE_URL: process.env.DATABASE_URL, SESSION_SECRET: process.env.SESSION_SECRET });
