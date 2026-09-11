// GET /api/export/dockets?project=slug -> a CSV of every docket behind that
// project's ledger, matched by rule or ticked by a person. Never invents a row.
import { NextRequest, NextResponse } from "next/server";
import { isOffice } from "@/lib/auth";
import { projectBySlug } from "@/lib/records";
import { ledgerFor } from "@/lib/ledger";
import { fmt, fmtDate } from "@/lib/units";

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(cells: Array<string | number>): string {
  return `${cells.map(csvCell).join(",")}\r\n`;
}

export async function GET(req: NextRequest) {
  if (!(await isOffice())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("project") || "";
  const project = await projectBySlug(slug);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const led = await ledgerFor(project.id);
  const materialMap = new Map(led.materials.map((m) => [m.id, m]));

  let csv = csvRow(["Date", "Docket", "Supplier", "Material", "Quantity", "Unit", "In contract units", "How it got in", "Ticked by", "Project"]);
  for (const r of led.dockets) {
    const mat = r.materialId ? materialMap.get(r.materialId) : undefined;
    const inContract = r.qtyContract != null && mat && r.unit !== mat.unit ? `${fmt(r.qtyContract, 2)} ${mat.unit}` : "";
    csv += csvRow([
      fmtDate(r.date),
      r.ref || r.title,
      r.supplier,
      mat?.name ?? r.materialText,
      r.qty ?? "",
      r.unit,
      inContract,
      r.status === "rule" ? "By rule" : "Ticked",
      r.tickedBy || "",
      project.name,
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-dockets.csv"`,
    },
  });
}
