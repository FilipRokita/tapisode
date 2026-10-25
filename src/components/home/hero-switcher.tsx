"use client";

import { cn } from "cn";
import { Poster } from "@/components/primitives/poster";
import type { TitleView } from "@/domain/view";

/** A title in the strip: one the user is in the middle of, or one from the Watchlist to start. */
export interface SwitcherItem {
  readonly view: TitleView;
  readonly kind: "watching" | "suggestion";
}

const banner = "relative hidden aspect-[16/9] w-full overflow-hidden rounded-[14px] border text-left transition-[border-color,box-shadow] duration-300 ease-app md:block";

/**
 * The titles under the hero, five across the full width. A desktop gets wide banners, a phone posters. Choosing one puts it in the
 * hero. A title from the Watchlist carries a "Start new" pill.
 */
export function HeroSwitcher({ items, selectedId, onSelect }: { items: readonly SwitcherItem[]; selectedId: string; onSelect: (id: string) => void }) {
  if (items.length < 2) return null;
  return (
    <ul aria-label="Choose what to continue" className="grid grid-cols-5 gap-2.5 md:gap-3">
      {items.map(({ view: t, kind }) => {
        const active = t.id === selectedId;
        const fresh = kind === "suggestion";
        const label = fresh ? `${t.title}, from your Watchlist` : t.title;
        return (
          <li key={t.id}>
            <button type="button" aria-label={label} aria-pressed={active} onClick={() => onSelect(t.id)} className="group relative block w-full md:hidden">
              <Poster src={t.poster?.w185 ?? null} title={t.title} compact className={cn("w-full transition-[opacity,box-shadow] duration-300 ease-app", active ? "shadow-[0_0_0_2px_var(--brand)]" : "opacity-55")} />
              {fresh && (
                <span aria-hidden="true" className="absolute top-1 right-1 grid size-[18px] place-items-center rounded-full border border-brand-edge bg-badge-bg">
                  <i className="block size-[7px] rounded-full bg-brand-text" />
                </span>
              )}
            </button>
            <button type="button" aria-pressed={active} onClick={() => onSelect(t.id)} className={cn(banner, "group", active ? "border-brand shadow-[0_0_0_1px_var(--brand),0_10px_30px_-10px_var(--brand-line)]" : "border-border hover:border-border-strong")}>
              <span className={cn("absolute inset-0 block transition-[opacity,scale] duration-500 ease-app", active ? "opacity-100" : "opacity-55 group-hover:scale-[1.04] group-hover:opacity-85")}>
                {t.backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md)
                  <img src={t.backdrop} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                ) : (
                  <Poster src={t.poster?.w185 ?? null} title={t.title} compact className="aspect-auto size-full rounded-none opacity-90 after:hidden" />
                )}
              </span>
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_6%,transparent_70%)]" />
              {fresh && (
                <span className="eyebrow absolute top-2 left-2 rounded-full border border-brand-edge bg-badge-bg px-2 py-0.5 text-[10px] text-brand-text backdrop-blur-md">
                  Start new
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
                <span className="line-clamp-1 block text-[13px] font-semibold [text-shadow:var(--text-shadow)]">{t.title}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
