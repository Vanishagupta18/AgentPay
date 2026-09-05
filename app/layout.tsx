import type { Metadata } from 'next';
import { Nav } from '../components/Nav';
import './globals.css';

export const metadata: Metadata = { title: 'AgentPay', description: 'AI shopping agent with policy-gated, provider-abstracted payments' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
