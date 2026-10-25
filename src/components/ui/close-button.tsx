import { cn } from "cn";
import { X } from "@/components/primitives/icons";
import { Button } from "./button";

/** The close button of our dialogs and sheets: a rounded square, 36px, with a 44px touch area on a phone. Position it with `className`. */
export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button variant="secondary" size="icon" aria-label="Close" onClick={onClick} className={cn("size-9 border-border-strong/60 bg-background/55 text-text-soft backdrop-blur-md before:absolute before:-inset-1 before:content-[''] hover:bg-background/75 hover:text-foreground md:before:hidden", className)}>
      <X />
    </Button>
  );
}
