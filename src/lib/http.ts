import "server-only";
import { headers } from "next/headers";

/** The caller's IP as the host reports it. On Vercel the first address of x-forwarded-for is the client and cannot be spoofed. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
