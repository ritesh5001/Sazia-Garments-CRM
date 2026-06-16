import mongoose, { Schema, model, Types } from 'mongoose';

export const PURCHASE_STATUSES = ['pending', 'partial', 'paid'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface IPurchaseLineItem {
  product?: Types.ObjectId;
  description: string;
  quantity: number;
  rate: number; // paise per unit
  gstRate: number; // percent
  taxableValue: number;
  gstAmount: number;
  lineTotal: number;
}

export interface IPurchase {
  purchaseNumber: string;
  vendor: Types.ObjectId;
  vendorInvoiceNumber?: string; // the bill number from the vendor
  date: Date;
  lineItems: IPurchaseLineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  amountPaid: number; // updated by payments in Phase 6
  status: PurchaseStatus;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface IPurchaseDocument extends IPurchase, mongoose.Document {}

const lineItemSchema = new Schema<IPurchaseLineItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 0, min: 0 },
    taxableValue: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchaseDocument>(
  {
    purchaseNumber: { type: String, required: true, unique: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorInvoiceNumber: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    gstAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: PURCHASE_STATUSES, default: 'pending', index: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Purchase = model<IPurchaseDocument>('Purchase', purchaseSchema);
