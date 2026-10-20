import "server-only";
import { CatalogBusyError, type RequestGate } from "@/lib/providers/gate";
import { hasFlag, hit, setFlag } from "./counter";
import { LIMITS } from "./limits";

const PAUSE_KEY = "provider:pause";

/** The breaker: every provider call counts here first. Over the ceiling, or inside a pause, the call is refused. */
export const dbGate: RequestGate = {
  async acquire() {
    if (await hasFlag(PAUSE_KEY)) throw new CatalogBusyError();
    const [second, day] = await Promise.all([hit("provider:s", 1), hit("provider:d", 86_400)]);
    if (second > LIMITS.providerPerSecond || day > LIMITS.providerPerDay) throw new CatalogBusyError();
  },
  async pause(seconds) {
    await setFlag(PAUSE_KEY, seconds);
  },
};
