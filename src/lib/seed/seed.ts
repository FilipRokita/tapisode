import "server-only";
import { eq } from "drizzle-orm";
import { DEFAULT_COUNTRY, TEMPLATE_USER_EMAIL } from "@/config/constants";
import { db } from "@/db/client";
import { copyLibrary } from "@/db/library";
import { user } from "@/db/schema";
import { clampPosition, lastAiredPosition } from "@/domain/progress";
import type { Command } from "@/domain/transitions";
import { auth } from "@/lib/auth";
import { ensureTitle, factsFor } from "@/lib/catalog/service";
import { applyCommand } from "@/lib/library/service";
import { TEMPLATES, type TemplateEntry } from "./template";

async function commandFor(entry: TemplateEntry, itemId: string): Promise<Command> {
  if (entry.status !== "watching" || !entry.at) return { kind: "setStatus", status: entry.status };
  const facts = await factsFor(itemId);
  if (!facts || facts.type !== "tv") return { kind: "setStatus", status: "watching" };
  const position = entry.at === "caught-up" ? lastAiredPosition(facts.seasons) : clampPosition({ season: entry.at.season, episode: entry.at.episode }, facts.seasons);
  return { kind: "jumpTo", position };
}

export async function templateExists(): Promise<boolean> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, TEMPLATE_USER_EMAIL));
  return Boolean(row);
}

/** Rebuilds the template user's lists from scratch. The provider fills the catalog cache as it goes. */
export async function seedTemplate(provider: "tmdb" | "fake"): Promise<string> {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, TEMPLATE_USER_EMAIL));
  const [row] = existing ? [existing] : await db.insert(user).values({ name: "Template", email: TEMPLATE_USER_EMAIL, country: DEFAULT_COUNTRY }).returning({ id: user.id });
  const templateId = row!.id;
  const { userMedia } = await import("@/db/schema");
  await db.delete(userMedia).where(eq(userMedia.userId, templateId));
  for (const entry of TEMPLATES[provider]) {
    const ensured = await ensureTitle(entry.ref, DEFAULT_COUNTRY);
    if (!ensured.ok) throw new Error(`Seed title not found: ${entry.ref.provider}:${entry.ref.type}:${entry.ref.externalId}`);
    const result = await applyCommand(templateId, DEFAULT_COUNTRY, entry.ref, null, await commandFor(entry, ensured.itemId));
    if (!result.ok) throw new Error(`Seed refused ${entry.ref.externalId}: ${result.error}`);
  }
  return templateId;
}

export const DEV_USER = { email: "dev@tapisode.test", password: "tapisode-dev", name: "Dev" } as const;

/** A ready-made account for local development, with the template's lists. Not created on a host. */
export async function seedDevUser(templateId: string): Promise<void> {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEV_USER.email));
  if (existing) await db.delete(user).where(eq(user.id, existing.id));
  const created = await auth.api.signUpEmail({ body: DEV_USER });
  await db.update(user).set({ country: "PL" }).where(eq(user.id, created.user.id));
  await copyLibrary(templateId, created.user.id);
}
