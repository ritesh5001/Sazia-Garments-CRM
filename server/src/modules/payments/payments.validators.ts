import { z } from 'zod';
import { PAYMENT_DIRECTIONS, PAYMENT_MODES, ALLOCATION_DOC_TYPES } from '../../models/Payment.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const allocationSchema = z.object({
  docType: z.enum(ALLOCATION_DOC_TYPES),
  doc: objectId,
  amount: z.number().int().positive(),
});

export const paymentSchema = z.object({
  direction: z.enum(PAYMENT_DIRECTIONS),
  party: objectId,
  amount: z.number().int().positive('Amount must be greater than zero'),
  mode: z.enum(PAYMENT_MODES),
  reference: z.string().trim().optional().or(z.literal('')),
  date: z.coerce.date().optional(),
  allocations: z.array(allocationSchema).default([]),
  note: z.string().trim().optional().or(z.literal('')),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
