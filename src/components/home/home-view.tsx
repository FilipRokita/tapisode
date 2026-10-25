"use client";

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { useOverlays } from "@/components/app-shell/overlays";
import { EmptyState } from "@/components/primitives/empty-state";
import { House, Search } from "@/components/primitives/icons";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/components/library/library-provider";
import { usePlusOne } from "@/components/library/use-plus-one";
import { useSetStatus } from "@/components/library/use-run-command";
import { useAmbientHue } from "@/components/library/use-ambient-hue";
import { useToday } from "@/components/library/use-today";
import { Reveal } from "@/components/landing/reveal";
import { airDateLabel } from "@/domain/countdown";
import { backlog, catchUp, greetingFor, nextAiring, weekAgenda } from "@/domain/home";
import type { TitleView } from "@/domain/view";
import { Hero } from "./hero";
import { HeroSwitcher } from "./hero-switcher";
import { Numbers } from "./numbers";
import { WeekAgenda } from "./week-agenda";

/** How far ahead Coming up looks: about two months. */
const AGENDA_DAYS = 60;

const noSubscribe = () => () => {};
/** The visitor's local hour, or null during the server render. */
const useHour = (): number | null => useSyncExternalStore(noSubscribe, () => new Date().getHours(), () => null);

interface HomeViewProps {
  /** The nickname of a real account. Null for a demo visitor. */
  name: string | null;
  /** Trending, in cinemas and coming soon. They arrive after the user's own sections. */
  rows: ReactNode;
}

export function HomeView({ name, rows }: HomeViewProps) {
  const { titles, pending } = useLibrary();
  const { openSearch } = useOverlays();
  const { plusOne, previews } = usePlusOne();
  const setStatus = useSetStatus();
  const today = useToday();
  const hour = useHour();

  const watching = titles.filter((t): t is TitleView => t.state?.status === "watching");
  const [chosenId, setChosenId] = useState<string | null>(null);
  // The title the user picked under the hero, or the newest one when none is picked or the pick left Watching.
  const upNext = watching.find((t) => t.id === chosenId) ?? watching[0];
  const hue = useAmbientHue(upNext?.poster?.w185 ?? null);
  const finished = titles.filter((t) => t.state?.status === "complete").length;
  const greeting = hour === null ? "Welcome back" : greetingFor(hour);

  return (
    <div className="hue relative" style={{ "--h": hue } as CSSProperties}>
      {/* The page takes the color of what the user is watching: two slow lights behind the header and the card. */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -top-24 -z-10 h-[620px] overflow-hidden md:-inset-x-9">
        <div className="absolute -top-1/4 -left-[10%] h-full w-3/4 animate-[aurora_18s_ease-in-out_infinite_alternate] bg-[radial-gradient(closest-side,var(--glow-strong),transparent_70%)]" />
        <div className="absolute -top-1/3 -right-[15%] h-4/5 w-3/5 animate-[aurora_24s_ease-in-out_infinite_alternate-reverse] bg-[radial-gradient(closest-side,var(--glow),transparent_70%)]" />
      </div>
      <PageHeader title={name ? `${greeting}, ${name}` : greeting} sub={today ? airDateLabel(today) : "Your week at a glance"} />
      {pending > 0 && <p className="mt-2 text-[13px] text-faint">{pending === 1 ? "1 title is loading" : `${pending} titles are loading`}</p>}
      <div className="mt-5 md:mt-1">
        {upNext ? (
          <>
            <Hero view={upNext} preview={previews[upNext.id]} onPlus={() => plusOne(upNext, true)} onMarkWatched={() => setStatus(upNext, "complete")} />
            <div className="mt-3.5">
              <HeroSwitcher titles={watching} selectedId={upNext.id} onSelect={setChosenId} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={House}
            title={titles.length === 0 ? "Your Home is waiting" : "Nothing in progress"}
            text={titles.length === 0 ? "Search for a show or pick one from below to start tracking." : "Move something from your Watchlist to Watching, or pick a title from below."}
            action={
              <Button variant="primary" className="needs-net" onClick={openSearch}>
                <Search />
                Search titles
              </Button>
            }
          />
        )}
      </div>
      {titles.length > 0 && today && (
        <>
          <Reveal>
            <WeekAgenda days={weekAgenda(titles, today, AGENDA_DAYS)} next={nextAiring(titles, today, AGENDA_DAYS)} today={today} />
          </Reveal>
          <Reveal>
            <Numbers backlog={backlog(titles)} items={catchUp(titles)} finished={finished} tracked={titles.length} />
          </Reveal>
        </>
      )}
      {rows}
    </div>
  );
}
