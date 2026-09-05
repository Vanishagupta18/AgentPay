import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Order from '../../../../models/Order';
import { writeAuditEvent } from '../../../../lib/audit/log';

// POST { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId? }
//
// Razorpay's documented verification: HMAC-SHA256 of
// `order_id + "|" + payment_id`, keyed with your key_secret, compared to
// the signature the Checkout popup returned. Never mark an order paid
// based on the frontend's word alone — this is the check that matters.
// https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/
export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing required Razorpay fields' }, { status: 400 });
  }

  await connectDB();

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    return NextResponse.json({ error: 'Order not found for this razorpay_order_id' }, { status: 404 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET not set' }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignatureVerified = verified;
  order.status = verified ? 'paid' : 'failed';
  order.paymentStatus = verified ? 'paid' : 'signature_mismatch';
  if (!verified) order.failureReason = 'Signature verification failed';
  await order.save();

  await writeAuditEvent({
    sessionId,
    orderId: order._id.toString(),
    eventType: 'payment_result',
    detail: { paymentResult: { verified, razorpayPaymentId: razorpay_payment_id } },
  });

  if (!verified) {
    // Graceful failure #2: signature mismatch. No false "paid" state —
    // the order is explicitly marked failed, not left ambiguous.
    return NextResponse.json({ verified: false, order }, { status: 400 });
  }

  return NextResponse.json({ verified: true, order });
}
