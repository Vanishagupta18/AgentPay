import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db/mongoose';
import Product from '../../../models/Product';
import { buildProductFilter } from '../../../lib/catalog/filter';
import { IntentSchema, FALLBACK_INTENT } from '../../../lib/ai/schema';

export async function GET(req: NextRequest) {
  await connectDB();
  const intentParam = req.nextUrl.searchParams.get('intent');
  let intent = FALLBACK_INTENT;
  if (intentParam) {
    const parsed = IntentSchema.safeParse(JSON.parse(intentParam));
    if (parsed.success) intent = parsed.data;
  }
  const filter = buildProductFilter(intent);
  const products = await Product.find(filter).limit(20).lean();
  return NextResponse.json({ products, filterUsed: filter });
}
