import mongoose, { Schema, model } from 'mongoose';

export interface ICustomer {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  openingBalance: number; // in paise; positive = customer owes us (receivable)
  notes?: string;
  isActive: boolean;
}

export interface ICustomerDocument extends ICustomer, mongoose.Document {}

const customerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gstin: { type: String, trim: true, uppercase: true },
    billingAddress: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    openingBalance: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Customer = model<ICustomerDocument>('Customer', customerSchema);
