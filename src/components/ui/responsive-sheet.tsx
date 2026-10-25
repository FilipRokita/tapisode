"use client";

import type { ReactNode } from "react";
import { useIsDesktop } from "@/components/primitives/use-media-query";
import { CloseButton } from "./close-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./drawer";

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}

/** A bottom sheet on a phone and a centered dialog from 760px. The title and description are for assistive tech. */
export function ResponsiveSheet({ open, onOpenChange, title, description, children }: ResponsiveSheetProps) {
  const desktop = useIsDesktop();
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="flex max-h-[94%] w-[min(460px,calc(100%-48px))] max-w-none flex-col gap-0 overflow-hidden rounded-[26px] p-0 sm:max-w-[460px]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          {/* The content scrolls and the close button stays outside it, so it is always in reach. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-5 pb-[22px]">{children}</div>
          <CloseButton onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-20" />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange} handleOnly>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:overflow-hidden data-[vaul-drawer-direction=bottom]:px-0">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <DrawerDescription className="sr-only">{description}</DrawerDescription>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-[18px]">{children}</div>
        <CloseButton onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-20" />
      </DrawerContent>
    </Drawer>
  );
}
