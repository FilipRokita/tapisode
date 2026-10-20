import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}

/** A dashed box with an icon tile, a title, a line of help and an optional action. */
export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="fade-in mt-5 grid justify-items-center gap-2.5 rounded-[20px] border border-dashed border-border-strong px-5 py-14 text-center text-dim">
      <div className="grid size-16 place-items-center rounded-[20px] bg-surface-2 text-faint">
        <Icon className="size-5" />
      </div>
      <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
