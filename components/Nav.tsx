'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/dashboard', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/audit', label: 'Audit trail' },
  { href: '/settings', label: 'Policy settings' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6">
        <span className="mr-6 py-4 font-mono text-sm font-semibold tracking-tight text-ink">AgentPay</span>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`border-b-2 px-3 py-4 text-sm transition-colors ${active ? 'border-ledger text-ink font-medium' : 'border-transparent text-signal-grey hover:text-ink'}`}>
              {link.label}
            </Link>
          );
        })}
        <span className="ml-auto rounded bg-signal-amber-bg px-2 py-1 font-mono text-xs text-signal-amber">Simulation mode</span>
      </div>
    </nav>
  );
}
