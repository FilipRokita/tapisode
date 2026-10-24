import { ServiceDot } from "@/components/primitives/service-chip";
import { SERVICE_NAMES } from "@/domain/services";
import type { TitleView } from "@/domain/view";

export function WhereToWatch({ view, region }: { view: TitleView; region: string }) {
  const services = view.services;
  return (
    <div>
      <div className="eyebrow mb-2.5">Where to watch in {region}</div>
      {services === null || services.length === 0 ? (
        <p className="text-[14.5px] text-dim">{services === null ? `No streaming data for ${region} yet.` : `Not on any service we track in ${region}.`}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <span key={s} className="inline-flex items-center gap-[9px] rounded-[14px] border border-border bg-surface-2 py-[9px] pr-3.5 pl-3 text-sm font-semibold">
              <ServiceDot service={s} className="size-[9px]" />
              {SERVICE_NAMES[s]}
              <small className="text-xs font-medium text-faint">Stream</small>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
