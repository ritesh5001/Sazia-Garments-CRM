import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { reportsApi, type DateFilter } from '@/api/reports';
import { REPORT_TABS, REPORT_COLUMNS, type ReportKey, type ReportColumn } from './reportConfig';
import { ProfitLossView } from './ProfitLossView';
import { formatINR, formatDate, toRupees } from '@/lib/money';
import { downloadCSV } from '@/lib/csv';
import { cn } from '@/lib/cn';

function fetchReport(tab: ReportKey, filter: DateFilter): Promise<unknown> {
  switch (tab) {
    case 'sales':
      return reportsApi.sales(filter);
    case 'purchases':
      return reportsApi.purchases(filter);
    case 'payments':
      return reportsApi.payments(filter);
    case 'inventory':
      return reportsApi.inventory();
    case 'customers':
      return reportsApi.customers();
    case 'vendors':
      return reportsApi.vendors();
    case 'profit-loss':
      return reportsApi.profitLoss(filter);
  }
}

function formatCell(col: ReportColumn, row: Record<string, unknown>) {
  const value = row[col.key];
  if (col.money) return formatINR(Number(value) || 0);
  if (col.key === 'date') return formatDate(value as string);
  return String(value ?? '—');
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportKey>('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const tabMeta = REPORT_TABS.find((t) => t.key === tab)!;
  const filter: DateFilter = tabMeta.hasDateFilter ? { from: from || undefined, to: to || undefined } : {};

  const { data, isLoading } = useQuery({
    queryKey: ['report', tab, filter],
    queryFn: () => fetchReport(tab, filter),
  });

  const isPnl = tab === 'profit-loss';
  const columns = isPnl ? [] : REPORT_COLUMNS[tab];
  const result = isPnl ? null : (data as { rows: Record<string, unknown>[]; summary: Record<string, unknown> } | undefined);
  const rows = result?.rows ?? [];

  const exportCsv = useMemo(
    () => () => {
      if (isPnl) {
        const pnl = data as Record<string, number>;
        downloadCSV(
          'profit-loss',
          [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value (₹)' },
          ],
          [
            { metric: 'Sales (net)', value: toRupees(pnl.salesNet) },
            { metric: 'Purchases (net)', value: toRupees(pnl.purchasesNet) },
            { metric: 'Gross Profit', value: toRupees(pnl.grossProfit) },
            { metric: 'GST Collected', value: toRupees(pnl.gstCollected) },
            { metric: 'GST Paid', value: toRupees(pnl.gstPaid) },
            { metric: 'Net GST Payable', value: toRupees(pnl.netGstPayable) },
          ]
        );
        return;
      }
      const csvCols = columns.map((c) => ({ key: c.key, label: c.label }));
      const csvRows = rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const c of columns) {
          out[c.key] = c.money ? toRupees(Number(r[c.key]) || 0) : c.key === 'date' ? formatDate(r[c.key] as string) : r[c.key];
        }
        return out;
      });
      downloadCSV(`${tab}-report`, csvCols, csvRows);
    },
    [isPnl, data, columns, rows, tab]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales, purchases, payments, inventory, parties and P&L."
        actions={
          <div className="flex gap-2 no-print">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Button>
            <Button onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-slate-200 no-print">
        {REPORT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabMeta.hasDateFilter && (
        <div className="flex flex-wrap items-end gap-3 no-print">
          <div className="w-40">
            <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(from || to) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFrom('');
                setTo('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <Card className="p-12 text-center text-sm text-slate-400">Loading…</Card>
      ) : isPnl ? (
        <ProfitLossView data={data as never} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {columns.map((c) => (
                  <th key={c.key} className={cn('px-4 py-3', c.align === 'right' && 'text-right')}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                    No data for this report.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="text-slate-700">
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-2.5', c.align === 'right' && 'text-right')}>
                        {formatCell(c, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {result && rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                  {columns.map((c, idx) => (
                    <td key={c.key} className={cn('px-4 py-3', c.align === 'right' && 'text-right')}>
                      {idx === 0
                        ? `Total (${rows.length})`
                        : c.money && result.summary[c.key] !== undefined
                          ? formatINR(Number(result.summary[c.key]))
                          : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </Card>
      )}
    </div>
  );
}
