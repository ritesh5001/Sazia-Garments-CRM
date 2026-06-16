import { z } from 'zod';
import { ORDER_STATUSES } from '../../models/Order.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const itemSchema = z.object({
  product: objectId.optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  rate: z.number().int().min(0).default(0),
});

export const orderSchema = z.object({
  customer: objectId,
  date: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  linkedInvoice: objectId.optional(),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const orderUpdateSchema = orderSchema.partial();

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  dispatch: z
    .object({
      carrier: z.string().trim().optional().or(z.literal('')),
      trackingNumber: z.string().trim().optional().or(z.literal('')),
      dispatchedAt: z.coerce.date().optional(),
    })
    .optional(),
  delivery: z
    .object({
      deliveredAt: z.coerce.date().optional(),
      receivedBy: z.string().trim().optional().or(z.literal('')),
    })
    .optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
