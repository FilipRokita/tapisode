import "server-only";
import { allow } from "./counter";
import { LIMITS } from "./limits";

export class RateLimitedError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "RateLimitedError";
  }
}

/** Runs before a user's action makes the app fetch from the provider. */
export async function guardTitleFetch(userId: string, ip: string): Promise<void> {
  const [byUser, byIp] = await Promise.all([allow(`fetch:u:${userId}`, LIMITS.titleFetchPerUserPer10Min, 600), allow(`fetch:ip:${ip}`, LIMITS.titleFetchPerIpPer10Min, 600)]);
  if (!byUser || !byIp) throw new RateLimitedError();
}

export async function guardSearch(userId: string, ip: string): Promise<void> {
  const [byUser, byIp] = await Promise.all([allow(`search:u:${userId}`, LIMITS.searchPerUserPerMinute, 60), allow(`search:ip:${ip}`, LIMITS.searchPerIpPerMinute, 60)]);
  if (!byUser || !byIp) throw new RateLimitedError();
}
