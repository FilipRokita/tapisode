"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { useOverlays } from "@/components/app-shell/overlays";
import { EmptyState } from "@/components/primitives/empty-state";
import { House, Search } from "@/components/primitives/icons";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/components/library/library-provider";
import { UpNext } from "@/components/library/up-next";
import { usePlusOne } from "@/components/library/use-plus-one";
import { useSetStatus } from "@/components/library/use-run-command";
import { useToday } from "@/components/library/use-today";
import { airDateLabel } from "@/domain/countdown";
import { backlog, greetingFor, weekAgenda } from "@/domain/home";
import type { TitleView } from "@/domain/view";
import { HeroBackdrop } from "./hero-backdrop";
import { Numbers } from "./numbers";
import { stagger } from "./stagger";
import { WeekAgenda } from "./week-agenda";

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
  const [upNext] = watching;
  const finished = titles.filter((t) => t.state?.status === "complete").length;
  const greeting = hour === null ? "Welcome back" : greetingFor(hour);
  const hero = stagger(0);

  return (
    <>
      <PageHeader title={name ? `${greeting}, ${name}` : greeting} sub={today ? airDateLabel(today) : "Your week at a glance"} />
      {pending > 0 && <p className="mt-2 text-[13px] text-faint">{pending === 1 ? "1 title is loading" : `${pending} titles are loading`}</p>}
      {upNext ? (
        <div className={hero.className} style={hero.style}>
          <UpNext
            view={upNext}
            preview={previews[upNext.id]}
            onPlus={() => plusOne(upNext, true)}
            onMarkWatched={() => setStatus(upNext, "complete")}
            backdrop={<HeroBackdrop view={upNext} />}
          />
        </div>
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
      {titles.length > 0 && today && (
        <>
          <WeekAgenda days={weekAgenda(titles, today)} k={1} />
          <Numbers backlog={backlog(titles)} finished={finished} tracked={titles.length} k={2} />
        </>
      )}
      {rows}
    </>
  );
}
