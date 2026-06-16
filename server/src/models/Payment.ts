import mongoose, { Schema, model, Types } from 'mongoose';

export const PAYMENT_DIRECTIONS = ['incoming', 'outgoing'] as const;
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

export const PAYMENT_MODES = ['cash', 'bank', 'upi', 'cheque'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const ALLOCATION_DOC_TYPES = ['invoice', 'purchase'] as const;
export type AllocationDocType = (typeof ALLOCATION_DOC_TYPES)[number];

export interface IPaymentAllocation {
  docType: AllocationDocType;
  doc: Types.ObjectId;
  amount: number; // paise applied to this document
}

export interface IPayment {
  paymentNumber: string;
  direction: PaymentDirection;
  partyType: 'Customer' | 'Vendor';
  party: Types.ObjectId;
  amount: number; // paise
  mode: PaymentMode;
  reference?: string; // cheque/txn number
  date: Date;
  allocations: IPaymentAllocation[];
  note?: string;
  createdBy: Types.ObjectId;
}

export interface IPaymentDocument extends IPayment, mongoose.Document {}

const allocationSchema = new Schema<IPaymentAllocation>(
  {
    docType: { type: String, enum: ALLOCATION_DOC_TYPES, required: true },
    doc: { type: Schema.Types.ObjectId, required: true, refPath: 'allocations.docModel' },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPaymentDocument>(
  {
    paymentNumber: { type: String, required: true, unique: true },
    direction: { type: String, enum: PAYMENT_DIRECTIONS, required: true, index: true },
    partyType: { type: String, enum: ['Customer', 'Vendor'], required: true },
    party: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType', index: true },
    amount: { type: Number, required: true, min: 1 },
    mode: { type: String, enum: PAYMENT_MODES, required: true },
    reference: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    allocations: { type: [allocationSchema], default: [] },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Payment = model<IPaymentDocument>('Payment', paymentSchema);
