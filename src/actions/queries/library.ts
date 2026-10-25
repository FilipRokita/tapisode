import "server-only";
import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY } from "@/config/constants";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import type { Region } from "@/domain/provider";
import { getProvider } from "@/lib/providers";
import { browseLists } from "@/lib/catalog/browse";
import { countPending, listLibrary, userStats } from "@/lib/library/service";

export type { CurrentUser };

/** The signed-in user for a page, or null. For pages that look but do not require a session. */
export const getPageUser = (): Promise<CurrentUser | null> => getCurrentUser();

/** The signed-in user for a page, or a redirect to sign in. */
export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export const regionOf = (user: CurrentUser): string => user.country ?? DEFAULT_COUNTRY;

export async function loadLibrary(user: CurrentUser) {
  const [titles, pending] = await Promise.all([listLibrary(user.id, regionOf(user)), countPending(user.id)]);
  return { titles, pending };
}

/** What is trending, in cinemas and coming soon, in the user's country. */
export const loadBrowse = (user: CurrentUser) => browseLists(regionOf(user));

export const loadStats = (user: CurrentUser) => userStats(user.id);

/** The countries the provider can report availability for. Empty when the provider is unreachable. */
export async function loadRegions(): Promise<readonly Region[]> {
  try {
    return await getProvider().regions();
  } catch {
    return [];
  }
}

/** Whole hours until a sandbox visitor's session ends, at least 1. Zero for a real account. */
export function sandboxHoursLeft(user: CurrentUser): number {
  if (!user.sandboxExpiresAt) return 0;
  return Math.max(1, Math.ceil((user.sandboxExpiresAt.getTime() - Date.now()) / 3_600_000));
}
