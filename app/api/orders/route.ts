import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db/mongoose';
import Product from '../../../models/Product';
import Order from '../../../models/Order';
import UserPreference from '../../../models/UserPreference';
import { evaluatePurchase } from '../../../lib/policy/engine';
import { writeAuditEvent } from '../../../lib/audit/log';

export async function GET() {
  await connectDB();
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).populate('productId', 'name category').lean();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const { productId, quantity = 1, userConfirmed, idempotencyKey, userQuery, sessionId } = await req.json();

  if (!idempotencyKey) {
    return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
  }

  await connectDB();

  const existing = await Order.findOne({ idempotencyKey });
  if (existing) {
    return NextResponse.json({ reused: true, order: existing });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await writeAuditEvent({ sessionId, eventType: 'purchase_confirmed', actor: 'user', input: { productId, quantity, userConfirmed } });

  let preferences = await UserPreference.findOne({ userId: 'demo-user' });
  if (!preferences) {
    preferences = await UserPreference.create({ userId: 'demo-user' });
  }

  const policyConfig = {
    confirmationRequired: preferences.confirmationRequired,
    maximumAmount: preferences.maximumAmount,
    maximumQuantity: preferences.maximumQuantity,
    allowedCategories: preferences.allowedCategories ?? null,
  };

  const policyResult = evaluatePurchase({
    amount: product.price,
    quantity,
    category: product.category,
    stock: product.stock,
    isActive: product.isActive,
    userConfirmed: Boolean(userConfirmed),
    isDuplicateAttempt: false,
    config: policyConfig,
  });

  const order = await Order.create({
    userQuery, productId: product._id, quantity, amount: product.price, idempotencyKey,
    status: policyResult.allowed ? 'created' : 'policy_blocked',
    policyResult,
  });

  await writeAuditEvent({
    sessionId, orderId: order._id.toString(),
    eventType: policyResult.allowed ? 'policy_checked' : 'policy_blocked',
    actor: 'policy_engine', decision: policyResult, reason: policyResult.reasons.join('; ') || undefined,
  });

  if (policyResult.allowed) {
    await writeAuditEvent({ sessionId, orderId: order._id.toString(), eventType: 'order_created', actor: 'system' });
  }

  return NextResponse.json({ allowed: policyResult.allowed, order, policyResult });
}
