"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsDesktop } from "@/components/primitives/use-media-query";

/** The app's toast host: bottom right on a desktop, at the top on a phone. Dark only, so there is no theme switch. Look and copy: design.md sections 8 and 12. */
export function Toaster(props: ToasterProps) {
  const desktop = useIsDesktop();
  return (
    <Sonner
      theme="dark"
      position={desktop ? "bottom-right" : "top-center"}
      mobileOffset={{ top: "calc(var(--safe-top, 0px) + 12px)", left: 16, right: 16 }}
      duration={5000}
      style={
        {
          "--normal-bg": "var(--surface-3)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border-strong)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { actionButton: "!bg-transparent !text-brand-text !font-bold !min-h-11" } }}
      {...props}
    />
  );
}
