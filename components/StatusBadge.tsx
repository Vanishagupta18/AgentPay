import { STATUS_LABEL, STATUS_COLOR, type StatusKind } from '../lib/ui/format';

const COLOR_CLASSES: Record<string, string> = {
  'signal-green': 'bg-signal-green-bg text-signal-green',
  'signal-amber': 'bg-signal-amber-bg text-signal-amber',
  'signal-red': 'bg-signal-red-bg text-signal-red',
  'signal-grey': 'bg-signal-grey-bg text-signal-grey',
};

export function StatusBadge({ status }: { status: string }) {
  const kind = status as StatusKind;
  const label = STATUS_LABEL[kind] ?? status;
  const colorKey = STATUS_COLOR[kind] ?? 'signal-grey';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-medium ${COLOR_CLASSES[colorKey]}`}>
      {label}
    </span>
  );
}
