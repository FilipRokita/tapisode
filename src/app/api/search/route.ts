import { searchQuerySchema } from "@/actions/schemas";
import { getCurrentUser } from "@/lib/auth/session";
import { searchTitles } from "@/lib/catalog/search";
import { catalogErrorResponse } from "@/lib/http-errors";
import { getClientIp } from "@/lib/http";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = searchQuerySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    return Response.json(await searchTitles(user.id, await getClientIp(), parsed.data.q, parsed.data.page));
  } catch (e) {
    return catalogErrorResponse(e);
  }
}
