import { Types } from 'mongoose';
import type { Request } from 'express';
import { Purchase, type IPurchaseDocument } from '../../models/Purchase.js';
import { Vendor } from '../../models/Vendor.js';
import { nextDocNumber } from '../../models/Counter.js';
import { ApiError } from '../../utils/ApiError.js';
import { computeTotals, paymentStatus, type RawLineItem } from '../../utils/lineItems.js';
import { parseListParams, paginate, searchFilter } from '../../utils/paginate.js';
import { applyMovement } from '../products/products.service.js';
import type { PurchaseInput, PurchaseUpdateInput } from './purchases.validators.js';

/** Apply stock effect of a purchase. 'add' = receive (inward), 'remove' = reversal (outward, may go negative). */
async function applyPurchaseStock(
  purchase: Pick<IPurchaseDocument, 'purchaseNumber' | 'lineItems'>,
  mode: 'add' | 'remove',
  userId: string
) {
  for (const line of purchase.lineItems) {
    if (!line.product) continue;
    await applyMovement(
      line.product.toString(),
      {
        type: mode === 'add' ? 'inward' : 'outward',
        quantity: line.quantity,
        rate: line.rate,
        reference: purchase.purchaseNumber,
        note: mode === 'add' ? 'Purchase received' : 'Purchase reversal',
      },
      userId,
      mode === 'remove' // allow negative when reversing
    );
  }
}

export async function listPurchases(req: Request) {
  const params = parseListParams(req);
  const filter: Record<string, unknown> = searchFilter(params.search, [
    'purchaseNumber',
    'vendorInvoiceNumber',
  ]);
  if (typeof req.query.vendor === 'string') filter.vendor = req.query.vendor;
  if (typeof req.query.status === 'string') filter.status = req.query.status;

  const result = await paginate(Purchase, params, filter);
  const populated = await Purchase.populate(result.data, {
    path: 'vendor',
    select: 'name phone gstin',
  });
  return { ...result, data: populated };
}

export async function getPurchase(id: string) {
  const purchase = await Purchase.findById(id)
    .populate('vendor')
    .populate('lineItems.product', 'name sku unit');
  if (!purchase) throw ApiError.notFound('Purchase not found');
  return purchase;
}

export async function createPurchase(input: PurchaseInput, userId: string) {
  const vendor = await Vendor.exists({ _id: input.vendor });
  if (!vendor) throw ApiError.badRequest('Vendor not found');

  const totals = computeTotals(input.lineItems as RawLineItem[]);
  const purchaseNumber = await nextDocNumber('purchase', 'PUR');

  const purchase = await Purchase.create({
    purchaseNumber,
    vendor: new Types.ObjectId(input.vendor),
    vendorInvoiceNumber: input.vendorInvoiceNumber,
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

  await applyPurchaseStock(purchase, 'add', userId);
  return getPurchase(purchase.id);
}

export async function updatePurchase(id: string, input: PurchaseUpdateInput, userId: string) {
  const purchase = await Purchase.findById(id);
  if (!purchase) throw ApiError.notFound('Purchase not found');

  if (input.lineItems) {
    // Reconcile stock: remove old received qty, then add new.
    await applyPurchaseStock(purchase, 'remove', userId);

    const totals = computeTotals(input.lineItems as RawLineItem[]);
    purchase.lineItems = totals.lineItems.map((l) => ({
      ...l,
      product: l.product ? new Types.ObjectId(l.product) : undefined,
    })) as IPurchaseDocument['lineItems'];
    purchase.subtotal = totals.subtotal;
    purchase.gstAmount = totals.gstAmount;
    purchase.total = totals.total;
    purchase.status = paymentStatus(totals.total, purchase.amountPaid);
  }

  if (input.vendor) {
    const exists = await Vendor.exists({ _id: input.vendor });
    if (!exists) throw ApiError.badRequest('Vendor not found');
    purchase.vendor = new Types.ObjectId(input.vendor);
  }
  if (input.vendorInvoiceNumber !== undefined) purchase.vendorInvoiceNumber = input.vendorInvoiceNumber;
  if (input.date) purchase.date = input.date;
  if (input.notes !== undefined) purchase.notes = input.notes;

  await purchase.save();

  if (input.lineItems) await applyPurchaseStock(purchase, 'add', userId);
  return getPurchase(purchase.id);
}

export async function deletePurchase(id: string, userId: string) {
  const purchase = await Purchase.findById(id);
  if (!purchase) throw ApiError.notFound('Purchase not found');
  await applyPurchaseStock(purchase, 'remove', userId);
  await purchase.deleteOne();
  return purchase;
}
