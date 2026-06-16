import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  openingBalance: z.number().int().default(0),
  notes: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const vendorUpdateSchema = vendorSchema.partial();

export type VendorInput = z.infer<typeof vendorSchema>;
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;
