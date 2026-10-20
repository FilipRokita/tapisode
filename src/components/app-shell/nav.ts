import type { LucideIcon } from "lucide-react";
import { BarChart3, Bookmark, CircleCheck, Tv } from "@/components/primitives/icons";

export type TabKey = "watching" | "watchlist" | "complete" | "stats";

export interface Tab {
  readonly key: TabKey;
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

/** The four tabs, in the order the pill and the slide direction use. */
export const TABS: readonly Tab[] = [
  { key: "watching", label: "Watching", href: "/app/watching", icon: Tv },
  { key: "watchlist", label: "Watchlist", href: "/app/watchlist", icon: Bookmark },
  { key: "complete", label: "Complete", href: "/app/complete", icon: CircleCheck },
  { key: "stats", label: "Stats", href: "/app/stats", icon: BarChart3 },
];

/** Which tab a path belongs to, or -1 for Settings and anything else. */
export const tabIndex = (pathname: string): number => TABS.findIndex((t) => pathname === t.href);
