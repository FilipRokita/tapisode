import "server-only";
import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.url(),
    DATABASE_URL_UNPOOLED: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    MEDIA_PROVIDER: z.enum(["tmdb", "fake"]).default("tmdb"),
    TMDB_API_READ_ACCESS_TOKEN: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  })
  .refine((e) => e.MEDIA_PROVIDER !== "tmdb" || !!e.TMDB_API_READ_ACCESS_TOKEN, {
    message: "TMDB_API_READ_ACCESS_TOKEN is required when MEDIA_PROVIDER is tmdb",
    path: ["TMDB_API_READ_ACCESS_TOKEN"],
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Reads and checks the environment on first use, so a missing variable fails with a clear message and not at import time. */
export function getEnv(): Env {
  if (!cached) {
    const parsed = schema.safeParse({ ...process.env, DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || undefined, TMDB_API_READ_ACCESS_TOKEN: process.env.TMDB_API_READ_ACCESS_TOKEN || undefined, CRON_SECRET: process.env.CRON_SECRET || undefined });
    if (!parsed.success) throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
    cached = parsed.data;
  }
  return cached;
}
