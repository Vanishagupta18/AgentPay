'use client';
import { useEffect, useState } from 'react';
import { formatRupees } from '../../lib/ui/format';

interface Preferences { confirmationRequired: boolean; maximumAmount: number; maximumQuantity: number; allowedCategories: string[] | null; }

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  useEffect(() => { fetch('/api/policy').then((r) => r.json()).then((d) => setPrefs(d.preferences)); }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await fetch('/api/policy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) });
      setPrefs((await res.json()).preferences);
      setSavedAt(Date.now());
    } finally { setSaving(false); }
  }

  if (!prefs) return <div className="text-sm text-signal-grey">Loading…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight">Policy settings</h1>
      <p className="mt-1 text-sm text-signal-grey">Read directly by the policy engine on every checkout.</p>
      <div className="mt-6 space-y-5 rounded border border-line bg-white p-5">
        <label className="block">
          <span className="text-sm font-medium">Maximum transaction amount</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="number" value={prefs.maximumAmount / 100} onChange={(e) => setPrefs({ ...prefs, maximumAmount: Number(e.target.value) * 100 })} className="w-32 rounded border border-line px-2 py-1 font-mono text-sm" />
            <span className="text-xs text-signal-grey">rupees — currently {formatRupees(prefs.maximumAmount)}</span>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Maximum quantity per purchase</span>
          <input type="number" min={1} value={prefs.maximumQuantity} onChange={(e) => setPrefs({ ...prefs, maximumQuantity: Number(e.target.value) })} className="mt-1 w-20 rounded border border-line px-2 py-1 font-mono text-sm" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={prefs.confirmationRequired} onChange={(e) => setPrefs({ ...prefs, confirmationRequired: e.target.checked })} />
          <span className="text-sm">Require explicit confirmation before any purchase</span>
        </label>
        <button onClick={save} disabled={saving} className="w-full rounded bg-ledger px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
        {savedAt && <p className="text-center text-xs text-signal-green">Saved.</p>}
      </div>
    </div>
  );
}
