// GET /api/export/xero?project=slug -> Xero bill import lines for the supplier
// dockets in this project's ledger (matched by rule or ticked). Rates are not
// invented here: UnitAmount is left at 0.00 for the office to fill in Xero.
import { NextRequest, NextResponse } from "next/server";
import { isOffice } from "@/lib/auth";
import { projectBySlug } from "@/lib/records";
import { ledgerFor } from "@/lib/ledger";
import { fmtDate } from "@/lib/units";

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
  const bills = led.dockets.filter((r) => r.type === "docket");

  let csv = csvRow(["*ContactName", "*InvoiceNumber", "*InvoiceDate", "*DueDate", "Description", "*Quantity", "*UnitAmount", "*AccountCode", "TaxType", "TrackingName1", "TrackingOption1"]);
  for (const r of bills) {
    const mat = r.materialId ? materialMap.get(r.materialId) : undefined;
    csv += csvRow([
      r.supplier,
      `DKT-${r.ref}`,
      fmtDate(r.date),
      fmtDate(r.date),
      mat?.name ?? r.materialText,
      r.qty ?? "",
      "0.00",
      "300",
      "GST on Expenses",
      "Job",
      project.name,
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-xero-bills.csv"`,
    },
  });
}
