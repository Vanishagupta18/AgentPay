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
  if (order.status !== 'created') {
    return NextResponse.json({ error: `Order status is '${order.status}', not 'created' — payment cannot start.` }, { status: 409 });
  }

  const provider = getPaymentProvider();
  const result = await provider.createPayment({ orderId: order._id.toString(), amount: order.amount, currency: order.currency });

  order.paymentProvider = provider.name;
  order.paymentId = result.paymentId;
  order.paymentStatus = 'processing';
  order.status = 'payment_pending';
  await order.save();

  await writeAuditEvent({ sessionId, orderId: order._id.toString(), eventType: 'payment_created', actor: 'payment_provider', metadata: { provider: provider.name, paymentId: result.paymentId } });

  return NextResponse.json({ order, paymentId: result.paymentId, provider: provider.name });
}
