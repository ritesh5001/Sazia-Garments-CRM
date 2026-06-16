import type { Request } from 'express';
import { Invoice } from '../../models/Invoice.js';
import { Purchase } from '../../models/Purchase.js';
import { Payment } from '../../models/Payment.js';
import { Product } from '../../models/Product.js';
import { Customer } from '../../models/Customer.js';
import { Vendor } from '../../models/Vendor.js';

interface PartyName {
  name?: string;
}

/** Build a { date: { $gte, $lte } } filter from ?from & ?to query params. */
function dateRange(req: Request): Record<string, unknown> {
  const { from, to } = req.query;
  const range: Record<string, Date> = {};
  if (typeof from === 'string' && from) range.$gte = new Date(from);
  if (typeof to === 'string' && to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? { date: range } : {};
}

export async function salesReport(req: Request) {
  const filter = dateRange(req);
  if (typeof req.query.customer === 'string' && req.query.customer) filter.customer = req.query.customer;

  const invoices = await Invoice.find(filter).sort('date').populate('customer', 'name').lean();
  const rows = invoices.map((i) => ({
    reference: i.invoiceNumber,
    date: i.date,
    party: (i.customer as PartyName)?.name ?? '—',
    subtotal: i.subtotal,
    gst: i.gstAmount,
    total: i.total,
    paid: i.amountPaid,
    balance: i.total - i.amountPaid,
    status: i.status,
  }));
  const summary = {
    count: rows.length,
    subtotal: sum(rows, 'subtotal'),
    gst: sum(rows, 'gst'),
    total: sum(rows, 'total'),
    paid: sum(rows, 'paid'),
    balance: sum(rows, 'balance'),
  };
  return { rows, summary };
}

export async function purchasesReport(req: Request) {
  const filter = dateRange(req);
  if (typeof req.query.vendor === 'string' && req.query.vendor) filter.vendor = req.query.vendor;

  const purchases = await Purchase.find(filter).sort('date').populate('vendor', 'name').lean();
  const rows = purchases.map((p) => ({
    reference: p.purchaseNumber,
    date: p.date,
    party: (p.vendor as PartyName)?.name ?? '—',
    subtotal: p.subtotal,
    gst: p.gstAmount,
    total: p.total,
    paid: p.amountPaid,
    balance: p.total - p.amountPaid,
    status: p.status,
  }));
  const summary = {
    count: rows.length,
    subtotal: sum(rows, 'subtotal'),
    gst: sum(rows, 'gst'),
    total: sum(rows, 'total'),
    paid: sum(rows, 'paid'),
    balance: sum(rows, 'balance'),
  };
  return { rows, summary };
}

export async function paymentsReport(req: Request) {
  const filter = dateRange(req);
  if (typeof req.query.direction === 'string' && req.query.direction) filter.direction = req.query.direction;
  if (typeof req.query.mode === 'string' && req.query.mode) filter.mode = req.query.mode;

  const payments = await Payment.find(filter).sort('date').populate('party', 'name').lean();
  const rows = payments.map((p) => ({
    reference: p.paymentNumber,
    date: p.date,
    direction: p.direction,
    party: (p.party as PartyName)?.name ?? '—',
    mode: p.mode,
    note: p.reference ?? '',
    amount: p.amount,
  }));
  const summary = {
    count: rows.length,
    incoming: rows.filter((r) => r.direction === 'incoming').reduce((s, r) => s + r.amount, 0),
    outgoing: rows.filter((r) => r.direction === 'outgoing').reduce((s, r) => s + r.amount, 0),
  };
  return { rows, summary };
}

export async function inventoryReport() {
  const products = await Product.find().sort('name').lean();
  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku ?? '',
    unit: p.unit,
    currentStock: p.currentStock,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    valueAtCost: p.currentStock * p.costPrice,
    valueAtSelling: p.currentStock * p.sellingPrice,
    lowStock: p.currentStock <= p.reorderLevel,
  }));
  const summary = {
    count: rows.length,
    totalUnits: rows.reduce((s, r) => s + r.currentStock, 0),
    valueAtCost: sum(rows, 'valueAtCost'),
    valueAtSelling: sum(rows, 'valueAtSelling'),
    lowStockCount: rows.filter((r) => r.lowStock).length,
  };
  return { rows, summary };
}

export async function customersReport() {
  const [customers, invAgg, payAgg] = await Promise.all([
    Customer.find().sort('name').lean(),
    Invoice.aggregate([{ $group: { _id: '$customer', sales: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { direction: 'incoming' } },
      { $group: { _id: '$party', received: { $sum: '$amount' } } },
    ]),
  ]);
  const salesMap = new Map(invAgg.map((r) => [String(r._id), r]));
  const payMap = new Map(payAgg.map((r) => [String(r._id), r.received]));

  const rows = customers.map((c) => {
    const sales = salesMap.get(String(c._id))?.sales ?? 0;
    const received = payMap.get(String(c._id)) ?? 0;
    return {
      name: c.name,
      phone: c.phone ?? '',
      orders: salesMap.get(String(c._id))?.count ?? 0,
      sales,
      received,
      outstanding: c.openingBalance + sales - received,
    };
  });
  const summary = {
    count: rows.length,
    sales: sum(rows, 'sales'),
    received: sum(rows, 'received'),
    outstanding: sum(rows, 'outstanding'),
  };
  return { rows, summary };
}

export async function vendorsReport() {
  const [vendors, purAgg, payAgg] = await Promise.all([
    Vendor.find().sort('name').lean(),
    Purchase.aggregate([{ $group: { _id: '$vendor', purchases: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { direction: 'outgoing' } },
      { $group: { _id: '$party', paid: { $sum: '$amount' } } },
    ]),
  ]);
  const purMap = new Map(purAgg.map((r) => [String(r._id), r]));
  const payMap = new Map(payAgg.map((r) => [String(r._id), r.paid]));

  const rows = vendors.map((v) => {
    const purchases = purMap.get(String(v._id))?.purchases ?? 0;
    const paid = payMap.get(String(v._id)) ?? 0;
    return {
      name: v.name,
      phone: v.phone ?? '',
      bills: purMap.get(String(v._id))?.count ?? 0,
      purchases,
      paid,
      outstanding: v.openingBalance + purchases - paid,
    };
  });
  const summary = {
    count: rows.length,
    purchases: sum(rows, 'purchases'),
    paid: sum(rows, 'paid'),
    outstanding: sum(rows, 'outstanding'),
  };
  return { rows, summary };
}

export async function profitLoss(req: Request) {
  const filter = dateRange(req);
  const [invoices, purchases] = await Promise.all([
    Invoice.find(filter).lean(),
    Purchase.find(filter).lean(),
  ]);

  const salesNet = invoices.reduce((s, i) => s + i.subtotal, 0);
  const gstCollected = invoices.reduce((s, i) => s + i.gstAmount, 0);
  const purchasesNet = purchases.reduce((s, p) => s + p.subtotal, 0);
  const gstPaid = purchases.reduce((s, p) => s + p.gstAmount, 0);
  const grossProfit = salesNet - purchasesNet;

  return {
    salesNet,
    purchasesNet,
    grossProfit,
    grossMargin: salesNet > 0 ? Math.round((grossProfit / salesNet) * 1000) / 10 : 0,
    gstCollected,
    gstPaid,
    netGstPayable: gstCollected - gstPaid,
    invoiceCount: invoices.length,
    purchaseCount: purchases.length,
  };
}

function sum<T extends Record<string, unknown>>(rows: T[], key: keyof T): number {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}
