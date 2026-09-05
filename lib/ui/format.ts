export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTimestamp(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export type StatusKind = 'paid' | 'created' | 'policy_blocked' | 'payment_pending' | 'payment_failed';

export const STATUS_LABEL: Record<StatusKind, string> = {
  paid: 'Paid', created: 'Awaiting payment', policy_blocked: 'Blocked by policy',
  payment_pending: 'Payment pending', payment_failed: 'Payment failed',
};

export const STATUS_COLOR: Record<StatusKind, string> = {
  paid: 'signal-green', created: 'signal-amber', policy_blocked: 'signal-red',
  payment_pending: 'signal-amber', payment_failed: 'signal-red',
};
