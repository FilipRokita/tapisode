import * as React from "react";
import { cn } from "cn";

/** Our text input: 48px high, `surface-2`, a violet focus ring, and a red border when invalid (design.md section 4). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[14px] border border-border bg-surface-2 px-3.5 text-base outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-brand focus:ring-[3px] focus:ring-brand-soft disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger md:text-[15px]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
