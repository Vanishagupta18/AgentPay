import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true }, // paise — matches Razorpay's amount unit directly
    currency: { type: String, default: 'INR' },
    stock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 4.0 },
    reviewCount: { type: Number, default: 0 },
    attributes: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
// Cast explicitly — without it, TS can't resolve overloads on the union
// of "existing compiled model" vs "freshly compiled model" and every
// query method call (.find, .create, etc.) breaks with a confusing
// "not callable" error. This is a known Mongoose+TS interaction, not a
// logic bug — worth knowing if you hit this pattern elsewhere.
export default (mongoose.models.Product as mongoose.Model<ProductDoc>) || mongoose.model<ProductDoc>('Product', ProductSchema);
