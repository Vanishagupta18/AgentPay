'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatRupees, formatTimestamp } from '../../../lib/ui/format';

interface OrderDetail {
  _id: string; productId: { name: string } | null; amount: number; quantity: number;
  status: string; paymentId: string; paymentProvider: string; paymentVerified: boolean; updatedAt: string;
}

const SESSION_ID = typeof window !== 'undefined' ? crypto.randomUUID() : 'server';

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [stage, setStage] = useState<'checkout' | 'processing' | 'result'>('checkout');

  async function refresh() {
    const res = await fetch(`/api/orders/${orderId}`);
    setOrder((await res.json()).order);
  }
  useEffect(() => { refresh(); }, [orderId]);

  async function handleOutcome(outcome: 'success' | 'failure') {
    setStage('processing');
    await fetch('/api/payments/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, outcome, sessionId: SESSION_ID }) });
    await new Promise((r) => setTimeout(r, 700));
    await fetch('/api/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, sessionId: SESSION_ID }) });
    await refresh();
    setStage('result');
  }

  if (!order) return <div className="text-sm text-signal-grey">Loading…</div>;

  if (stage === 'result') {
    const success = order.status === 'paid';
    return (
      <div className="mx-auto max-w-md">
        <div className={`rounded border p-6 text-center ${success ? 'border-signal-green bg-signal-green-bg' : 'border-signal-red bg-signal-red-bg'}`}>
          <div className={`text-lg font-semibold ${success ? 'text-signal-green' : 'text-signal-red'}`}>{success ? 'Payment successful' : 'Payment failed'}</div>
          <div className="mt-1 text-sm text-ink/70">{order.productId?.name}</div>
          <div className="mt-4 space-y-1 text-left font-mono text-xs">
            <div>Order ID: {order._id}</div>
            <div>Payment ID: {order.paymentId}</div>
            <div>Amount: {formatRupees(order.amount * order.quantity)}</div>
            <div>Time: {formatTimestamp(order.updatedAt)}</div>
          </div>
          {success && <p className="mt-4 text-xs text-signal-green">Payment verified by AgentPay backend.</p>}
          {!success && (<>
            <p className="mt-4 text-xs text-signal-red">Order remains unpaid.</p>
            <a href="/shop" className="mt-3 inline-block rounded bg-ink px-4 py-2 text-xs font-medium text-white">Retry payment</a>
          </>)}
        </div>
        <a href="/transactions" className="mt-4 block text-center text-sm text-ledger underline">View all transactions</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded border-2 border-signal-amber bg-signal-amber-bg p-3 text-center text-xs font-medium text-signal-amber">
        SIMULATION MODE — No real money will be charged
      </div>
      <div className="mt-4 rounded border border-line bg-white p-5">
        <div className="text-xs text-signal-grey">AgentPay Simulation — Test Transaction</div>
        <div className="mt-2 flex items-baseline justify-between border-b border-line pb-3">
          <span className="text-sm">{order.productId?.name}</span>
          <span className="font-mono text-sm tabular-nums">{formatRupees(order.amount * order.quantity)}</span>
        </div>
        <div className="mt-3 flex justify-between text-xs text-signal-grey"><span>Merchant</span><span>AgentPay (demo)</span></div>
        <div className="mt-1 flex justify-between text-xs text-signal-grey"><span>Currency</span><span>INR</span></div>
        {stage === 'processing' ? (
          <div className="mt-6 text-center text-sm text-signal-grey">Processing…</div>
        ) : (
          <div className="mt-6 space-y-2">
            <button onClick={() => handleOutcome('success')} className="w-full rounded bg-signal-green px-4 py-2 text-sm font-medium text-white">Simulate Successful Payment</button>
            <button onClick={() => handleOutcome('failure')} className="w-full rounded border border-signal-red px-4 py-2 text-sm font-medium text-signal-red">Simulate Payment Failure</button>
          </div>
        )}
      </div>
    </div>
  );
}
