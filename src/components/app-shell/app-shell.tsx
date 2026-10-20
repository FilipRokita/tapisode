"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useLibrary } from "@/components/library/library-provider";
import { ChevronRight, Search, WifiOff } from "@/components/primitives/icons";
import { Logo } from "@/components/primitives/logo";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";
import { useOnline } from "@/components/primitives/use-online";
import { ConfettiHost } from "@/components/confetti-host";
import { Toaster } from "@/components/ui/sonner";
import { OFFLINE_MESSAGE } from "@/components/copy";
import type { Status } from "@/domain/types";
import { OverlaysContext, useOverlays, type Overlays } from "./overlays";
import { TABS, tabIndex } from "./nav";

export interface ShellUser {
  readonly name: string;
  /** "Demo, expires in 6 h" for a sandbox, the email otherwise. */
  readonly caption: string;
  readonly initial: string;
}

function Avatar({ user, className }: { user: ShellUser; className?: string }) {
  return <span className={cn("grid size-[34px] shrink-0 place-items-center rounded-full border border-border-strong bg-surface-3 text-[13px] font-bold", className)}>{user.initial}</span>;
}

function Sidebar({ user, counts }: { user: ShellUser; counts: Record<Status, number> }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen flex-col gap-1.5 border-r border-border bg-gradient-to-b from-sidebar-fade to-transparent px-3.5 py-[22px] md:flex">
      <Link href="/" aria-label="Tapisode home" className="px-3.5 pb-[18px]">
        <Logo />
      </Link>
      <nav aria-label="Main" className="grid gap-0.5">
        {TABS.map((tab) => {
          const current = pathname === tab.href;
          const count = tab.key === "stats" ? null : counts[tab.key];
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={cn("flex min-h-[42px] items-center gap-3 rounded-[12px] px-3 text-[14.5px] font-semibold transition-colors", current ? "bg-surface-2 text-foreground" : "text-dim hover:bg-surface-2 hover:text-foreground")}
            >
              <tab.icon className={cn("size-5", current && "text-brand-text")} />
              {tab.label}
              {count !== null && <span className="mono ml-auto text-xs text-faint">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <Link
        href="/app/settings"
        aria-label="Account and settings"
        aria-current={pathname === "/app/settings" ? "page" : undefined}
        className={cn("flex items-center gap-2.5 rounded-[14px] border p-2.5 text-dim transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-foreground", pathname === "/app/settings" ? "border-border-strong bg-surface-2" : "border-border bg-surface")}
      >
        <Avatar user={user} className={pathname === "/app/settings" ? "border-brand" : undefined} />
        <span className="min-w-0 flex-1">
          <b className="block truncate text-[13.5px] text-foreground">{user.name}</b>
          <small className="block truncate text-xs text-faint">{user.caption}</small>
        </span>
        <ChevronRight className="size-5" />
      </Link>
    </aside>
  );
}

function StickyTop({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const { openSearch } = useOverlays();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => bar.current?.classList.toggle("border-b-border", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={bar} className="sticky top-0 z-[35] -mx-4 mb-1.5 border-b border-b-transparent bg-bar px-4 pt-[calc(6px+var(--safe-top))] backdrop-blur-[14px] transition-colors duration-200 md:hidden">
      <div className="flex items-center justify-between gap-2.5 pt-1 pb-2.5">
        <Link href="/" aria-label="Tapisode home">
          <Logo />
        </Link>
        <div className="flex gap-0.5">
          <button type="button" onClick={openSearch} aria-label="Search" className="needs-net grid size-11 place-items-center rounded-[14px] text-dim hover:bg-surface-2 hover:text-foreground">
            <Search className="size-5" />
          </button>
          <Link href="/app/settings" aria-label="Account and settings" aria-current={pathname === "/app/settings" ? "page" : undefined} className="grid size-11 place-items-center rounded-full">
            <Avatar user={user} className={pathname === "/app/settings" ? "border-brand shadow-[0_0_0_3px_var(--brand-soft)]" : undefined} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const active = tabIndex(pathname);
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-bar-strong px-2 pt-1.5 pb-[calc(6px+var(--safe-bottom))] backdrop-blur-[14px] md:hidden">
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute top-1.5 bottom-[calc(6px+var(--safe-bottom))] left-2 w-[calc((100%-16px)/4)] rounded-[14px] bg-surface-2 transition-[transform,opacity] duration-[240ms] ease-out-app", active < 0 && "opacity-0")}
        style={{ transform: `translateX(${Math.max(0, active) * 100}%)` }}
      />
      {TABS.map((tab, i) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={i === active ? "page" : undefined}
          className={cn("relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-[14px] text-[11px] font-semibold transition-colors", i === active ? "text-foreground" : "text-faint")}
        >
          <tab.icon className={cn("size-5", i === active && "text-brand-text")} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** On a phone the page slides in from the side of the tab it came from. Desktop just fades in. */
function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const node = useRef<HTMLDivElement>(null);
  const previous = useRef(pathname);
  useEffect(() => {
    const from = tabIndex(previous.current);
    const to = tabIndex(pathname);
    previous.current = pathname;
    if (from < 0 || to < 0 || from === to || prefersReducedMotion() || !window.matchMedia("(max-width: 759px)").matches) return;
    const dir = to > from ? 1 : -1;
    node.current?.animate([{ opacity: 0, transform: `translateX(${dir * 22}px)` }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" });
  }, [pathname]);
  return (
    <div ref={node} key={tabIndex(pathname) < 0 ? pathname : undefined} className={tabIndex(pathname) < 0 ? "fade-in" : undefined}>
      {children}
    </div>
  );
}

export function AppShell({ user, overlays, children }: { user: ShellUser; overlays?: Partial<Overlays>; children: ReactNode }) {
  const { titles } = useLibrary();
  const online = useOnline();
  useEffect(() => {
    document.body.classList.toggle("offline", !online);
    return () => document.body.classList.remove("offline");
  }, [online]);
  const counts: Record<Status, number> = { watching: 0, watchlist: 0, complete: 0 };
  for (const t of titles) if (t.state) counts[t.state.status] += 1;
  const value: Overlays = { openSearch: () => {}, openTitle: () => {}, openShareCard: () => {}, ...overlays };
  return (
    <OverlaysContext.Provider value={value}>
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <Sidebar user={user} counts={counts} />
        <main id="main" className="min-w-0 px-4 pb-[calc(92px+var(--safe-bottom))] md:mx-auto md:w-full md:max-w-[1180px] md:px-9 md:pt-[calc(36px+var(--safe-top))] md:pb-14">
          <StickyTop user={user} />
          {!online && (
            <div role="status" className="mb-2.5 flex items-center gap-2.5 rounded-[14px] border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-dim">
              <WifiOff className="size-5 shrink-0" />
              <span>{OFFLINE_MESSAGE}</span>
            </div>
          )}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <BottomNav />
      <ConfettiHost />
      <Toaster />
    </OverlaysContext.Provider>
  );
}
