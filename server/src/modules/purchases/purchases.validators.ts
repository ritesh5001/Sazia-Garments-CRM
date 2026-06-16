import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const lineItemSchema = z.object({
  product: objectId.optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  rate: z.number().int().min(0),
  gstRate: z.number().min(0).default(0),
});

export const purchaseSchema = z.object({
  vendor: objectId,
  vendorInvoiceNumber: z.string().trim().optional().or(z.literal('')),
  date: z.coerce.date().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const purchaseUpdateSchema = purchaseSchema.partial();

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseUpdateInput = z.infer<typeof purchaseUpdateSchema>;
