import { cn } from "cn";

/** A shimmering block that holds the place of content that is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}
