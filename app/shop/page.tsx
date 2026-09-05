'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupees } from '../../lib/ui/format';

interface Product { _id: string; name: string; price: number; category: string; stock: number; isActive: boolean; }
interface RecommendResult { recommended: Product | null; candidates: Product[]; explanation: string | null; }

const SESSION_ID = typeof window !== 'undefined' ? crypto.randomUUID() : 'server';

export default function ShopPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [blockedReason, setBlockedReason] = useState<{ reasons: string[]; checks: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResult(null); setSelected(null); setBlockedReason(null);
    try {
      const res = await fetch('/api/agent/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, sessionId: SESSION_ID }) });
      setResult(await res.json());
    } finally { setLoading(false); }
  }

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true); setBlockedReason(null);
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selected._id, quantity, userConfirmed: true, idempotencyKey: crypto.randomUUID(), userQuery: query, sessionId: SESSION_ID }),
      });
      const orderData = await orderRes.json();
      if (!orderData.allowed) { setBlockedReason(orderData.policyResult); return; }
      const paymentRes = await fetch('/api/payments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: orderData.order._id, sessionId: SESSION_ID }) });
      const paymentData = await paymentRes.json();
      router.push(`/checkout/${paymentData.order._id}`);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">What are you looking for?</h1>
      <p className="mt-1 text-sm text-signal-grey">Describe what you need. Nothing is purchased until you confirm.</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Beginner running shoes under ₹5,000"
          className="flex-1 rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ledger focus:ring-1 focus:ring-ledger" />
        <button type="submit" disabled={loading} className="rounded bg-ledger px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {result && (
        <div className="mt-8">
          {result.candidates.length === 0 ? (
            <div className="rounded border border-line bg-white p-6 text-center text-sm text-signal-grey">No matching products. Try a broader description.</div>
          ) : (
            <>
              {result.explanation && <p className="mb-4 text-sm text-signal-grey">{result.explanation}</p>}
              <ul className="space-y-2">
                {result.candidates.slice(0, 5).map((p) => (
                  <li key={p._id} onClick={() => { setSelected(p); setBlockedReason(null); }}
                    className={`flex cursor-pointer items-center justify-between rounded border p-4 transition-colors ${selected?._id === p._id ? 'border-ledger bg-ledger-light' : 'border-line bg-white hover:border-ink/30'}`}>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-signal-grey">{p.category} · stock: {p.stock}</div>
                    </div>
                    <div className="font-mono text-sm tabular-nums">{formatRupees(p.price)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-6 rounded border border-line bg-white p-5">
          <div className="text-sm text-signal-grey">Confirm purchase</div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="font-medium">{selected.name}</div>
            <div className="font-mono text-lg tabular-nums">{formatRupees(selected.price * quantity)}</div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            Quantity
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-16 rounded border border-line px-2 py-1 font-mono text-sm" />
          </label>
          <p className="mt-2 text-xs text-signal-grey">This runs the policy engine before any payment step begins.</p>
          <button onClick={handleConfirm} disabled={submitting} className="mt-4 w-full rounded bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? 'Checking policy…' : 'Confirm & Continue'}
          </button>
        </div>
      )}

      {blockedReason && (
        <div className="mt-4 rounded border border-signal-red bg-signal-red-bg p-4 text-sm">
          <div className="font-medium text-signal-red">Blocked by policy</div>
          <ul className="mt-2 space-y-1 font-mono text-xs text-ink/80">
            {blockedReason.checks.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
