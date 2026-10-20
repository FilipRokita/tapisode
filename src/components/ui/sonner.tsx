"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** The app's toast host. Dark only, so there is no theme switch. Look and copy: design.md sections 8 and 12. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
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
