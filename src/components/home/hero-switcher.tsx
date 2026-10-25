"use client";

import { cn } from "cn";
import Link from "next/link";
import { ChevronRight } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import type { TitleView } from "@/domain/view";

/** How many titles the strip shows before its last tile points to the whole Watching list. */
const SHOWN = 4;

const banner = "relative hidden aspect-[16/9] w-full overflow-hidden rounded-[14px] border text-left transition-[border-color,box-shadow] duration-300 ease-app md:block";

/**
 * The titles in Watching under the hero. A desktop gets five wide banners as wide as the hero, a phone five small posters. Choosing
 * a title puts it in the hero, and the last tile leads to the whole list.
 */
export function HeroSwitcher({ titles, selectedId, onSelect }: { titles: readonly TitleView[]; selectedId: string; onSelect: (id: string) => void }) {
  if (titles.length < 2) return null;
  return (
    <ul aria-label="Choose what to continue" className="flex gap-2.5 md:grid md:grid-cols-5 md:gap-3">
      {titles.slice(0, SHOWN).map((t) => {
        const active = t.id === selectedId;
        return (
          <li key={t.id} className="w-[58px] shrink-0 md:w-auto">
            <button type="button" aria-label={t.title} aria-pressed={active} onClick={() => onSelect(t.id)} className="group block w-full md:hidden">
              <Poster src={t.poster?.w185 ?? null} title={t.title} compact className={cn("w-full transition-[opacity,box-shadow] duration-300 ease-app", active ? "shadow-[0_0_0_2px_var(--brand)]" : "opacity-55")} />
            </button>
            <button type="button" aria-label={t.title} aria-pressed={active} onClick={() => onSelect(t.id)} className={cn(banner, "group", active ? "border-brand shadow-[0_0_0_1px_var(--brand),0_10px_30px_-10px_var(--brand-line)]" : "border-border hover:border-border-strong")}>
              {t.backdrop ? (
                // eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md)
                <img src={t.backdrop} alt="" loading="lazy" decoding="async" className={cn("absolute inset-0 size-full object-cover transition-[opacity,scale] duration-500 ease-app", active ? "opacity-100" : "opacity-55 group-hover:opacity-85 group-hover:scale-[1.04]")} />
              ) : (
                <Poster src={t.poster?.w185 ?? null} title={t.title} compact className={cn("absolute inset-0 aspect-auto size-full rounded-none after:hidden transition-opacity duration-500", active ? "opacity-90" : "opacity-50")} />
              )}
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_6%,transparent_70%)]" />
              <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
                <span className="line-clamp-1 block text-[13px] font-semibold [text-shadow:var(--text-shadow)]">{t.title}</span>
              </span>
            </button>
          </li>
        );
      })}
      <li className="w-[58px] shrink-0 md:w-auto">
        <Link
          href="/app/watching"
          aria-label={`All ${titles.length} in Watching`}
          className="group grid aspect-[2/3] w-full place-content-center justify-items-center gap-0.5 rounded-[12px] border border-dashed border-border-strong bg-surface text-dim transition-colors hover:border-brand-edge hover:bg-brand-soft hover:text-foreground md:aspect-[16/9] md:gap-1 md:rounded-[14px]"
        >
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase md:hidden">All</span>
          <span className="hidden text-[11px] font-semibold tracking-[0.1em] uppercase md:block">All in Watching</span>
          <span className="flex items-center gap-1">
            <b className="mono text-[20px] leading-none font-bold tracking-[-0.04em] text-foreground md:text-[26px]">{titles.length}</b>
            <ChevronRight className="size-4 transition-transform duration-300 ease-app group-hover:translate-x-1 md:size-5" />
          </span>
        </Link>
      </li>
    </ul>
  );
}
