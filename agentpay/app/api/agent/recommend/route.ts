import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Product from '../../../../models/Product';
import { buildProductFilter } from '../../../../lib/catalog/filter';
import { extractIntent, rankCandidates } from '../../../../lib/ai/client';
import { writeAuditEvent } from '../../../../lib/audit/log';

interface ProductLean {
  _id: { toString(): string };
  name: string;
  price: number;
  category: string;
  tags: string[];
  stock: number;
}

// POST { query: string, sessionId?: string }
// Full step 1+2: extract intent, filter the catalog server-side, then
// let the LLM rank ONLY within that filtered candidate set. If ranking
// fails or the model is unavailable, fall back to the top DB matches
// (still real products, never invented ones) so the flow doesn't break.
export async function POST(req: NextRequest) {
  const { query, sessionId } = await req.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  await connectDB();

  const intent = await extractIntent(query);
  const filter = buildProductFilter(intent);
  const candidates = (await Product.find(filter).limit(20).lean()) as unknown as ProductLean[];

  await writeAuditEvent({
    sessionId,
    eventType: 'products_searched',
    detail: { userInput: query, extractedIntent: intent, candidateProductIds: candidates.map((c) => c._id) },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ recommended: null, candidates: [], reason: 'No matching products found.' });
  }

  const ranking = await rankCandidates(
    query,
    candidates.map((c) => ({ id: c._id.toString(), name: c.name, price: c.price, category: c.category, tags: c.tags }))
  );

  const orderedIds = ranking?.rankedProductIds ?? candidates.map((c) => c._id.toString());
  const byId = new Map(candidates.map((c) => [c._id.toString(), c]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((c): c is ProductLean => Boolean(c));

  const recommended = ordered[0] ?? candidates[0] ?? null;

  await writeAuditEvent({
    sessionId,
    eventType: 'product_recommended',
    detail: {
      selectedProductId: recommended?._id,
      aiRecommendation: ranking ?? { note: 'fallback: AI ranking unavailable, used DB order' },
    },
  });

  return NextResponse.json({ recommended, candidates: ordered.length > 0 ? ordered : candidates, explanation: ranking?.explanation ?? null });
}
