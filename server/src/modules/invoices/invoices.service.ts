import { Types } from 'mongoose';
import type { Request } from 'express';
import { Invoice, type IInvoiceDocument } from '../../models/Invoice.js';
import { Customer } from '../../models/Customer.js';
import { nextDocNumber } from '../../models/Counter.js';
import { ApiError } from '../../utils/ApiError.js';
import { computeTotals, paymentStatus, type RawLineItem } from '../../utils/lineItems.js';
import { parseListParams, paginate, searchFilter } from '../../utils/paginate.js';
import { applyMovement, assertStockAvailable } from '../products/products.service.js';
import type { InvoiceInput, InvoiceUpdateInput } from './invoices.validators.js';

/** Apply stock effect of an invoice's line items. 'deduct' = sale (outward), 'restore' = reversal (inward). */
async function applyInvoiceStock(
  invoice: Pick<IInvoiceDocument, 'invoiceNumber' | 'lineItems'>,
  mode: 'deduct' | 'restore',
  userId: string
) {
  for (const line of invoice.lineItems) {
    if (!line.product) continue;
    await applyMovement(
      line.product.toString(),
      {
        type: mode === 'deduct' ? 'outward' : 'inward',
        quantity: line.quantity,
        rate: line.rate,
        reference: invoice.invoiceNumber,
        note: mode === 'deduct' ? 'Invoice sale' : 'Invoice reversal',
      },
      userId
    );
  }
}

export async function listInvoices(req: Request) {
  const params = parseListParams(req);
  const filter: Record<string, unknown> = searchFilter(params.search, ['invoiceNumber']);
  if (typeof req.query.customer === 'string') filter.customer = req.query.customer;
  if (typeof req.query.status === 'string') filter.status = req.query.status;

  const result = await paginate(Invoice, params, filter);
  const populated = await Invoice.populate(result.data, {
    path: 'customer',
    select: 'name phone gstin',
  });
  return { ...result, data: populated };
}

export async function getInvoice(id: string) {
  const invoice = await Invoice.findById(id).populate('customer').populate('lineItems.product', 'name sku unit');
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

export async function createInvoice(input: InvoiceInput, userId: string) {
  const customer = await Customer.exists({ _id: input.customer });
  if (!customer) throw ApiError.badRequest('Customer not found');

  await assertStockAvailable(input.lineItems);

  const totals = computeTotals(input.lineItems as RawLineItem[]);
  const invoiceNumber = await nextDocNumber('invoice', 'INV');

  const invoice = await Invoice.create({
    invoiceNumber,
    customer: new Types.ObjectId(input.customer),
    date: input.date ?? new Date(),
    lineItems: totals.lineItems.map((l) => ({
      ...l,
      product: l.product ? new Types.ObjectId(l.product) : undefined,
    })),
    subtotal: totals.subtotal,
    gstAmount: totals.gstAmount,
    total: totals.total,
    amountPaid: 0,
    status: paymentStatus(totals.total, 0),
    notes: input.notes,
    createdBy: new Types.ObjectId(userId),
  });

  await applyInvoiceStock(invoice, 'deduct', userId);
  return getInvoice(invoice.id);
}

export async function updateInvoice(id: string, input: InvoiceUpdateInput, userId: string) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw ApiError.notFound('Invoice not found');

  // If line items change, reconcile stock: restore old, then deduct new.
  if (input.lineItems) {
    await assertStockAvailable(input.lineItems);
    await applyInvoiceStock(invoice, 'restore', userId);

    const totals = computeTotals(input.lineItems as RawLineItem[]);
    invoice.lineItems = totals.lineItems.map((l) => ({
      ...l,
      product: l.product ? new Types.ObjectId(l.product) : undefined,
    })) as IInvoiceDocument['lineItems'];
    invoice.subtotal = totals.subtotal;
    invoice.gstAmount = totals.gstAmount;
    invoice.total = totals.total;
    invoice.status = paymentStatus(totals.total, invoice.amountPaid);
  }

  if (input.customer) {
    const exists = await Customer.exists({ _id: input.customer });
    if (!exists) throw ApiError.badRequest('Customer not found');
    invoice.customer = new Types.ObjectId(input.customer);
  }
  if (input.date) invoice.date = input.date;
  if (input.notes !== undefined) invoice.notes = input.notes;

  await invoice.save();

  if (input.lineItems) await applyInvoiceStock(invoice, 'deduct', userId);
  return getInvoice(invoice.id);
}

export async function deleteInvoice(id: string, userId: string) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  await applyInvoiceStock(invoice, 'restore', userId);
  await invoice.deleteOne();
  return invoice;
}
