import mongoose, { Schema, model, Types } from 'mongoose';

export const ACTIVITY_ACTIONS = ['create', 'update', 'delete'] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface IActivityLog {
  user?: Types.ObjectId;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  method: string;
  path: string;
}

export interface IActivityLogDocument extends IActivityLog, mongoose.Document {}

const activityLogSchema = new Schema<IActivityLogDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String },
    method: { type: String, required: true },
    path: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const ActivityLog = model<IActivityLogDocument>('ActivityLog', activityLogSchema);
