import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import Order from '../../../../models/Order';

export async function GET() {
  await connectDB();
  const orders = await Order.find({}).limit(500).lean();

  const totalOrders = orders.length;
  const successfulPayments = orders.filter((o) => o.status === 'paid').length;
  const failedPayments = orders.filter((o) => o.status === 'payment_failed').length;
  const policyBlocks = orders.filter((o) => o.status === 'policy_blocked').length;
  const revenue = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount * (o.quantity ?? 1), 0);
  const conversionRate = totalOrders > 0 ? successfulPayments / totalOrders : 0;
  const averageOrderValue = successfulPayments > 0 ? revenue / successfulPayments : 0;

  const byDay = new Map<string, { revenue: number; paid: number; failed: number; blocked: number }>();
  for (const o of orders) {
    const day = new Date(o.createdAt as unknown as string).toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { revenue: 0, paid: 0, failed: 0, blocked: 0 };
    if (o.status === 'paid') { bucket.revenue += o.amount * (o.quantity ?? 1); bucket.paid++; }
    if (o.status === 'payment_failed') bucket.failed++;
    if (o.status === 'policy_blocked') bucket.blocked++;
    byDay.set(day, bucket);
  }
  const timeSeries = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));

  return NextResponse.json({ totalOrders, successfulPayments, failedPayments, policyBlocks, totalSimulatedRevenue: revenue, conversionRate, averageOrderValue, timeSeries });
}
