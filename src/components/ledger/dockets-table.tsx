import type { RecordRow } from "@/db/schema";
import { fmt, fmtDate } from "@/lib/units";

export type DocketRow = { record: RecordRow; materialName: string; converted: string | null };

function howItGotIn(r: RecordRow): { cls: string; text: string } {
  if (r.status === "rule") return { cls: "clear", text: "By rule" };
  return { cls: "check", text: `Ticked by ${r.tickedBy || "the office"}` };
}

export function DocketsTable({ rows }: { rows: DocketRow[] }) {
  if (rows.length === 0) {
    return <p className="text-[14px] text-[color:var(--ink2)]">No dockets have entered the ledger yet.</p>;
  }
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Docket</th>
            <th>Supplier</th>
            <th>Material</th>
            <th className="num">Quantity</th>
            <th>How it got in</th>
            <th>Photo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ record: r, materialName, converted }) => {
            const how = howItGotIn(r);
            return (
              <tr key={r.id}>
                <td>{fmtDate(r.date)}</td>
                <td>{r.ref || r.title}</td>
                <td>{r.supplier}</td>
                <td>{materialName}</td>
                <td className="num">
                  {fmt(r.qty, 2)} {r.unit}
                  {converted && <span className="sub">{converted} in contract units</span>}
                </td>
                <td><span className={`chip ${how.cls}`}>{how.text}</span></td>
                <td>
                  {r.imageUrl ? (
                    <a href={r.imageUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[color:var(--tint-ink)] underline-offset-2 hover:underline focus-visible:underline">
                      Photo
                    </a>
                  ) : (
                    <span className="text-[color:var(--ink2)]">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
