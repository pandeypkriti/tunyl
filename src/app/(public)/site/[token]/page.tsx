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
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-[13px] font-semibold text-[color:var(--accent-hue)]">Tunyl &middot; {project.name}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-[1.15]">Photograph the docket. The office does the rest.</h1>
      </header>
      <SiteFlow token={token} materialNames={materials.map((m) => m.name)} />
    </div>
  );
}
