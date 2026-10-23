import { cn } from "cn";
import Image from "next/image";

/** The notice TMDB and JustWatch ask for, with TMDB's own logo (public/tmdb-logo.svg, unmodified). The logo stays smaller than our own (catalog-data.md). */
export function TmdbAttribution({ className }: { className?: string }) {
  return (
    <div className={cn("flex max-w-[70ch] items-center gap-3.5 leading-normal", className)}>
      <Image src="/tmdb-logo.svg" alt="TMDB" width={56} height={24} unoptimized className="shrink-0" />
      <span>This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.</span>
    </div>
  );
}
