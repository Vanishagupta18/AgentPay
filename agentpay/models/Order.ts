import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrderSchema = new Schema(
  {
    userId: { type: String, default: 'demo-user' }, // no auth system for the buildathon build — single demo user is fine, documented in README
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true }, // paise, server-derived — never trust client input for this
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending_confirmation', 'policy_blocked', 'out_of_stock', 'created', 'paid', 'failed'],
      default: 'pending_confirmation',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignatureVerified: { type: Boolean, default: false },
    paymentStatus: { type: String, default: 'not_started' },
    failureReason: { type: String },
    // One idempotency key per checkout attempt, generated client-side.
    // Unique+sparse: many orders will never repeat a key, only retries do.
    idempotencyKey: { type: String, unique: true, sparse: true },
    userQuery: { type: String },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export default (mongoose.models.Order as mongoose.Model<OrderDoc>) || mongoose.model<OrderDoc>('Order', OrderSchema);
