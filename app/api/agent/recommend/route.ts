import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Product from '../../../../models/Product';
import { buildProductFilter } from '../../../../lib/catalog/filter';
import { extractIntent, rankCandidates } from '../../../../lib/ai/client';
import { writeAuditEvent } from '../../../../lib/audit/log';

interface ProductLean {
  _id: { toString(): string }; name: string; price: number; category: string; tags: string[]; stock: number;
}

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
    sessionId, eventType: 'agent_request', actor: 'ai', input: query,
    metadata: { extractedIntent: intent, candidateProductIds: candidates.map((c) => c._id) },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ recommended: null, candidates: [], explanation: null });
  }

  const ranking = await rankCandidates(query, candidates.map((c) => ({ id: c._id.toString(), name: c.name, price: c.price, category: c.category, tags: c.tags })));
  const orderedIds = ranking?.rankedProductIds ?? candidates.map((c) => c._id.toString());
  const byId = new Map(candidates.map((c) => [c._id.toString(), c]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((c): c is ProductLean => Boolean(c));
  const recommended = ordered[0] ?? candidates[0] ?? null;

  await writeAuditEvent({
    sessionId, orderId: undefined, eventType: 'product_recommended', actor: 'ai',
    decision: ranking ?? { note: 'fallback: AI ranking unavailable, used DB order' },
    metadata: { selectedProductId: recommended?._id },
  });

  return NextResponse.json({ recommended, candidates: ordered.length > 0 ? ordered : candidates, explanation: ranking?.explanation ?? null });
}
