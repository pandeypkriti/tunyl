// GET /api/export/xero?project=slug -> Xero bill import lines for the supplier
// dockets in this project's ledger (matched by rule or ticked).
// UnitAmount comes from the purchase order rate for that material and supplier; 0.00 when there is no order on file.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const pos = await db.select().from(purchaseOrders).where(eq(purchaseOrders.projectId, project.id));
  const rateFor = (materialId: string | null, supplier: string) => {
    const po = pos.find((p) => p.materialId === materialId && p.supplier === supplier) || pos.find((p) => p.materialId === materialId);
    return po ? po.rate.toFixed(2) : "0.00";
  };

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
      rateFor(r.materialId, r.supplier),
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
