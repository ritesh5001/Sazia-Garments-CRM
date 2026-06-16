import mongoose, { Schema, model, Types } from 'mongoose';

export const INVOICE_STATUSES = ['pending', 'partial', 'paid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface IInvoiceLineItem {
  product?: Types.ObjectId;
  description: string;
  quantity: number;
  rate: number; // paise per unit
  gstRate: number; // percent
  taxableValue: number; // paise (quantity * rate)
  gstAmount: number; // paise
  lineTotal: number; // paise (taxable + gst)
}

export interface IInvoice {
  invoiceNumber: string;
  customer: Types.ObjectId;
  date: Date;
  lineItems: IInvoiceLineItem[];
  subtotal: number; // paise (sum taxable)
  gstAmount: number; // paise (sum gst)
  total: number; // paise
  amountPaid: number; // paise (updated by payments in Phase 6)
  status: InvoiceStatus;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface IInvoiceDocument extends IInvoice, mongoose.Document {}

const lineItemSchema = new Schema<IInvoiceLineItem>(
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

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    gstAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: 'pending', index: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Invoice = model<IInvoiceDocument>('Invoice', invoiceSchema);
