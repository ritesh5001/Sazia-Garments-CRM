import mongoose, { Schema, model, Types } from 'mongoose';

export const MOVEMENT_TYPES = ['inward', 'outward', 'adjustment'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface IStockMovement {
  product: Types.ObjectId;
  type: MovementType;
  quantity: number; // signed delta actually applied to stock (+in, -out, ± adjustment)
  rate: number; // paise per unit (valuation; 0 if n/a)
  balanceAfter: number; // product stock after this movement
  note?: string;
  reference?: string; // free text now; later links to invoice/purchase
  createdBy: Types.ObjectId;
}

export interface IStockMovementDocument extends IStockMovement, mongoose.Document {}

const stockMovementSchema = new Schema<IStockMovementDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    balanceAfter: { type: Number, required: true },
    note: { type: String, trim: true },
    reference: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockMovementSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const StockMovement = model<IStockMovementDocument>('StockMovement', stockMovementSchema);
