import mongoose, { Schema, model, Types } from 'mongoose';

export const ORDER_STATUSES = ['created', 'processing', 'dispatched', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  product?: Types.ObjectId;
  description: string;
  quantity: number;
  rate: number; // paise per unit
  lineTotal: number; // paise
}

export interface IDispatchInfo {
  carrier?: string;
  trackingNumber?: string;
  dispatchedAt?: Date;
}

export interface IDeliveryInfo {
  deliveredAt?: Date;
  receivedBy?: string;
}

export interface IOrder {
  orderNumber: string;
  customer: Types.ObjectId;
  date: Date;
  expectedDeliveryDate?: Date;
  items: IOrderItem[];
  total: number; // paise
  status: OrderStatus;
  dispatch: IDispatchInfo;
  delivery: IDeliveryInfo;
  linkedInvoice?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface IOrderDocument extends IOrder, mongoose.Document {}

const itemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    expectedDeliveryDate: { type: Date },
    items: { type: [itemSchema], default: [] },
    total: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'created', index: true },
    dispatch: {
      carrier: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      dispatchedAt: { type: Date },
    },
    delivery: {
      deliveredAt: { type: Date },
      receivedBy: { type: String, trim: true },
    },
    linkedInvoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Order = model<IOrderDocument>('Order', orderSchema);
