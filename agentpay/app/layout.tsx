import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentPay',
  description: 'AI shopping agent with policy-gated Razorpay checkout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-50 text-zinc-900 font-sans antialiased">{children}</body>
    </html>
  );
}
