import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InvoiceStatusBadge } from '@/features/invoices/statusBadge';
import { getPurchase } from '@/api/purchases';
import { formatINR, formatDate } from '@/lib/money';

export function PurchaseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => getPurchase(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!purchase) return <div className="text-sm text-slate-500">Purchase not found.</div>;

  const vendor = typeof purchase.vendor === 'string' ? null : purchase.vendor;
  const balance = purchase.total - purchase.amountPaid;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/purchases')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-semibold text-slate-800">{purchase.purchaseNumber}</h1>
          <InvoiceStatusBadge status={purchase.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/purchases/${purchase._id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={15} /> Print
          </Button>
        </div>
      </div>

      <Card className="print-area p-8">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-700">Purchase Record</h2>
            <p className="text-sm text-slate-500">Sazia Garments</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-lg font-semibold text-slate-800">{purchase.purchaseNumber}</div>
            <div className="text-slate-500">Date: {formatDate(purchase.date)}</div>
            {purchase.vendorInvoiceNumber && (
              <div className="text-slate-500">Vendor Bill: {purchase.vendorInvoiceNumber}</div>
            )}
          </div>
        </div>

        <div className="py-6">
          <div className="text-xs uppercase tracking-wide text-slate-400">Vendor</div>
          <div className="mt-1 font-medium text-slate-800">{vendor?.name ?? '—'}</div>
          {vendor?.phone && <div className="text-sm text-slate-500">{vendor.phone}</div>}
          {vendor?.gstin && <div className="text-sm text-slate-500">GSTIN: {vendor.gstin}</div>}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Rate</th>
              <th className="py-2 pr-2 text-right">Taxable</th>
              <th className="py-2 pr-2 text-right">GST%</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchase.lineItems.map((l, i) => (
              <tr key={i} className="text-slate-700">
                <td className="py-2 pr-2">{i + 1}</td>
                <td className="py-2 pr-2">{l.description}</td>
                <td className="py-2 pr-2 text-right">{l.quantity}</td>
                <td className="py-2 pr-2 text-right">{formatINR(l.rate)}</td>
                <td className="py-2 pr-2 text-right">{formatINR(l.taxableValue)}</td>
                <td className="py-2 pr-2 text-right">{l.gstRate}%</td>
                <td className="py-2 text-right">{formatINR(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatINR(purchase.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST</span>
              <span>{formatINR(purchase.gstAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>{formatINR(purchase.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Paid</span>
              <span>{formatINR(purchase.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-medium text-rose-600">
              <span>Balance Payable</span>
              <span>{formatINR(balance)}</span>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
            <span className="font-medium text-slate-600">Notes: </span>
            {purchase.notes}
          </div>
        )}
      </Card>
    </div>
  );
}
