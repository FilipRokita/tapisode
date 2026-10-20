import type { ServiceKey } from "./services";
import type { Status } from "./types";

export interface ListEntry {
  readonly id: string;
  readonly status: Status;
  readonly activityAt: number;
  readonly services: readonly ServiceKey[];
}

/** Most recent activity first. Ties keep the order they came in. */
export const sortByActivity = <T extends Pick<ListEntry, "activityAt">>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => b.activityAt - a.activityAt);

/** The services worth offering as filters: only those carrying at least one of the titles, in the order of `order`. */
export function filterServices(items: readonly Pick<ListEntry, "services">[], order: readonly ServiceKey[]): ServiceKey[] {
  const present = new Set(items.flatMap((i) => i.services));
  return order.filter((k) => present.has(k));
}

/** An empty selection shows everything. Otherwise a title matches when it is on any selected service. */
export const matchesServices = (entry: Pick<ListEntry, "services">, selected: ReadonlySet<ServiceKey>): boolean =>
  selected.size === 0 || entry.services.some((k) => selected.has(k));
