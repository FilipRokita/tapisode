"use client";

import type { ReactNode } from "react";
import { useIsDesktop } from "@/components/primitives/use-media-query";
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
        <DialogContent showCloseButton={false} className="block max-h-[86%] w-[min(460px,calc(100%-48px))] max-w-none overflow-y-auto rounded-[26px] px-[22px] pt-5 pb-[22px] sm:max-w-[460px]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange} handleOnly>
      <DrawerContent>
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <DrawerDescription className="sr-only">{description}</DrawerDescription>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
