// Small, page-local query: the dockets behind one claim line. Not in src/lib
// because nothing else needs "records for this project whose material matches
// this claim line's material name".
import "server-only";
import { db } from "@/db";
import { records, materials } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export async function docketsForLine(projectId: string, materialName: string) {
  const [mat] = await db.select().from(materials).where(and(eq(materials.projectId, projectId), eq(materials.name, materialName)));
  if (!mat) return [];
  return db
    .select()
    .from(records)
    .where(and(
      eq(records.projectId, projectId),
      eq(records.materialId, mat.id),
      inArray(records.status, ["rule", "ticked"]),
    ))
    .orderBy(desc(records.date), desc(records.createdAt));
}
