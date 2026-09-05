import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const AuditLogSchema = new Schema({
  sessionId: { type: String, index: true },
  userId: { type: String, default: 'demo-user' },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  eventType: {
    type: String,
    required: true,
    enum: [
      'intent_extracted',
      'products_searched',
      'product_recommended',
      'user_confirmed',
      'policy_checked',
      'payment_created',
      'payment_result',
      'error',
    ],
  },
  userInput: String,
  extractedIntent: Schema.Types.Mixed,
  candidateProductIds: [Schema.Types.ObjectId],
  selectedProductId: Schema.Types.ObjectId,
  aiRecommendation: Schema.Types.Mixed,
  policyChecks: Schema.Types.Mixed,
  policyDecision: Schema.Types.Mixed,
  action: String,
  razorpayOrderId: String,
  paymentResult: Schema.Types.Mixed,
  error: String,
  timestamp: { type: Date, default: Date.now },
});

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema>;
export default (mongoose.models.AuditLog as mongoose.Model<AuditLogDoc>) || mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);
