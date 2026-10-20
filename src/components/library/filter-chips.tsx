"use client";

import { cn } from "cn";
import { ServiceDot } from "@/components/primitives/service-chip";
import { SERVICE_NAMES, type ServiceKey } from "@/domain/services";

interface FilterChipsProps {
  offered: readonly ServiceKey[];
  selected: ReadonlySet<ServiceKey>;
  onToggle: (service: ServiceKey) => void;
  onClear: () => void;
}

const chip = "inline-flex min-h-11 shrink-0 items-center gap-[7px] rounded-full border px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-colors md:min-h-9";

/** "All" and the services that carry at least one of the titles. Several can be on at once. */
export function FilterChips({ offered, selected, onToggle, onClear }: FilterChipsProps) {
  return (
    <div role="group" aria-label="Filter by service" className="-mx-4 mt-3.5 flex gap-2 overflow-x-auto px-4 pt-0.5 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      <button type="button" aria-pressed={selected.size === 0} onClick={onClear} className={cn(chip, selected.size === 0 ? "border-foreground bg-foreground text-on-light" : "border-border text-text-soft hover:border-border-strong hover:bg-surface-2")}>
        All
      </button>
      {offered.map((service) => {
        const on = selected.has(service);
        return (
          <button key={service} type="button" aria-pressed={on} onClick={() => onToggle(service)} className={cn(chip, on ? "border-foreground bg-foreground text-on-light" : "border-border text-text-soft hover:border-border-strong hover:bg-surface-2")}>
            <ServiceDot service={service} />
            {SERVICE_NAMES[service]}
          </button>
        );
      })}
    </div>
  );
}
