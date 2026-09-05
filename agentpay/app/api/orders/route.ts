import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '../../../lib/db/mongoose';
import Product from '../../../models/Product';
import Order from '../../../models/Order';
import UserPreference from '../../../models/UserPreference';
import { evaluatePurchase } from '../../../lib/policy/engine';
import { writeAuditEvent } from '../../../lib/audit/log';

// NOTE ON VERIFICATION: order creation logic (policy path, duplicate
// handling, DB writes) typechecks and mirrors the tested policy engine,
// but the actual razorpay.orders.create() call has not been exercised —
// this sandbox can't reach api.razorpay.com. Test this against your real
// test-mode keys before the demo.

function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials are not set.');
  return new Razorpay({ key_id, key_secret });
}

// POST { productId, userConfirmed, idempotencyKey, userQuery, sessionId, highValueApproved? }
export async function POST(req: NextRequest) {
  const { productId, userConfirmed, idempotencyKey, userQuery, sessionId, highValueApproved } = await req.json();

  if (!idempotencyKey) {
    return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
  }

  await connectDB();

  // Duplicate protection: same key already used -> return the existing
  // order instead of creating a second one or a second Razorpay order.
  const existing = await Order.findOne({ idempotencyKey });
  if (existing) {
    return NextResponse.json({ reused: true, order: existing });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  let preferences = await UserPreference.findOne({ userId: 'demo-user' });
  if (!preferences) {
    preferences = await UserPreference.create({ userId: 'demo-user' });
  }

  const decision = evaluatePurchase({
    amount: product.price, // server-fetched, never trust the client
    category: product.category,
    stock: product.stock,
    isActive: product.isActive,
    userConfirmed: Boolean(userConfirmed),
    isDuplicateAttempt: false, // already handled above via idempotencyKey lookup
    preferences: {
      maximumPurchaseAmount: preferences.maximumPurchaseAmount,
      requireConfirmation: preferences.requireConfirmation,
      highValueApprovalThreshold: preferences.highValueApprovalThreshold,
      highValueApproved: Boolean(highValueApproved),
    },
  });

  const status = decision.allowed
    ? 'created'
    : decision.ruleTriggered === 'out_of_stock'
      ? 'out_of_stock'
      : 'policy_blocked';

  const order = await Order.create({
    userQuery,
    productId: product._id,
    amount: product.price,
    idempotencyKey,
    status,
  });

  await writeAuditEvent({
    sessionId,
    orderId: order._id.toString(),
    eventType: 'policy_checked',
    detail: { policyDecision: decision, policyChecks: { price: product.price, stock: product.stock } },
  });

  if (!decision.allowed) {
    // Graceful failure — no Razorpay call happens here at all.
    return NextResponse.json({ allowed: false, reason: decision.reason, ruleTriggered: decision.ruleTriggered, order }, { status: 403 });
  }

  const razorpay = getRazorpay();
  const rpOrder = await razorpay.orders.create({
    amount: product.price,
    currency: 'INR',
    receipt: order._id.toString(),
  });

  order.razorpayOrderId = rpOrder.id;
  order.paymentStatus = 'order_created';
  await order.save();

  await writeAuditEvent({
    sessionId,
    orderId: order._id.toString(),
    eventType: 'payment_created',
    detail: { razorpayOrderId: rpOrder.id },
  });

  return NextResponse.json({
    allowed: true,
    order,
    razorpayOrder: rpOrder,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
