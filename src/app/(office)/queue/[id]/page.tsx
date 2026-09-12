import { notFound } from "next/navigation";
import { recordById, materialsFor } from "@/lib/records";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RecordView } from "@/components/queue/record-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await recordById(id);
  return { title: record?.title || "Record" };
}

export default async function QueueRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await recordById(id);
  if (!record) notFound();

  const [projectRows, materials] = await Promise.all([
    db.select().from(projects).where(eq(projects.id, record.projectId)),
    materialsFor(record.projectId),
  ]);
  const project = projectRows[0];
  if (!project) notFound();

  return <RecordView record={record} project={project} materials={materials} />;
}
