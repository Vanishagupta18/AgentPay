import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const UserPreferenceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, default: 'demo-user' },
    confirmationRequired: { type: Boolean, default: true },
    maximumAmount: { type: Number, default: 500000 },
    maximumQuantity: { type: Number, default: 2 },
    allowedCategories: { type: [String], default: null },
  },
  { timestamps: true }
);

export type UserPreferenceDoc = InferSchemaType<typeof UserPreferenceSchema>;
export default (mongoose.models.UserPreference as mongoose.Model<UserPreferenceDoc>) || mongoose.model<UserPreferenceDoc>('UserPreference', UserPreferenceSchema);
