"use server";

import { ProviderError } from "@/domain/provider";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getClientIp } from "@/lib/http";
import { applyCommand, type CommandResult } from "@/lib/library/service";
import { guardTitleFetch, RateLimitedError } from "@/lib/limits/guards";
import { CatalogBusyError } from "@/lib/providers/gate";
import { DEFAULT_COUNTRY } from "@/config/constants";
import { changeTitleSchema } from "./schemas";

export type ChangeTitleResult = CommandResult | { readonly ok: false; readonly error: "UNAUTHORIZED" | "INVALID_INPUT" | "RATE_LIMITED" | "BUSY" | "UNAVAILABLE" };

/**
 * Changes one title on the signed-in user's lists: `+1`, a new state, an episode, or an undo.
 * Every step the template for an action requires is here: authenticate, validate, authorize, act, answer.
 */
export async function changeTitle(raw: unknown): Promise<ChangeTitleResult> {
  let user;
  try {
    user = await requireUser(); // 1. who is asking
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "UNAUTHORIZED" };
    throw e;
  }
  const parsed = changeTitleSchema.safeParse(raw); // 2. what they sent
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const { ref, expected, command } = parsed.data;
  const ip = await getClientIp();
  try {
    // 3. ownership: the use case only ever reads and writes rows whose user is `user.id`
    return await applyCommand(user.id, user.country ?? DEFAULT_COUNTRY, ref, expected, command, () => guardTitleFetch(user.id, ip)); // 4. act
  } catch (e) {
    if (e instanceof RateLimitedError) return { ok: false, error: "RATE_LIMITED" };
    if (e instanceof CatalogBusyError) return { ok: false, error: "BUSY" };
    if (e instanceof ProviderError) return { ok: false, error: "UNAVAILABLE" };
    throw e;
  }
}
