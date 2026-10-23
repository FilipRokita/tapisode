"use client";

import { STATUS_LABEL } from "@/components/copy";
import { Clock, Plus, Trash2 } from "@/components/primitives/icons";
import { Segmented } from "@/components/primitives/segmented";
import { Button } from "@/components/ui/button";
import { isReleased } from "@/domain/progress";
import { STATUSES, type Status } from "@/domain/types";
import type { TitleView } from "@/domain/view";

/** The three lists as a segmented control, with a button below to add the title to the Watchlist or take it off every list. A title on no list shows no pill. */
export function StatusControl({ view, onChange, onRemove }: { view: TitleView; onChange: (status: Status) => void; onRemove: () => void }) {
  const released = isReleased(view.facts);
  const airing = view.facts.type === "tv" && view.facts.state === "ongoing";
  return (
    <div className="needs-net">
      <div className="eyebrow mb-2.5">Status</div>
      <Segmented label="Status" value={view.state?.status ?? null} onChange={onChange} items={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))} />
      {view.state ? (
        <Button variant="ghost" onClick={onRemove} className="mt-2.5 w-full">
          <Trash2 />
          Remove from my lists
        </Button>
      ) : (
        <Button variant="soft" onClick={() => onChange("watchlist")} className="mt-2.5 w-full">
          <Plus />
          Add to my list
        </Button>
      )}
      {!released ? (
        <p className="mt-2.5 flex items-center gap-2 text-[13px] text-dim">
          <Clock className="size-4" aria-hidden="true" />
          Not released yet. It can only go on your Watchlist.
        </p>
      ) : airing ? (
        <p className="mt-2.5 flex items-center gap-2 text-[13px] text-dim">
          <Clock className="size-4" aria-hidden="true" />
          Still airing. It stays in Watching until the series ends.
        </p>
      ) : null}
    </div>
  );
}
