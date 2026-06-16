import { z } from 'zod';
import { PRODUCT_UNITS } from '../../models/Product.js';
import { MOVEMENT_TYPES } from '../../models/StockMovement.js';

export const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().trim().optional().or(z.literal('')),
  category: z.string().trim().optional().or(z.literal('')),
  unit: z.enum(PRODUCT_UNITS).default('meter'),
  reorderLevel: z.number().min(0).default(0),
  costPrice: z.number().int().min(0).default(0),
  sellingPrice: z.number().int().min(0).default(0),
  gstRate: z.number().min(0).default(5),
  isActive: z.boolean().default(true),
  // openingStock optionally records an initial inward movement on create
  openingStock: z.number().min(0).optional(),
});

export const productUpdateSchema = productSchema.omit({ openingStock: true }).partial();

export const movementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  // For inward/outward: positive quantity. For adjustment: signed delta (+/-).
  quantity: z.number().refine((n) => n !== 0, 'Quantity cannot be zero'),
  rate: z.number().int().min(0).default(0),
  note: z.string().trim().optional().or(z.literal('')),
  reference: z.string().trim().optional().or(z.literal('')),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
