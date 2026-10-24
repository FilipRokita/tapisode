"use client";

import { cn } from "cn";
import { STATUS_LABEL } from "@/components/copy";
import { Clock, Plus, Trash2 } from "@/components/primitives/icons";
import { Segmented } from "@/components/primitives/segmented";
import { Button } from "@/components/ui/button";
import { isReleased } from "@/domain/progress";
import { STATUSES, type Status } from "@/domain/types";
import type { TitleView } from "@/domain/view";

/**
 * A title on no list shows one button that adds it to the Watchlist. Once it is on a list, that button gives way to the
 * three lists as a segmented control, with a small button beside it to take the title off every list. Both sit in the
 * same box and cross-fade, so the pill slides into place instead of the layout jumping.
 */
export function StatusControl({ view, onChange, onRemove }: { view: TitleView; onChange: (status: Status) => void; onRemove: () => void }) {
  const tracked = view.state !== null;
  const released = isReleased(view.facts);
  const airing = view.facts.type === "tv" && view.facts.state === "ongoing";
  return (
    <div className="needs-net">
      <div className="eyebrow mb-2.5">My list</div>
      <div className="relative">
        <div data-status-row="" inert={!tracked} className={cn("flex gap-2 transition-[opacity,transform] duration-300 ease-app", !tracked && "pointer-events-none scale-[.97] opacity-0")}>
          <Segmented className="flex-1" label="Status" value={view.state?.status ?? null} onChange={onChange} items={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))} />
          <Button variant="ghost" aria-label="Remove from my lists" title="Remove from my lists" onClick={onRemove} className="h-auto w-11 shrink-0 self-stretch border border-border bg-surface-2 hover:border-danger/40 hover:bg-danger-soft hover:text-danger">
            <Trash2 />
          </Button>
        </div>
        <Button variant="soft" inert={tracked} onClick={() => onChange("watchlist")} className={cn("absolute inset-0 h-full w-full transition-[opacity,transform] duration-300 ease-app", tracked && "pointer-events-none scale-[1.03] opacity-0")}>
          <Plus />
          Add to Watchlist
        </Button>
      </div>
      {!released ? (
        <p className="mt-2.5 flex items-center gap-2 text-[13px] text-dim">
          <Clock className="size-4" aria-hidden="true" />
          Not released yet. It can only go on your Watchlist.
        </p>
      ) : airing ? (
        <p className="mt-2.5 flex items-center gap-2 text-[13px] text-dim">
          <Clock className="size-4" aria-hidden="true" />
          Still airing.
        </p>
      ) : null}
    </div>
  );
}
