import "server-only";
import { FRESHNESS, SANDBOX_LIFETIME_MS } from "@/config/constants";
import { purgeOlderThan, refreshCandidates } from "@/db/catalog";
import { deleteExpiredSandboxes, recordRun } from "@/db/ops";
import { deleteExpiredCounters, setFlag } from "@/lib/limits/counter";
import { persistTitle } from "@/lib/catalog/service";
import { DEFAULT_COUNTRY } from "@/config/constants";
import { getProvider } from "@/lib/providers";

export interface MaintenanceReport {
  readonly purged: { readonly content: number; readonly availability: number };
  readonly refreshed: number;
  readonly failed: number;
  readonly sandboxesDeleted: number;
  readonly countersDeleted: number;
}

/**
 * The weekly job. It purges first, so the 6-month rule holds even if the refresh fails, then refreshes the titles users
 * track within a fixed budget, then cleans up expired sandboxes and spent counters. Running it twice does no harm.
 */
export async function runMaintenance(now = Date.now(), refreshRegion = DEFAULT_COUNTRY): Promise<MaintenanceReport> {
  const purged = await purgeOlderThan(new Date(now - FRESHNESS.purgeDays * 86_400_000));

  const provider = getProvider();
  let refreshed = 0;
  let failed = 0;
  for (const candidate of await refreshCandidates(FRESHNESS.jobOngoingDays, FRESHNESS.jobStaticDays, FRESHNESS.jobBudget)) {
    try {
      const title = await provider.getTitle(candidate.ref, refreshRegion);
      if (title) {
        await persistTitle(title, refreshRegion);
        refreshed += 1;
      } else failed += 1;
    } catch {
      failed += 1;
    }
  }

  const sandboxesDeleted = await deleteExpiredSandboxes(new Date(now - SANDBOX_LIFETIME_MS));
  const countersDeleted = await deleteExpiredCounters();
  const report: MaintenanceReport = { purged, refreshed, failed, sandboxesDeleted, countersDeleted };
  await recordRun("maintenance", report as unknown as Record<string, unknown>);
  return report;
}

/**
 * The kill switch, for when the provider revokes the key or asks for its data to go. Deletes every piece of provider
 * content and availability, and refuses all provider calls for ten years. Users' lists survive, and the app keeps
 * working on titles it can no longer describe until the provider is replaced or the pause is cleared.
 */
export async function killSwitch(): Promise<{ content: number; availability: number }> {
  const purged = await purgeOlderThan(new Date(Date.now() + 86_400_000));
  await setFlag("provider:pause", 10 * 365 * 86_400);
  return purged;
}
