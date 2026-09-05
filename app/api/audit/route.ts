import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db/mongoose';
import AuditLog from '../../../models/AuditLog';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = req.nextUrl;
  const filter: Record<string, unknown> = {};
  const orderId = searchParams.get('orderId');
  const eventType = searchParams.get('eventType');
  const sessionId = searchParams.get('sessionId');
  if (orderId) filter.orderId = orderId;
  if (eventType) filter.eventType = eventType;
  if (sessionId) filter.sessionId = sessionId;
  const events = await AuditLog.find(filter).sort({ timestamp: 1 }).limit(200).lean();
  return NextResponse.json({ events });
}
