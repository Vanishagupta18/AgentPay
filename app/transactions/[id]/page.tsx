'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatRupees, formatTimestamp } from '../../../lib/ui/format';
import { StatusBadge } from '../../../components/StatusBadge';

interface AuditEvent { _id: string; eventType: string; actor: string; timestamp: string; [key: string]: unknown; }
interface OrderDetail { _id: string; productId: { name: string; category: string; price: number; stock: number } | null; amount: number; quantity: number; status: string; userQuery: string; paymentProvider: string | null; paymentId: string | null; paymentVerified: boolean; createdAt: string; }

const EVENT_LABEL: Record<string, string> = {
  agent_request: 'Agent request processed', intent_extracted: 'Intent extracted', product_recommended: 'Product recommended',
  purchase_confirmed: 'Purchase confirmed by user', policy_checked: 'Policy check — approved', policy_blocked: 'Policy check — blocked',
  payment_created: 'Payment created', payment_success: 'Payment simulated: success', payment_failed: 'Payment simulated: failure',
  payment_verified: 'Payment verified', order_created: 'Order created', order_completed: 'Order completed',
};

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => setOrder(d.order));
    fetch(`/api/audit?orderId=${id}`).then((r) => r.json()).then((d) => setEvents(d.events));
  }, [id]);

  if (!order) return <div className="text-sm text-signal-grey">Loading…</div>;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{order.productId?.name ?? 'Unknown product'}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-signal-grey">Requested as: &ldquo;{order.userQuery}&rdquo;</p>
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wide text-signal-grey">Decision chain</h2>
          <div className="mt-3 border-l-2 border-line pl-5">
            {events.length === 0 && <p className="text-sm text-signal-grey">No audit events recorded yet.</p>}
            {events.map((e) => (
              <div key={e._id} className="relative mb-5 last:mb-0">
                <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-ledger" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-signal-grey">{formatTimestamp(e.timestamp)}</span>
                  <span className="rounded bg-signal-grey-bg px-1.5 py-0.5 font-mono text-[10px] text-signal-grey">{e.actor}</span>
                </div>
                <div className="text-sm font-medium">{EVENT_LABEL[e.eventType] ?? e.eventType}</div>
                {(e.reason || e.decision || e.metadata || e.input) ? (
                  <pre className="mt-1 overflow-x-auto rounded bg-signal-grey-bg p-2 font-mono text-xs text-ink/80">
                    {JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k, v]) => ['reason', 'decision', 'metadata', 'input'].includes(k) && v !== undefined)), null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded border border-line bg-white p-4">
          <div className="text-xs text-signal-grey">Amount</div>
          <div className="font-mono text-lg tabular-nums">{formatRupees(order.amount * order.quantity)}</div>
        </div>
        <div className="rounded border border-line bg-white p-4 text-sm">
          <div className="text-xs text-signal-grey">Payment provider</div>
          <div className="font-mono text-xs">{order.paymentProvider ?? '—'}</div>
          <div className="mt-2 text-xs text-signal-grey">Payment ID</div>
          <div className="font-mono text-xs">{order.paymentId ?? '—'}</div>
          <div className="mt-2 text-xs text-signal-grey">Verified</div>
          <div className="font-mono text-xs">{String(order.paymentVerified)}</div>
        </div>
      </aside>
    </div>
  );
}
