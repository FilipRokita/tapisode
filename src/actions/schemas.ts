import { z } from "zod";
import { STATUSES } from "@/domain/types";

export const titleRefSchema = z.object({
  provider: z.string().min(1).max(20),
  type: z.enum(["tv", "movie"]),
  externalId: z.string().min(1).max(40),
});

const positionSchema = z.object({ season: z.number().int().min(0).max(1000), episode: z.number().int().min(0).max(10_000) });
const stateSchema = z.object({ status: z.enum(STATUSES), position: positionSchema });

const commandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plusOne") }),
  z.object({ kind: z.literal("setStatus"), status: z.enum(STATUSES) }),
  z.object({ kind: z.literal("jumpTo"), position: positionSchema }),
  z.object({ kind: z.literal("restore"), state: stateSchema.nullable() }),
]);

/** What the client sends to change a title: the title, the state it saw, and what to do. */
export const changeTitleSchema = z.object({ ref: titleRefSchema, expected: stateSchema.nullable(), command: commandSchema });
export type ChangeTitleInput = z.infer<typeof changeTitleSchema>;

export const countrySchema = z.object({ country: z.string().regex(/^[A-Z]{2}$/) });
export const searchQuerySchema = z.object({ q: z.string().trim().min(2).max(100), page: z.coerce.number().int().min(1).max(500).default(1) });
export const titleQuerySchema = titleRefSchema.extend({ externalId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/) });
