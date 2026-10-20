import "server-only";
import { ProviderError } from "@/domain/provider";
import { CatalogBusyError } from "@/lib/providers/gate";
import { RateLimitedError } from "@/lib/limits/guards";

/** Turns what a catalog call can throw into the status a route handler answers with. Unknown errors are rethrown. */
export function catalogErrorResponse(e: unknown): Response {
  if (e instanceof RateLimitedError) return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  if (e instanceof CatalogBusyError) return Response.json({ error: "BUSY" }, { status: 503, headers: { "retry-after": "30" } });
  if (e instanceof ProviderError) return Response.json({ error: "UNAVAILABLE" }, { status: 502 });
  throw e;
}
