import { getCurrentUser } from "@/lib/auth/session";
import { exportUserData } from "@/lib/library/account";

/** The user's data as a versioned JSON file. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = {
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, country: user.country },
    titles: await exportUserData(user.id),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="tapisode-export.json"', "cache-control": "no-store" },
  });
}
