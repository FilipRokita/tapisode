import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { and, eq, gt, sql } from "drizzle-orm";
import { DEFAULT_COUNTRY, SANDBOX_CAP, SANDBOX_LIFETIME_MS, TEMPLATE_USER_EMAIL } from "@/config/constants";
import { getEnv } from "@/config/env";
import { db } from "@/db/client";
import { copyLibrary, moveLibrary } from "@/db/library";
import * as schema from "@/db/schema";

/** Vercel puts the visitor's country in this header. Anywhere else there is none, and the default applies. */
export function countryFromHeaders(headers: Headers | undefined): string {
  const value = headers?.get("x-vercel-ip-country")?.toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : DEFAULT_COUNTRY;
}

export const auth = betterAuth({
  baseURL: getEnv().BETTER_AUTH_URL,
  secret: getEnv().BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  advanced: { database: { generateId: "uuid" } },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: (password) => hash(password, { algorithm: 2 }),
      verify: ({ hash: stored, password }) => verify(stored, password),
    },
  },
  user: { additionalFields: { country: { type: "string", required: false, input: false } } },
  // Always on. Counters live in the database, so it works on serverless.
  rateLimit: {
    enabled: true,
    storage: "database",
    // Creating a sandbox needs no login, so it is a public entry point: a few per hour per IP. Sign-up is limited too.
    customRules: { "/sign-in/anonymous": { window: 3600, max: 3 }, "/sign-up/email": { window: 60, max: 5 } },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (user.isAnonymous) {
            const cutoff = new Date(Date.now() - SANDBOX_LIFETIME_MS);
            const [live] = await db
              .select({ n: sql<number>`count(*)::int` })
              .from(schema.user)
              .where(and(eq(schema.user.isAnonymous, true), gt(schema.user.createdAt, cutoff)));
            if ((live?.n ?? 0) >= SANDBOX_CAP) throw new APIError("SERVICE_UNAVAILABLE", { message: "SANDBOX_FULL" });
          }
          return { data: { ...user, country: countryFromHeaders(context?.request?.headers) } };
        },
        after: async (user) => {
          if (!user.isAnonymous) return;
          const [template] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, TEMPLATE_USER_EMAIL));
          if (template) await copyLibrary(template.id, user.id);
        },
      },
    },
  },
  plugins: [
    anonymous({ onLinkAccount: ({ anonymousUser, newUser }) => moveLibrary(anonymousUser.user.id, newUser.user.id) }),
    nextCookies(), // keep last
  ],
});
