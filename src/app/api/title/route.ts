import { titleQuerySchema } from "@/actions/schemas";
import { DEFAULT_COUNTRY } from "@/config/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { catalogErrorResponse } from "@/lib/http-errors";
import { getClientIp } from "@/lib/http";
import { getTitleView } from "@/lib/library/service";
import { guardTitleFetch } from "@/lib/limits/guards";

/** One title for the drawer, for a title that is not on the user's lists yet (one that is comes with the page). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = titleQuerySchema.safeParse({ provider: params.provider, type: params.type, externalId: params.id });
  if (!parsed.success) return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    const ip = await getClientIp();
    const view = await getTitleView(user.id, user.country ?? DEFAULT_COUNTRY, parsed.data, () => guardTitleFetch(user.id, ip));
    return view ? Response.json(view) : Response.json({ error: "NOT_FOUND" }, { status: 404 });
  } catch (e) {
    return catalogErrorResponse(e);
  }
}
