import "server-only";
import { getEnv } from "@/config/env";
import type { MediaProvider } from "@/domain/provider";
import { dbGate } from "@/lib/limits/gate";
import { FakeProvider } from "./fake/provider";
import { TmdbProvider } from "./tmdb/provider";

let cached: MediaProvider | undefined;

/** The provider chosen by configuration. This is the only place that names a concrete adapter. */
export function getProvider(): MediaProvider {
  if (!cached) {
    const env = getEnv();
    cached = env.MEDIA_PROVIDER === "fake" ? new FakeProvider() : new TmdbProvider({ token: env.TMDB_API_READ_ACCESS_TOKEN ?? "", gate: dbGate });
  }
  return cached;
}
