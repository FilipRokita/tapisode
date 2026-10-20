import "server-only";
import { demoTitles } from "@/lib/catalog/demo";

/** The landing page's demo data. It needs no session and no database, so the landing stays static. */
export const loadDemo = demoTitles;
