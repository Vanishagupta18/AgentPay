import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const PolicyResultSchema = new Schema(
  {
    allowed: { type: Boolean, required: true },
    reasons: { type: [String], default: [] },
    checks: { type: [String], default: [] },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: String, default: 'demo-user' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'policy_blocked', 'payment_pending', 'paid', 'payment_failed'],
      default: 'created',
    },
    paymentStatus: {
      type: String,
      enum: ['not_started', 'processing', 'succeeded', 'failed'],
      default: 'not_started',
    },
    paymentProvider: { type: String, default: null },
    paymentId: { type: String, default: null },
    paymentVerified: { type: Boolean, default: false },
    idempotencyKey: { type: String, unique: true, sparse: true },
    userQuery: { type: String },
    policyResult: { type: PolicyResultSchema, default: null },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export default (mongoose.models.Order as mongoose.Model<OrderDoc>) || mongoose.model<OrderDoc>('Order', OrderSchema);
