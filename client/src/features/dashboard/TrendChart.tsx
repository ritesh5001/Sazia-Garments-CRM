import { formatINR } from '@/lib/money';

interface TrendPoint {
  label: string;
  sales: number;
  purchases: number;
}

// Lightweight CSS bar chart (no chart library dependency).
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.sales, d.purchases]));

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" /> Sales
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> Purchases
        </span>
      </div>
      <div className="flex h-44 items-end justify-between gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t bg-brand-500"
                style={{ height: `${(d.sales / max) * 100}%` }}
                title={`Sales: ${formatINR(d.sales)}`}
              />
              <div
                className="w-1/2 rounded-t bg-amber-400"
                style={{ height: `${(d.purchases / max) * 100}%` }}
                title={`Purchases: ${formatINR(d.purchases)}`}
              />
            </div>
            <span className="text-xs text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
