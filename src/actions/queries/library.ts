import "server-only";
import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY } from "@/config/constants";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { countPending, listLibrary, userStats } from "@/lib/library/service";

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

export const loadStats = (user: CurrentUser) => userStats(user.id);
