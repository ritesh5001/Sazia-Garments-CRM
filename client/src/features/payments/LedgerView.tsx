import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatINR, formatDate } from '@/lib/money';
import type { Ledger, LedgerEntry } from '@/types';

export function LedgerView({
  ledger,
  balanceLabel,
}: {
  ledger?: Ledger;
  balanceLabel: string;
}) {
  const columns: Column<LedgerEntry>[] = [
    { header: 'Date', cell: (e) => formatDate(e.date) },
    { header: 'Type', cell: (e) => e.type },
    { header: 'Reference', cell: (e) => e.reference },
    {
      header: 'Debit',
      className: 'text-right',
      cell: (e) => (e.debit ? formatINR(e.debit) : '—'),
    },
    {
      header: 'Credit',
      className: 'text-right',
      cell: (e) => (e.credit ? formatINR(e.credit) : '—'),
    },
    {
      header: 'Balance',
      className: 'text-right',
      cell: (e) => <span className="font-medium">{formatINR(Math.abs(e.balance))}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm">
          <span className="text-slate-500">{balanceLabel}: </span>
          <span className="font-semibold text-slate-800">
            {formatINR(Math.abs(ledger?.closingBalance ?? 0))}
          </span>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={ledger?.entries ?? []}
        rowKey={(_e) => `${_e.type}-${_e.reference}-${_e.date}`}
        emptyMessage="No ledger entries yet."
      />
    </div>
  );
}
