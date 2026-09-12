import { notFound } from "next/navigation";
import { projectBySiteToken, materialsFor } from "@/lib/records";
import { SiteFlow } from "@/components/site/site-flow";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await projectBySiteToken(token);
  return { title: project ? project.name : "Site" };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await projectBySiteToken(token);
  if (!project) notFound();

  const materials = await materialsFor(project.id);

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
        <header className="mb-6">
          <p className="mono text-[13px] font-medium text-[color:var(--primary)]">Tunyl &middot; {project.name}</p>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.01em]">Photograph the docket</h1>
          <p className="mt-1.5 text-[14px] text-[color:var(--ink-2)]">The paper the driver handed you at the gate. Tunyl reads it and the office does the rest. Nothing to type.</p>
        </header>
        <SiteFlow token={token} materialNames={materials.map((m) => m.name)} />
      </div>
    </div>
  );
}
