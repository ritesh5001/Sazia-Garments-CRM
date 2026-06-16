import { Invoice } from '../../models/Invoice.js';
import { Purchase } from '../../models/Purchase.js';
import { Payment } from '../../models/Payment.js';
import { Customer } from '../../models/Customer.js';
import { Vendor } from '../../models/Vendor.js';
import { ApiError } from '../../utils/ApiError.js';

export interface LedgerEntry {
  date: Date;
  type: string;
  reference: string;
  debit: number; // paise
  credit: number; // paise
  balance: number; // running balance (paise)
}

export interface Ledger {
  party: { _id: string; name: string };
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number; // receivable (customer) / payable (vendor), positive = outstanding
}

/**
 * Customer ledger. Debits increase receivable (opening balance, invoices);
 * credits reduce it (incoming payments). Closing balance = amount receivable.
 */
export async function customerLedger(customerId: string): Promise<Ledger> {
  const customer = await Customer.findById(customerId);
  if (!customer) throw ApiError.notFound('Customer not found');

  const [invoices, payments] = await Promise.all([
    Invoice.find({ customer: customerId }).sort('date').lean(),
    Payment.find({ direction: 'incoming', party: customerId }).sort('date').lean(),
  ]);

  const raw: Omit<LedgerEntry, 'balance'>[] = [];
  raw.push({
    date: customer.get('createdAt') as Date,
    type: 'Opening Balance',
    reference: '—',
    debit: Math.max(0, customer.openingBalance),
    credit: Math.max(0, -customer.openingBalance),
  });
  for (const inv of invoices) {
    raw.push({ date: inv.date, type: 'Invoice', reference: inv.invoiceNumber, debit: inv.total, credit: 0 });
  }
  for (const pay of payments) {
    raw.push({
      date: pay.date,
      type: `Payment (${pay.mode})`,
      reference: pay.paymentNumber,
      debit: 0,
      credit: pay.amount,
    });
  }

  return buildLedger({ _id: customer.id, name: customer.name }, raw, 'debit');
}

/**
 * Vendor ledger. Credits increase payable (opening balance, purchases);
 * debits reduce it (outgoing payments). Closing balance = amount payable.
 */
export async function vendorLedger(vendorId: string): Promise<Ledger> {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw ApiError.notFound('Vendor not found');

  const [purchases, payments] = await Promise.all([
    Purchase.find({ vendor: vendorId }).sort('date').lean(),
    Payment.find({ direction: 'outgoing', party: vendorId }).sort('date').lean(),
  ]);

  const raw: Omit<LedgerEntry, 'balance'>[] = [];
  raw.push({
    date: vendor.get('createdAt') as Date,
    type: 'Opening Balance',
    reference: '—',
    debit: Math.max(0, -vendor.openingBalance),
    credit: Math.max(0, vendor.openingBalance),
  });
  for (const pur of purchases) {
    raw.push({ date: pur.date, type: 'Purchase', reference: pur.purchaseNumber, debit: 0, credit: pur.total });
  }
  for (const pay of payments) {
    raw.push({
      date: pay.date,
      type: `Payment (${pay.mode})`,
      reference: pay.paymentNumber,
      debit: pay.amount,
      credit: 0,
    });
  }

  return buildLedger({ _id: vendor.id, name: vendor.name }, raw, 'credit');
}

function buildLedger(
  party: { _id: string; name: string },
  raw: Omit<LedgerEntry, 'balance'>[],
  positiveSide: 'debit' | 'credit'
): Ledger {
  raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = 0;
  const entries: LedgerEntry[] = raw.map((e) => {
    running += positiveSide === 'debit' ? e.debit - e.credit : e.credit - e.debit;
    return { ...e, balance: running };
  });
  const totalDebit = raw.reduce((s, e) => s + e.debit, 0);
  const totalCredit = raw.reduce((s, e) => s + e.credit, 0);
  return { party, entries, totalDebit, totalCredit, closingBalance: running };
}

async function sumField(model: typeof Invoice | typeof Purchase, field: string, match = {}) {
  const [row] = await model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return row?.total ?? 0;
}

async function sumPayments(direction: 'incoming' | 'outgoing') {
  const [row] = await Payment.aggregate([
    { $match: { direction } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row?.total ?? 0;
}

async function sumOpening(model: typeof Customer | typeof Vendor) {
  const [row] = await model.aggregate([
    { $group: { _id: null, total: { $sum: '$openingBalance' } } },
  ]);
  return row?.total ?? 0;
}

/** Aggregate financial position used by ledgers and the dashboard. */
export async function financialSummary() {
  const [totalSales, totalPurchases, received, paid, custOpening, vendOpening] = await Promise.all([
    sumField(Invoice, 'total'),
    sumField(Purchase, 'total'),
    sumPayments('incoming'),
    sumPayments('outgoing'),
    sumOpening(Customer),
    sumOpening(Vendor),
  ]);

  return {
    totalSales,
    totalPurchases,
    totalReceived: received,
    totalPaid: paid,
    receivables: custOpening + totalSales - received,
    payables: vendOpening + totalPurchases - paid,
  };
}
