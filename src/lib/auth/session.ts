import "server-only";
import { headers } from "next/headers";
import { SANDBOX_LIFETIME_MS } from "@/config/constants";
import { auth } from "./index";

export interface CurrentUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly country: string | null;
  readonly isSandbox: boolean;
  /** When a sandbox visitor's session ends. Null for a real account. */
  readonly sandboxExpiresAt: Date | null;
}

/** The signed-in user, or null. An expired sandbox counts as signed out, whatever the session cookie says. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  const isSandbox = user.isAnonymous === true;
  const sandboxExpiresAt = isSandbox ? new Date(user.createdAt.getTime() + SANDBOX_LIFETIME_MS) : null;
  if (sandboxExpiresAt && sandboxExpiresAt.getTime() <= Date.now()) return null;
  return { id: user.id, name: user.name, email: user.email, country: (user as { country?: string | null }).country ?? null, isSandbox, sandboxExpiresAt };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
