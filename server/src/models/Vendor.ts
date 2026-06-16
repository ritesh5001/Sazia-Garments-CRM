import mongoose, { Schema, model } from 'mongoose';

export interface IVendor {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  openingBalance: number; // in paise; positive = we owe vendor (payable)
  notes?: string;
  isActive: boolean;
}

export interface IVendorDocument extends IVendor, mongoose.Document {}

const vendorSchema = new Schema<IVendorDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gstin: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    openingBalance: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vendorSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Vendor = model<IVendorDocument>('Vendor', vendorSchema);
