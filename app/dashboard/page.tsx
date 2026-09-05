'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatRupees } from '../../lib/ui/format';

interface Metrics { totalOrders: number; successfulPayments: number; failedPayments: number; policyBlocks: number; totalSimulatedRevenue: number; conversionRate: number; averageOrderValue: number; timeSeries: { day: string; revenue: number; paid: number; failed: number; blocked: number }[]; }

function Stat({ label, value }: { label: string; value: string }) {
  return (<div className="rounded border border-line bg-white p-5"><div className="text-xs text-signal-grey">{label}</div><div className="mt-1 font-mono text-2xl tabular-nums">{value}</div></div>);
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  useEffect(() => { fetch('/api/dashboard/metrics').then((r) => r.json()).then(setMetrics); }, []);

  if (!metrics) return <div className="text-sm text-signal-grey">Loading…</div>;

  if (metrics.totalOrders === 0) {
    return (<div><h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <div className="mt-6 rounded border border-line bg-white p-6 text-center text-sm text-signal-grey">
        No purchase attempts yet. Try a search on the <a href="/shop" className="text-ledger underline">Shop</a> page.
      </div></div>);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-signal-grey">Simulated revenue and outcomes — recomputed from real Order documents.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total orders" value={String(metrics.totalOrders)} />
        <Stat label="Successful payments" value={String(metrics.successfulPayments)} />
        <Stat label="Policy blocks" value={String(metrics.policyBlocks)} />
        <Stat label="Payment failures" value={String(metrics.failedPayments)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Simulated revenue" value={formatRupees(metrics.totalSimulatedRevenue)} />
        <Stat label="Conversion rate" value={`${(metrics.conversionRate * 100).toFixed(1)}%`} />
        <Stat label="Avg order value" value={formatRupees(metrics.averageOrderValue)} />
      </div>
      {metrics.timeSeries.length > 1 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-line bg-white p-4">
            <div className="mb-2 text-xs text-signal-grey">Revenue over time</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.timeSeries}>
                <CartesianGrid stroke="#E4E4E1" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatRupees(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#24346B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <div className="mb-2 text-xs text-signal-grey">Outcomes by day</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.timeSeries}>
                <CartesianGrid stroke="#E4E4E1" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="paid" fill="#1F7A4D" /><Bar dataKey="blocked" fill="#B45309" /><Bar dataKey="failed" fill="#B42318" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
