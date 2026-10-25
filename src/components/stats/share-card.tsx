"use client";

import { cn } from "cn";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "@/components/primitives/icons";
import { Segmented } from "@/components/primitives/segmented";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import type { Stats } from "@/domain/stats";
import { readCardPalette } from "./card-palette";
import { buildShareCardSvg, CARD_SIZE, type CardFormat } from "./share-card-svg";

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Draws the SVG on a canvas at its full size and downloads it as a PNG. */
async function savePng(svg: string, format: CardFormat): Promise<void> {
  const { width, height } = CARD_SIZE[format];
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("image"));
    image.src = svgUrl(svg);
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("blob");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `tapisode-stats-${format}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

export function ShareCard({ stats, open, onOpenChange }: { stats: Stats; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [format, setFormat] = useState<CardFormat>("story");
  const [fading, setFading] = useState(false);
  const year = new Date().getFullYear();
  const svg = useMemo(() => (open ? buildShareCardSvg(stats, readCardPalette(), format, year) : ""), [open, stats, format, year]);

  const change = (next: CardFormat) => {
    setFading(true);
    setTimeout(() => {
      setFormat(next);
      setFading(false);
    }, 140);
  };

  async function save() {
    try {
      await savePng(svg, format);
      toast(`Saved tapisode-stats-${format}.png`);
    } catch {
      toast("Could not create the image");
    }
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Share your stats" description="A picture of your stats to save or share.">
      <div className="mb-3 flex items-center justify-between">
        <b className="text-[17px] tracking-[-0.02em]">Share your stats</b>
        <CloseButton onClick={() => onOpenChange(false)} className="relative -my-1" />
      </div>
      <Segmented
        kind="tab"
        label="Format"
        className="mb-3.5"
        value={format}
        onChange={change}
        items={[
          { value: "story", label: "Story 9:16" },
          { value: "post", label: "Post 1:1" },
        ]}
      />
      <div className="grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL built in the browser */}
        <img
          alt="Your Tapisode stats card"
          src={svg ? svgUrl(svg) : undefined}
          className={cn("block h-auto w-[min(100%,calc((100vh-290px)*.5625))] max-w-full rounded-[18px] border border-border-strong shadow-[var(--shadow-lift)] transition-opacity duration-[160ms]", fading && "opacity-0")}
        />
      </div>
      <div className="mt-3.5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button variant="primary" className="flex-1" onClick={save}>
          <Download />
          Save image
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
