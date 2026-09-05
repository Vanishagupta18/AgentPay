import mongoose, { Schema, type InferSchemaType } from 'mongoose';

// Single-row-per-user settings that the Settings page actually writes to,
// and that lib/policy/engine.ts actually reads from. If this doesn't
// affect real policy decisions, don't build the settings page — a fake
// settings UI is worse than no settings UI.
const UserPreferenceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, default: 'demo-user' },
    maximumPurchaseAmount: { type: Number, default: 500000 }, // paise = ₹5,000
    requireConfirmation: { type: Boolean, default: true },
    highValueApprovalThreshold: { type: Number, default: 300000 }, // paise = ₹3,000
    autoRetryAllowed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserPreferenceDoc = InferSchemaType<typeof UserPreferenceSchema>;
export default (mongoose.models.UserPreference as mongoose.Model<UserPreferenceDoc>) || mongoose.model<UserPreferenceDoc>('UserPreference', UserPreferenceSchema);
