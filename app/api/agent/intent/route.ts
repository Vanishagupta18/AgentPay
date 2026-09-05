import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '../../../../lib/ai/client';
import { writeAuditEvent } from '../../../../lib/audit/log';

export async function POST(req: NextRequest) {
  const { query, sessionId } = await req.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }
  const intent = await extractIntent(query);
  await writeAuditEvent({ sessionId, eventType: 'intent_extracted', actor: 'ai', input: query, decision: intent });
  return NextResponse.json({ intent });
}
