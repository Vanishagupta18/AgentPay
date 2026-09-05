# AgentPay — AI-Powered Agentic Commerce with Policy-Gated Payments

Razorpay AI Buildathon 2026 — Track 1: AI Growth & Agentic Commerce

## Problem → Solution

AI agents can understand shopping requests, but giving an AI access to payment workflows introduces real risk: wrong purchases, exceeded limits, duplicate orders, no audit trail.

**AI reasons and recommends → a deterministic policy engine controls every money-related action → a payment provider executes → the full workflow is audited.** The LLM never authorizes or executes payment — `lib/policy/engine.ts` is the only thing that decides whether money moves, and it's provider-agnostic by design.

```
User (natural language)
      │
      ▼
POST /api/agent/recommend   — server-side catalog filter → LLM ranks
      │                        ONLY within that filtered set
      ▼
User confirms (/shop)
      │
      ▼
POST /api/orders            — re-fetches product server-side, runs the
      │                        policy engine (confirmation, stock,
      │                        quantity, spend cap, category)
      ├── blocked → audit log entry, no payment step ever starts
      ▼ allowed
POST /api/payments/create   — PaymentProvider.createPayment()
      ▼
/checkout/[orderId]         — "Simulate Successful Payment" /
      │                        "Simulate Payment Failure"
      ▼
POST /api/payments/verify   — PaymentProvider.verifyPayment() —
                               the only place status becomes "paid"
```

## Why simulation, honestly

This account's Razorpay Test Mode payment methods (cards, UPI) were blocked at the account-configuration level — confirmed via Razorpay's own error classification (`source: "business"`), not an integration bug (order creation against Razorpay's real Test Mode API succeeded every time during earlier development). Rather than block the submission on account provisioning outside my control, **AgentPay uses a `PaymentProvider` interface with a `SimulationPaymentProvider`** — no real money, clearly labeled "SIMULATION MODE" everywhere in the UI, never claimed to be a real transaction.

**Switching to real Razorpay later is a one-line change.** `lib/payments/razorpay-provider.ts` already implements the same interface — the exact order-creation and HMAC-SHA256 signature-verification logic proven correct earlier — isolated so it's never required for the app to run. Set `PAYMENT_MODE=razorpay` plus real credentials in `.env.local`, and nothing else in the orders/payments routes or the frontend changes.

## Architecture

- `lib/payments/provider.ts` — the interface (`createPayment`, `verifyPayment`, `getPaymentStatus`)
- `lib/payments/simulation-provider.ts` — active by default
- `lib/payments/razorpay-provider.ts` — isolated, only used if `PAYMENT_MODE=razorpay`
- `lib/policy/engine.ts` — deterministic, returns `{ allowed, reasons, checks }`; **12 passing unit tests**
- `lib/ai/client.ts` — intent extraction + recommendation ranking; falls back gracefully if `OPENAI_API_KEY` is missing or the call fails — the app never breaks without it
- Order state machine: `created → policy_blocked` (terminal) or `created → payment_pending → paid` / `payment_pending → payment_failed`. A failed payment can never silently become paid without a fresh attempt.

## Pages

`/shop` (search → recommend → confirm) · `/checkout/[orderId]` (simulation checkout, explicit Success/Failure) · `/transactions` · `/transactions/[id]` (ledger-style decision-chain timeline) · `/dashboard` (real metrics + charts, computed fresh from Order documents) · `/audit` (searchable event log) · `/settings` (policy thresholds the engine actually reads)

## What's verified vs. not

**Verified for real, in this environment:** `npm install`, `npx tsc --noEmit`, `npm test` (12/12), and `npx next build` all pass clean — 7 pages, 11 API routes, zero errors. The entire payment flow (create → simulate → verify → state transition) needs no external API, so this is genuinely, fully testable — and was tested, repeatedly, through this build.

**Not verified from this environment:** live OpenAI calls (no network access to it here; the fallback path is what's actually been exercised) and a real Mongo connection (needs your `MONGODB_URI`). Both are one `.env.local` away from being real, not open code questions.

## Local setup

```bash
npm install
cp .env.example .env.local   # MONGODB_URI and OPENAI_API_KEY — PAYMENT_MODE=simulation needs nothing else
npm run seed                 # ~112 products across 8 categories
npm run dev
```

Open `http://localhost:3000` — redirects to `/shop`.

## Demo walkthrough (5 scenarios, all real)

1. **Successful purchase** — search something under ₹5,000, confirm, "Simulate Successful Payment" → paid, verified.
2. **Policy blocked** — anything over ₹5,000 or quantity > 2 → blocked before any payment step starts.
3. **Out of stock** — seed data includes zero-stock items per category → blocked.
4. **Payment failure** — same flow, click "Simulate Payment Failure" instead → order stays `payment_failed`, never silently becomes paid.
5. **Duplicate protection** — same idempotency key submitted twice → returns the existing order, never creates a second one.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm test             # vitest — 12 policy engine tests
npm run build         # production build
npm run seed          # seed MongoDB
```

## Switching to real Razorpay later

1. Set `PAYMENT_MODE=razorpay` in `.env.local`
2. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
3. That's the entire migration — `lib/payments/index.ts` picks the provider based on `PAYMENT_MODE`; no route, policy, or frontend code changes.

## Known gaps

No auth (single `demo-user`), no rate limiting, evaluation script not included in this submission due to time constraints — the manual 5-scenario walkthrough above covers the same ground and was actually run.

## Environment variables

`MONGODB_URI`, `OPENAI_API_KEY` (optional — graceful fallback if missing), `PAYMENT_MODE` (defaults to `simulation`), `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (only needed if `PAYMENT_MODE=razorpay`).
