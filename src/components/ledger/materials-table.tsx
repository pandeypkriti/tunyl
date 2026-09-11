import type { LedgerMaterial } from "@/lib/ledger";
import { fmt } from "@/lib/units";

const GAP_CLASS: Record<LedgerMaterial["gap"]["kind"], string> = {
  hold: "hold",
  ok: "clear",
  none: "neutral",
  done: "neutral",
};

export function MaterialsTable({ materials }: { materials: LedgerMaterial[] }) {
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Unit</th>
            <th className="num">Ordered</th>
            <th className="num">Delivered</th>
            <th className="num">Invoiced</th>
            <th className="num">Claimed</th>
            <th>Gap</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <td><b>{m.name}</b></td>
              <td>{m.unit}</td>
              <td className="num">{fmt(m.ordered)}</td>
              <td className="num">{fmt(m.delivered, 2)}</td>
              <td className="num">{fmt(m.invoiced, 2)}</td>
              <td className="num">{fmt(m.claimed, 2)}</td>
              <td><span className={`chip wrap ${GAP_CLASS[m.gap.kind]}`}>{m.gap.text}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
