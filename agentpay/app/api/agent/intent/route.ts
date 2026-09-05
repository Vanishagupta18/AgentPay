import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '../../../../lib/ai/client';
import { writeAuditEvent } from '../../../../lib/audit/log';

// POST { query: string, sessionId?: string }
// Step 1 of the agent flow: turn free text into structured intent.
// Kept as its own endpoint (rather than folded into /recommend) so the
// frontend can show "understanding your request..." as a distinct step
// in the timeline, matching the audit trail's own event granularity.
export async function POST(req: NextRequest) {
  const { query, sessionId } = await req.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const intent = await extractIntent(query);

  await writeAuditEvent({
    sessionId,
    eventType: 'intent_extracted',
    detail: { userInput: query, extractedIntent: intent },
  });

  return NextResponse.json({ intent });
}
