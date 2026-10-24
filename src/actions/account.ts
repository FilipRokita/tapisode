"use server";

import { after } from "next/server";
import { ProviderError } from "@/domain/provider";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteUser, setAvailabilityRegion, updateCountry } from "@/lib/library/account";
import { getProvider } from "@/lib/providers";
import { CatalogBusyError } from "@/lib/providers/gate";
import { countrySchema } from "./schemas";

export type AccountResult = { readonly ok: true } | { readonly ok: false; readonly error: "UNAUTHORIZED" | "INVALID_INPUT" | "UNAVAILABLE" };

/** Saves the country at once and loads the services for the new region after the answer, so the user does not wait for the provider. */
export async function setCountry(raw: unknown): Promise<AccountResult> {
  try {
    const user = await requireUser();
    const parsed = countrySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
    const { country } = parsed.data;
    if (!(await getProvider().regions()).some((r) => r.code === country)) return { ok: false, error: "INVALID_INPUT" };
    await updateCountry(user.id, country);
    after(() => setAvailabilityRegion(user.id, country));
    return { ok: true };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "UNAUTHORIZED" };
    if (e instanceof ProviderError || e instanceof CatalogBusyError) return { ok: false, error: "UNAVAILABLE" };
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
