import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SANDBOX_CAP, TEMPLATE_USER_EMAIL } from "@/config/constants";
import { db } from "@/db/client";
import { insertRow } from "@/db/library";
import { mediaItems, rateLimit, user, userMedia } from "@/db/schema";
import { auth } from "@/lib/auth";

const base = "http://localhost:3000/api/auth";
async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return auth.handler(
    new Request(base + path, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers }, body: JSON.stringify(body) }),
  );
}
const cookieOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

let templateId = "";
const itemIds: string[] = [];

beforeAll(async () => {
  await db.delete(user);
  await db.delete(rateLimit);
  const [t] = await db.insert(user).values({ name: "Template", email: TEMPLATE_USER_EMAIL, isAnonymous: false }).returning();
  templateId = t!.id;
  for (const status of ["watching", "watchlist"] as const) {
    const [m] = await db.insert(mediaItems).values({ provider: "fake", mediaType: "movie", externalId: crypto.randomUUID() }).returning();
    itemIds.push(m!.id);
    await insertRow(templateId, m!.id, { status, position: { season: 0, episode: 0 } });
  }
});

afterAll(async () => {
  await db.delete(user);
  await db.delete(mediaItems).where(inArray(mediaItems.id, itemIds));
});

describe("sign-up", () => {
  it("stores the country from the Vercel header", async () => {
    const res = await post("/sign-up/email", { email: "pl@example.test", password: "correct horse", name: "Ola" }, { "x-vercel-ip-country": "PL", "x-forwarded-for": "10.1.0.1" });
    expect(res.status).toBe(200);
    const [row] = await db.select().from(user).where(eq(user.email, "pl@example.test"));
    expect(row!.country).toBe("PL");
  });
  it("falls back to the default country without the header", async () => {
    await post("/sign-up/email", { email: "none@example.test", password: "correct horse", name: "Nil" }, { "x-forwarded-for": "10.1.0.2" });
    const [row] = await db.select().from(user).where(eq(user.email, "none@example.test"));
    expect(row!.country).toBe("US");
  });
  it("refuses a short password", async () => {
    const res = await post("/sign-up/email", { email: "short@example.test", password: "abc", name: "S" }, { "x-forwarded-for": "10.1.0.3" });
    expect(res.status).toBe(400);
  });
});

describe("sandbox", () => {
  it("clones the template's titles into a new anonymous user", async () => {
    const res = await post("/sign-in/anonymous", {}, { "x-forwarded-for": "10.2.0.1", "x-vercel-ip-country": "DE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; isAnonymous: boolean } };
    expect(body.user.isAnonymous).toBe(true);
    const rows = await db.select().from(userMedia).where(eq(userMedia.userId, body.user.id));
    expect(rows).toHaveLength(2);
    const [row] = await db.select().from(user).where(eq(user.id, body.user.id));
    expect(row!.country).toBe("DE");
  });

  it("moves the visitor's titles to the account they sign up with", async () => {
    const anon = await post("/sign-in/anonymous", {}, { "x-forwarded-for": "10.2.0.2" });
    const anonId = ((await anon.json()) as { user: { id: string } }).user.id;
    const signup = await post("/sign-up/email", { email: "keeps@example.test", password: "correct horse", name: "Keeper" }, { cookie: cookieOf(anon), "x-forwarded-for": "10.2.0.2" });
    const newId = ((await signup.json()) as { user: { id: string } }).user.id;
    expect(newId).not.toBe(anonId);
    expect(await db.select().from(userMedia).where(eq(userMedia.userId, newId))).toHaveLength(2);
    expect(await db.select().from(user).where(eq(user.id, anonId))).toHaveLength(0);
  });

  it("refuses a new sandbox once the cap of live ones is reached", async () => {
    const [live] = await db.execute<{ n: number }>(`select count(*)::int n from "user" where is_anonymous = true` as never);
    const missing = SANDBOX_CAP - (live?.n ?? 0);
    await db.insert(user).values(Array.from({ length: missing }, (_, i) => ({ name: "Visitor", email: `cap-${i}-${crypto.randomUUID()}@example.test`, isAnonymous: true })));
    const res = await post("/sign-in/anonymous", {}, { "x-forwarded-for": "10.2.0.3" });
    expect(res.status).toBe(503);
  });
});

describe("rate limit", () => {
  it("allows only a few sandboxes per hour from one IP", async () => {
    await db.delete(user).where(eq(user.isAnonymous, true)); // the cap test above left the sandboxes full
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await post("/sign-in/anonymous", {}, { "x-forwarded-for": "10.4.0.9" })).status);
    expect(codes.filter((c) => c === 200)).toHaveLength(3);
    expect(codes.slice(3)).toEqual([429, 429]);
  });

  it("limits sign-in per IP when it goes through the handler, and counts other IPs separately", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await post("/sign-in/email", { email: "pl@example.test", password: "wrong-password" }, { "x-forwarded-for": "10.3.0.1" })).status);
    expect(codes.slice(0, 3)).not.toContain(429);
    expect(codes).toContain(429);
    const other = await post("/sign-in/email", { email: "pl@example.test", password: "wrong-password" }, { "x-forwarded-for": "10.3.0.2" });
    expect(other.status).not.toBe(429);
  });
});
