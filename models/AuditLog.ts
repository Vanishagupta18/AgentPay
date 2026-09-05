import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const AuditLogSchema = new Schema({
  sessionId: { type: String, index: true },
  userId: { type: String, default: 'demo-user' },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  eventType: {
    type: String,
    required: true,
    enum: [
      'agent_request', 'intent_extracted', 'product_recommended', 'purchase_confirmed',
      'policy_checked', 'policy_blocked', 'payment_created', 'payment_success',
      'payment_failed', 'payment_verified', 'order_created', 'order_completed',
    ],
  },
  actor: { type: String, default: 'system' },
  input: Schema.Types.Mixed,
  decision: Schema.Types.Mixed,
  reason: String,
  metadata: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema>;
export default (mongoose.models.AuditLog as mongoose.Model<AuditLogDoc>) || mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);
