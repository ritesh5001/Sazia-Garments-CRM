import { Types } from 'mongoose';
import type { Request } from 'express';
import { Order, type IOrderItem } from '../../models/Order.js';
import { Customer } from '../../models/Customer.js';
import { nextDocNumber } from '../../models/Counter.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, paginate, searchFilter } from '../../utils/paginate.js';
import type { OrderInput, OrderUpdateInput, OrderStatusInput } from './orders.validators.js';

interface RawItem {
  product?: string;
  description: string;
  quantity: number;
  rate: number;
}

function buildItems(items: RawItem[]): { items: IOrderItem[]; total: number } {
  const built = items.map((it) => ({
    product: it.product ? new Types.ObjectId(it.product) : undefined,
    description: it.description,
    quantity: it.quantity,
    rate: it.rate,
    lineTotal: Math.round(it.quantity * it.rate),
  }));
  const total = built.reduce((s, i) => s + i.lineTotal, 0);
  return { items: built, total };
}

export async function listOrders(req: Request) {
  const params = parseListParams(req);
  const filter: Record<string, unknown> = searchFilter(params.search, ['orderNumber']);
  if (typeof req.query.customer === 'string') filter.customer = req.query.customer;
  if (typeof req.query.status === 'string') filter.status = req.query.status;

  const result = await paginate(Order, params, filter);
  const data = await Order.populate(result.data, { path: 'customer', select: 'name phone' });
  return { ...result, data };
}

export async function getOrder(id: string) {
  const order = await Order.findById(id)
    .populate('customer')
    .populate('items.product', 'name sku unit')
    .populate('linkedInvoice', 'invoiceNumber total status');
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

export async function createOrder(input: OrderInput, userId: string) {
  const customer = await Customer.exists({ _id: input.customer });
  if (!customer) throw ApiError.badRequest('Customer not found');

  const { items, total } = buildItems(input.items);
  const orderNumber = await nextDocNumber('order', 'ORD');

  const order = await Order.create({
    orderNumber,
    customer: new Types.ObjectId(input.customer),
    date: input.date ?? new Date(),
    expectedDeliveryDate: input.expectedDeliveryDate,
    items,
    total,
    status: 'created',
    linkedInvoice: input.linkedInvoice ? new Types.ObjectId(input.linkedInvoice) : undefined,
    notes: input.notes,
    createdBy: new Types.ObjectId(userId),
  });

  return getOrder(order.id);
}

export async function updateOrder(id: string, input: OrderUpdateInput) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (input.customer) {
    const exists = await Customer.exists({ _id: input.customer });
    if (!exists) throw ApiError.badRequest('Customer not found');
    order.customer = new Types.ObjectId(input.customer);
  }
  if (input.items) {
    const { items, total } = buildItems(input.items);
    order.items = items;
    order.total = total;
  }
  if (input.date) order.date = input.date;
  if (input.expectedDeliveryDate) order.expectedDeliveryDate = input.expectedDeliveryDate;
  if (input.linkedInvoice !== undefined) {
    order.linkedInvoice = input.linkedInvoice ? new Types.ObjectId(input.linkedInvoice) : undefined;
  }
  if (input.notes !== undefined) order.notes = input.notes;

  await order.save();
  return getOrder(order.id);
}

export async function updateStatus(id: string, input: OrderStatusInput) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  order.status = input.status;

  if (input.dispatch) {
    order.dispatch = {
      carrier: input.dispatch.carrier || order.dispatch?.carrier,
      trackingNumber: input.dispatch.trackingNumber || order.dispatch?.trackingNumber,
      dispatchedAt: input.dispatch.dispatchedAt ?? order.dispatch?.dispatchedAt,
    };
  }
  // Auto-stamp dispatch/delivery timestamps when advancing without explicit dates.
  if (input.status === 'dispatched' && !order.dispatch?.dispatchedAt) {
    order.dispatch = { ...order.dispatch, dispatchedAt: new Date() };
  }
  if (input.delivery) {
    order.delivery = {
      deliveredAt: input.delivery.deliveredAt ?? order.delivery?.deliveredAt,
      receivedBy: input.delivery.receivedBy || order.delivery?.receivedBy,
    };
  }
  if (input.status === 'delivered' && !order.delivery?.deliveredAt) {
    order.delivery = { ...order.delivery, deliveredAt: new Date() };
  }

  await order.save();
  return getOrder(order.id);
}

export async function deleteOrder(id: string) {
  const order = await Order.findByIdAndDelete(id);
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}
