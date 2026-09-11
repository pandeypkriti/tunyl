import Link from "next/link";
import { allProjects } from "@/lib/ledger";
export const metadata = { title: "Projects" };
export default async function ProjectsPage() {
  const ps = await allProjects();
  return (
    <div>
      <h1 className="text-[22px]">Projects</h1>
      <ul className="mt-4 grid gap-2">
        {ps.map((p) => <li key={p.id}><Link className="text-[color:var(--tint-ink)] underline" href={`/projects/${p.slug}`}>{p.name}</Link> <span className="text-[color:var(--ink2)]">{p.client}</span></li>)}
      </ul>
    </div>
  );
}
