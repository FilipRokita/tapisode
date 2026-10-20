import { cn } from "cn";

/** The notice TMDB and JustWatch ask for. The mark is smaller and quieter than our own logo (catalog-data.md). */
export function TmdbAttribution({ className }: { className?: string }) {
  return (
    <div className={cn("flex max-w-[70ch] items-center gap-3.5 leading-normal", className)}>
      <span className="grid h-[18px] w-[46px] shrink-0 place-items-center rounded-[5px] border border-border-strong text-[9px] font-extrabold tracking-[0.06em] text-dim">TMDB</span>
      <span>This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.</span>
    </div>
  );
}
