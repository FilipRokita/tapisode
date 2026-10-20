"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Download } from "@/components/primitives/icons";
import { useCountUp } from "@/components/primitives/use-count-up";
import { Button } from "@/components/ui/button";
import type { Stats } from "@/domain/stats";
import { ShareCard } from "./share-card";

function Tile({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <small className="text-[12.5px] text-faint">{label}</small>
      <b className="mt-1.5 block text-[34px] leading-[1.1] font-extrabold tracking-[-0.04em] [font-feature-settings:'tnum']">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{value}</span>
      </b>
    </div>
  );
}

export function StatsView({ stats }: { stats: Stats }) {
  const [shareOpen, setShareOpen] = useState(false);
  const { watching, watchlist, complete } = stats.byStatus;
  const segments = [
    { key: "Watching", n: watching, color: "bg-brand" },
    { key: "Watchlist", n: watchlist, color: "bg-border-strong" },
    { key: "Complete", n: complete, color: "bg-light" },
  ] as const;

  return (
    <>
      <PageHeader title="Stats" sub="Your viewing at a glance" />
      <div className="mt-[18px] grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Episodes watched" value={stats.episodes} />
        <Tile label="Estimated hours" value={stats.hours} />
        <Tile label="Titles finished" value={stats.finished} />
        <Tile label="Titles tracked" value={stats.tracked} />
      </div>
      <h2 className="mt-[26px] mb-3 text-[13px] font-semibold tracking-[0.08em] text-faint uppercase">Titles by state</h2>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div role="img" aria-label={`${watching} watching, ${watchlist} watchlist, ${complete} complete`} className="mt-0.5 flex h-3 gap-[3px] overflow-hidden rounded-[7px]">
          {segments.map((s) => (
            <i key={s.key} className={`block rounded-[3px] ${s.color} transition-[flex] duration-[600ms] ease-app`} style={{ flex: s.n }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-dim">
          {segments.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-[7px]">
              <i className={`block size-2 rounded-full ${s.color}`} />
              {s.key} {s.n}
            </span>
          ))}
        </div>
      </div>
      {stats.pending > 0 && <p className="mt-3 text-[13px] text-faint">{stats.pending === 1 ? "1 title is not counted while it loads." : `${stats.pending} titles are not counted while they load.`}</p>}
      <div className="mt-[18px]">
        <Button variant="secondary" onClick={() => setShareOpen(true)}>
          <Download />
          Create share card
        </Button>
      </div>
      <ShareCard stats={stats} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
