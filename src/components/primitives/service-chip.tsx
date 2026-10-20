import { cn } from "cn";
import { SERVICE_NAMES, type ServiceKey } from "@/domain/services";

/** The colored dot that stands for a service. */
export function ServiceDot({ service, className }: { service: ServiceKey; className?: string }) {
  return <i aria-hidden="true" className={cn("block size-[7px] shrink-0 rounded-full", className)} style={{ background: `var(--service-${service})` }} />;
}

/** A service name with its dot, as a pill. */
export function ServiceChip({ service }: { service: ServiceKey }) {
  return (
    <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-border px-[11px] py-1 text-[12.5px] text-text-soft">
      <ServiceDot service={service} />
      {SERVICE_NAMES[service]}
    </span>
  );
}
