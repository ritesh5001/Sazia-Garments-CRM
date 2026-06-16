import { Types } from 'mongoose';
import type { Request } from 'express';
import { Payment, type IPaymentAllocation } from '../../models/Payment.js';
import { Invoice } from '../../models/Invoice.js';
import { Purchase } from '../../models/Purchase.js';
import { Customer } from '../../models/Customer.js';
import { Vendor } from '../../models/Vendor.js';
import { nextDocNumber } from '../../models/Counter.js';
import { ApiError } from '../../utils/ApiError.js';
import { paymentStatus } from '../../utils/lineItems.js';
import { parseListParams, paginate, searchFilter } from '../../utils/paginate.js';
import type { PaymentInput } from './payments.validators.js';

/** Load an allocation target (invoice or purchase) by type. */
function findDoc(docType: 'invoice' | 'purchase', id: string) {
  return docType === 'invoice' ? Invoice.findById(id) : Purchase.findById(id);
}

/** Apply (sign = +1) or reverse (sign = -1) a payment's allocations against its target documents. */
async function applyAllocations(allocations: IPaymentAllocation[], sign: 1 | -1) {
  for (const alloc of allocations) {
    const doc = await findDoc(alloc.docType, alloc.doc.toString());
    if (!doc) continue;
    doc.amountPaid = Math.max(0, doc.amountPaid + sign * alloc.amount);
    doc.status = paymentStatus(doc.total, doc.amountPaid);
    await doc.save();
  }
}

export async function createPayment(input: PaymentInput, userId: string) {
  const isIncoming = input.direction === 'incoming';
  const partyType = isIncoming ? 'Customer' : 'Vendor';
  const expectedDocType = isIncoming ? 'invoice' : 'purchase';

  // Party must exist and match direction.
  const partyExists = isIncoming
    ? await Customer.exists({ _id: input.party })
    : await Vendor.exists({ _id: input.party });
  if (!partyExists) throw ApiError.badRequest(`${partyType} not found`);

  // Validate allocations: correct doc type, belongs to party, within remaining balance.
  let allocatedTotal = 0;
  for (const alloc of input.allocations) {
    if (alloc.docType !== expectedDocType) {
      throw ApiError.badRequest(`${input.direction} payments can only settle ${expectedDocType}s`);
    }
    const doc = await findDoc(alloc.docType, alloc.doc);
    if (!doc) throw ApiError.badRequest('Allocation target not found');

    const partyField = isIncoming
      ? (doc as { customer: Types.ObjectId }).customer
      : (doc as { vendor: Types.ObjectId }).vendor;
    if (partyField.toString() !== input.party) {
      throw ApiError.badRequest('Allocation does not belong to the selected party');
    }
    const remaining = doc.total - doc.amountPaid;
    if (alloc.amount > remaining) {
      throw ApiError.badRequest(
        `Allocation of ${alloc.amount} exceeds remaining balance ${remaining} on ${expectedDocType}`
      );
    }
    allocatedTotal += alloc.amount;
  }

  if (allocatedTotal > input.amount) {
    throw ApiError.badRequest('Allocated amount exceeds payment amount');
  }

  const paymentNumber = await nextDocNumber('payment', 'PAY');
  const payment = await Payment.create({
    paymentNumber,
    direction: input.direction,
    partyType,
    party: new Types.ObjectId(input.party),
    amount: input.amount,
    mode: input.mode,
    reference: input.reference,
    date: input.date ?? new Date(),
    allocations: input.allocations.map((a) => ({
      docType: a.docType,
      doc: new Types.ObjectId(a.doc),
      amount: a.amount,
    })),
    note: input.note,
    createdBy: new Types.ObjectId(userId),
  });

  await applyAllocations(payment.allocations, 1);
  return getPayment(payment.id);
}

export async function listPayments(req: Request) {
  const params = parseListParams(req);
  const filter: Record<string, unknown> = searchFilter(params.search, ['paymentNumber', 'reference']);
  if (typeof req.query.direction === 'string') filter.direction = req.query.direction;
  if (typeof req.query.party === 'string') filter.party = req.query.party;
  if (typeof req.query.mode === 'string') filter.mode = req.query.mode;

  const result = await paginate(Payment, params, filter);
  const data = await Payment.populate(result.data, { path: 'party', select: 'name phone' });
  return { ...result, data };
}

export async function getPayment(id: string) {
  const payment = await Payment.findById(id).populate('party', 'name phone gstin');
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

export async function deletePayment(id: string) {
  const payment = await Payment.findById(id);
  if (!payment) throw ApiError.notFound('Payment not found');
  await applyAllocations(payment.allocations, -1);
  await payment.deleteOne();
  return payment;
}
