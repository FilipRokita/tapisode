import { getEnv } from "@/config/env";
import { runMaintenance } from "@/lib/jobs/maintenance";

export const maxDuration = 60;

/** Called weekly by Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(request: Request) {
  const secret = getEnv().CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runMaintenance());
}
