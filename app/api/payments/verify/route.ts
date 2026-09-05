import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Order from '../../../../models/Order';
import { getPaymentProvider } from '../../../../lib/payments';
import { writeAuditEvent } from '../../../../lib/audit/log';

export async function POST(req: NextRequest) {
  const { orderId, sessionId } = await req.json();
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!order.paymentId) {
    return NextResponse.json({ error: 'No payment to verify for this order.' }, { status: 409 });
  }

  const provider = getPaymentProvider();
  const result = await provider.verifyPayment({ orderId: order._id.toString(), paymentId: order.paymentId });

  order.paymentVerified = result.verified;
  order.paymentStatus = result.verified ? 'succeeded' : 'failed';
  order.status = result.verified ? 'paid' : 'payment_failed';
  await order.save();

  await writeAuditEvent({ sessionId, orderId: order._id.toString(), eventType: 'payment_verified', actor: 'payment_provider', decision: result });

  if (result.verified) {
    await writeAuditEvent({ sessionId, orderId: order._id.toString(), eventType: 'order_completed', actor: 'system' });
  }

  return NextResponse.json({ verified: result.verified, reason: result.reason, order });
}
