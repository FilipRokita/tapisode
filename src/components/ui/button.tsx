import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import * as React from "react";

/** Our buttons: one white primary, a soft violet one for the card `+1`, and quiet ones. Measurements are in design.md section 4. */
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-semibold transition-[transform,background-color,border-color,color,opacity] duration-150 ease-app outline-none active:scale-[.97] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-on-light hover:bg-light",
        secondary: "border border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3",
        ghost: "text-dim hover:bg-surface-2 hover:text-foreground",
        danger: "bg-danger-soft text-danger hover:bg-danger/20",
        soft: "border border-brand-line bg-brand-soft text-brand-text hover:bg-brand/20",
      },
      size: {
        default: "min-h-11 px-[18px] text-[15px]",
        lg: "min-h-[52px] rounded-2xl px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
