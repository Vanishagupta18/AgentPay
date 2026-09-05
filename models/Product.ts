import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    stock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 4.0 },
    reviewCount: { type: Number, default: 0 },
    image: { type: String, default: null },
    attributes: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export default (mongoose.models.Product as mongoose.Model<ProductDoc>) || mongoose.model<ProductDoc>('Product', ProductSchema);
