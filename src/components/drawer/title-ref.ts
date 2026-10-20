import type { MediaType, TitleRef } from "@/domain/types";

/** `?t=fake:tv:salt`: the title the drawer shows, in the address so the back gesture closes it and a link opens it. */
export const TITLE_PARAM = "t";

export const refToParam = (ref: TitleRef): string => `${ref.provider}:${ref.type}:${ref.externalId}`;

export function paramToRef(value: string | null): TitleRef | null {
  if (!value) return null;
  const [provider, type, externalId, ...extra] = value.split(":");
  if (!provider || !externalId || extra.length > 0 || (type !== "tv" && type !== "movie")) return null;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(externalId) || !/^[a-z]{1,20}$/.test(provider)) return null;
  return { provider, type: type as MediaType, externalId };
}

export const sameRef = (a: TitleRef, b: TitleRef): boolean => a.provider === b.provider && a.type === b.type && a.externalId === b.externalId;
