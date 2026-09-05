'use client';
import { useEffect, useState } from 'react';
import { formatTimestamp } from '../../lib/ui/format';

interface AuditEvent { _id: string; eventType: string; actor: string; orderId?: string; timestamp: string; }
const EVENT_TYPES = ['agent_request', 'intent_extracted', 'product_recommended', 'purchase_confirmed', 'policy_checked', 'policy_blocked', 'payment_created', 'payment_success', 'payment_failed', 'payment_verified', 'order_created', 'order_completed'];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    const url = filter ? `/api/audit?eventType=${filter}` : '/api/audit';
    fetch(url).then((r) => r.json()).then((d) => setEvents(d.events));
  }, [filter]);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Audit trail</h1>
      <p className="mt-1 text-sm text-signal-grey">Every event the agent recorded, across all sessions.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`rounded px-3 py-1 text-xs font-mono ${filter === '' ? 'bg-ink text-white' : 'bg-signal-grey-bg text-signal-grey'}`}>all</button>
        {EVENT_TYPES.map((t) => (<button key={t} onClick={() => setFilter(t)} className={`rounded px-3 py-1 text-xs font-mono ${filter === t ? 'bg-ink text-white' : 'bg-signal-grey-bg text-signal-grey'}`}>{t}</button>))}
      </div>
      <div className="mt-6 space-y-2">
        {events.length === 0 && <p className="text-sm text-signal-grey">No events recorded yet.</p>}
        {events.map((e) => (
          <div key={e._id} className="rounded border border-line bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-ledger">{e.eventType}</span>
              <span className="font-mono text-xs text-signal-grey">{formatTimestamp(e.timestamp)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-signal-grey-bg px-1.5 py-0.5 font-mono text-[10px] text-signal-grey">{e.actor}</span>
              {e.orderId && <a href={`/transactions/${e.orderId}`} className="text-xs text-ledger underline">view order</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
