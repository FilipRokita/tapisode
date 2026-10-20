import { getCurrentUser } from "@/lib/auth/session";
import { popularTitles } from "@/lib/catalog/search";
import { catalogErrorResponse } from "@/lib/http-errors";
import { getClientIp } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return Response.json({ rows: await popularTitles(user.id, await getClientIp()) });
  } catch (e) {
    return catalogErrorResponse(e);
  }
}
