import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  billingAddress: z.string().trim().optional().or(z.literal('')),
  shippingAddress: z.string().trim().optional().or(z.literal('')),
  openingBalance: z.number().int().default(0),
  notes: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const customerUpdateSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
