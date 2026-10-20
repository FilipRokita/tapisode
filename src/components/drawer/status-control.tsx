"use client";

import { STATUS_LABEL } from "@/components/copy";
import { Clock } from "@/components/primitives/icons";
import { Segmented } from "@/components/primitives/segmented";
import { isReleased } from "@/domain/progress";
import { STATUSES, type Status } from "@/domain/types";
import type { TitleView } from "@/domain/view";

/** The three lists as a segmented control. A title on no list shows no pill. */
export function StatusControl({ view, onChange }: { view: TitleView; onChange: (status: Status) => void }) {
  const released = isReleased(view.facts);
  const airing = view.facts.type === "tv" && view.facts.state === "ongoing";
  return (
    <div>
      <div className="eyebrow mb-2.5">Status</div>
      <Segmented label="Status" value={view.state?.status ?? null} onChange={onChange} items={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))} />
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
