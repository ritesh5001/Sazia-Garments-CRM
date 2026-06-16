import { Card } from '@/components/ui/Card';
import { formatINR } from '@/lib/money';
import type { ProfitLoss } from '@/api/reports';

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex justify-between py-2 ${strong ? 'border-t border-slate-200 font-semibold' : ''}`}>
      <span className={strong ? 'text-slate-800' : 'text-slate-600'}>{label}</span>
      <span className={tone ?? 'text-slate-800'}>{value}</span>
    </div>
  );
}

export function ProfitLossView({ data }: { data?: ProfitLoss }) {
  if (!data) return <div className="text-sm text-slate-400">Loading…</div>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Trading Account</h3>
        <Row label={`Sales (net of GST) · ${data.invoiceCount} invoices`} value={formatINR(data.salesNet)} />
        <Row label={`Purchases (net of GST) · ${data.purchaseCount} bills`} value={formatINR(data.purchasesNet)} />
        <Row
          label="Gross Profit"
          value={formatINR(data.grossProfit)}
          strong
          tone={data.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />
        <div className="mt-1 text-right text-xs text-slate-400">Gross margin: {data.grossMargin}%</div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">GST Summary</h3>
        <Row label="GST Collected (output)" value={formatINR(data.gstCollected)} />
        <Row label="GST Paid (input)" value={formatINR(data.gstPaid)} />
        <Row
          label="Net GST Payable"
          value={formatINR(data.netGstPayable)}
          strong
          tone={data.netGstPayable >= 0 ? 'text-rose-600' : 'text-emerald-600'}
        />
      </Card>
    </div>
  );
}
