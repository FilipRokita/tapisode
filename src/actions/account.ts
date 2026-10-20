"use server";

import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteUser, updateCountry } from "@/lib/library/account";
import { countrySchema } from "./schemas";

export type AccountResult = { readonly ok: true } | { readonly ok: false; readonly error: "UNAUTHORIZED" | "INVALID_INPUT" };

export async function setCountry(raw: unknown): Promise<AccountResult> {
  try {
    const user = await requireUser();
    const parsed = countrySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
    await updateCountry(user.id, parsed.data.country);
    return { ok: true };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "UNAUTHORIZED" };
    throw e;
  }
}

/** Deletes the account and everything on it. */
export async function deleteAccount(): Promise<AccountResult> {
  try {
    const user = await requireUser();
    await deleteUser(user.id);
    return { ok: true };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "UNAUTHORIZED" };
    throw e;
  }
}
