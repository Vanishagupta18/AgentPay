import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Order from '../../../../models/Order';
import { recordSimulatedOutcome } from '../../../../lib/payments/simulation-provider';
import { writeAuditEvent } from '../../../../lib/audit/log';

export async function POST(req: NextRequest) {
  const { orderId, outcome, sessionId } = await req.json();
  if (outcome !== 'success' && outcome !== 'failure') {
    return NextResponse.json({ error: "outcome must be 'success' or 'failure'" }, { status: 400 });
  }
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!order.paymentId) {
    return NextResponse.json({ error: 'No payment created yet — call /api/payments/create first.' }, { status: 409 });
  }

  recordSimulatedOutcome(order.paymentId, outcome);

  await writeAuditEvent({ sessionId, orderId: order._id.toString(), eventType: outcome === 'success' ? 'payment_success' : 'payment_failed', actor: 'user', metadata: { simulated: true, outcome } });

  return NextResponse.json({ recorded: true, outcome });
}
