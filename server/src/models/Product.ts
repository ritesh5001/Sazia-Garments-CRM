import mongoose, { Schema, model } from 'mongoose';

export const PRODUCT_UNITS = ['meter', 'piece', 'kg', 'roll', 'dozen', 'set'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface IProduct {
  name: string;
  sku?: string;
  category?: string;
  unit: ProductUnit;
  reorderLevel: number; // quantity threshold for low-stock alerts
  costPrice: number; // paise per unit
  sellingPrice: number; // paise per unit
  currentStock: number; // current quantity on hand
  gstRate: number; // percent, e.g. 5, 12, 18
  isActive: boolean;
}

export interface IProductDocument extends IProduct, mongoose.Document {}

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, trim: true, uppercase: true },
    category: { type: String, trim: true },
    unit: { type: String, enum: PRODUCT_UNITS, default: 'meter' },
    reorderLevel: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0 },
    gstRate: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Product = model<IProductDocument>('Product', productSchema);
