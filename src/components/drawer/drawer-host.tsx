"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { OverlaysContext, useOverlays, type Overlays } from "@/components/app-shell/overlays";
import { useIsDesktop } from "@/components/primitives/use-media-query";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import type { TitleRef } from "@/domain/types";
import { paramToRef, refToParam, TITLE_PARAM } from "./title-ref";
import { TitleDrawerBody } from "./title-drawer";
import { useDrawerTitle } from "./use-drawer-title";

interface HostState {
  readonly path: string;
  /** The title last shown. Kept while the drawer slides away. */
  readonly ref: TitleRef | null;
  readonly open: boolean;
}

/**
 * Owns the title drawer. The title is in the address (`?t=provider:type:id`), so the system back gesture closes it and a
 * link opens it. Provides `openTitle` to everything inside, which is how cards and tiles open it.
 */
export function TitleDrawerProvider({ region, children }: { region: string; children: ReactNode }) {
  const parent = useOverlays();
  const pathname = usePathname();
  const search = useSearchParams();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState<HostState>(() => {
    const initial = paramToRef(search.get(TITLE_PARAM));
    return { path: pathname, ref: initial, open: initial !== null };
  });
  const [entering, setEntering] = useState(false);
  const pushed = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Leaving the page closes the drawer.
  const open = state.open && state.path === pathname;
  const title = useDrawerTitle(open || state.open ? state.ref : null);

  useEffect(() => {
    const onPop = () => {
      const ref = paramToRef(new URLSearchParams(window.location.search).get(TITLE_PARAM));
      pushed.current = false;
      setState((s) => ({ path: window.location.pathname, ref: ref ?? s.ref, open: ref !== null }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = setTimeout(() => setEntering(true), 0);
    const stop = setTimeout(() => setEntering(false), 1100);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [open, state.ref]);

  const openTitle = useCallback(
    (ref: TitleRef, origin?: HTMLElement | null) => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const show = () => setState({ path: window.location.pathname, ref, open: true });
      window.history.pushState(null, "", `${window.location.pathname}?${TITLE_PARAM}=${refToParam(ref)}`);
      pushed.current = true;
      const poster = origin?.querySelector<HTMLElement>("[data-poster]");
      if (poster && "startViewTransition" in document && !prefersReducedMotion()) {
        poster.style.viewTransitionName = "title-poster";
        const transition = document.startViewTransition(() => {
          poster.style.viewTransitionName = "";
          flushSync(show);
        });
        void transition.finished.finally(() => {
          poster.style.viewTransitionName = "";
        });
      } else {
        show();
      }
    },
    [],
  );

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const value = useMemo<Overlays>(() => ({ ...parent, openTitle }), [parent, openTitle]);
  // A toast with Undo lives outside the sheet. Pressing it must not count as clicking away.
  const keepOpenForToasts = (event: { target: EventTarget | null; preventDefault: () => void }) => {
    if (event.target instanceof Element && event.target.closest("[data-sonner-toaster]")) event.preventDefault();
  };
  // Radix returns focus to a trigger, and this sheet has none, so give it back to what opened it.
  const giveFocusBack = (event: Event) => {
    event.preventDefault();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  };
  const body = (Heading: typeof DialogTitle | typeof DrawerTitle) => <TitleDrawerBody title={title} region={region} onClose={close} Heading={Heading} entering={entering} />;

  return (
    <OverlaysContext.Provider value={value}>
      {children}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
          <DialogContent showCloseButton={false} aria-describedby={undefined} onInteractOutside={keepOpenForToasts} onCloseAutoFocus={giveFocusBack} className="flex max-h-[86%] w-[min(720px,calc(100%-48px))] max-w-none flex-col gap-0 overflow-hidden rounded-[26px] p-0 sm:max-w-[720px]">
            {/* The window clips and rounds, the inner box scrolls, so the scrollbar follows the corners. */}
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[26px] pt-3.5 pb-[26px]">{body(DialogTitle)}</div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={(next) => !next && close()} handleOnly>
          {/* Vaul adds a cover below the sheet that scrolls with it, so the sheet itself must not scroll: an inner box does. */}
          <DrawerContent aria-describedby={undefined} onInteractOutside={keepOpenForToasts} onCloseAutoFocus={giveFocusBack} className="data-[vaul-drawer-direction=bottom]:overflow-visible">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">{body(DrawerTitle)}</div>
          </DrawerContent>
        </Drawer>
      )}
    </OverlaysContext.Provider>
  );
}
