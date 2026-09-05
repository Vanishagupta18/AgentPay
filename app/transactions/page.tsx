'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRupees, formatTimestamp } from '../../lib/ui/format';
import { StatusBadge } from '../../components/StatusBadge';

interface Order { _id: string; productId: { name: string; category: string } | null; amount: number; quantity: number; status: string; paymentProvider: string | null; createdAt: string; }

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { fetch('/api/orders').then((r) => r.json()).then((d) => setOrders(d.orders)); }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
      <p className="mt-1 text-sm text-signal-grey">Every purchase attempt, allowed or blocked.</p>
      <div className="mt-6 overflow-hidden rounded border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-signal-grey-bg text-left text-xs text-signal-grey">
              <th className="px-4 py-2 font-normal">Product</th><th className="px-4 py-2 font-normal">Amount</th>
              <th className="px-4 py-2 font-normal">Payment status</th><th className="px-4 py-2 font-normal">Provider</th>
              <th className="px-4 py-2 font-normal">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders?.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-signal-grey">No transactions yet.</td></tr>}
            {orders?.map((o) => (
              <tr key={o._id} className="border-b border-line last:border-0 hover:bg-signal-grey-bg/50">
                <td className="px-4 py-3">
                  <Link href={`/transactions/${o._id}`} className="text-ledger hover:underline">{o.productId?.name ?? 'Unknown product'}</Link>
                  <div className="text-xs text-signal-grey">{o.productId?.category}</div>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatRupees(o.amount * o.quantity)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 font-mono text-xs text-signal-grey">{o.paymentProvider ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-signal-grey">{formatTimestamp(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
