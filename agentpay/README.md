# AgentPay — AI Shopping & Payment Agent

Razorpay AI Buildathon 2026 — Track 1: AI Growth & Agentic Commerce

## Problem

AI agents can understand shopping requests and act for users, but giving
an AI access to payment workflows introduces real risk: wrong product
selection, exceeding spending limits, duplicate orders, stale prices,
unsafe retries, no audit trail.

## Solution

AI reasons and recommends → a deterministic policy engine controls every
money-related action → Razorpay Test Mode executes the payment → the
full workflow is audited.

**The rule that matters most: the LLM never talks to Razorpay directly.**
It only produces a recommendation. `lib/policy/engine.ts` is the only
thing that decides whether money is allowed to move.

```
User (natural language)
      │
      ▼
POST /api/agent/intent      — LLM extracts structured intent (Zod-validated)
      │
      ▼
POST /api/agent/recommend   — server-side catalog filter → LLM ranks
      │                        ONLY within that filtered set (membership
      │                        enforced in code, not just prompted)
      ▼
User confirms
      │
      ▼
POST /api/orders            — re-fetches product server-side (price/stock
      │                        never trusted from the client), checks
      │                        idempotency key, runs the policy engine
      │
      ├── blocked → audit log entry, no Razorpay call, clear reason
      │
      ▼ allowed
Razorpay Test Mode order created
      │
      ▼
Frontend opens Razorpay Checkout (not yet built — next phase)
      │
      ▼
POST /api/payments/verify   — HMAC-SHA256 signature check against
                               Razorpay's documented algorithm before
                               ever marking an order "paid"
```

## What's actually verified vs. what isn't

Being direct about this because it matters for how you demo and defend
this project:

**Verified, for real, in this build:**
- `npm install` succeeds on patched dependency versions (see Security below)
- `npx tsc --noEmit` passes with zero errors across the whole project
- `npx next build` succeeds — all 8 API routes compile and are correctly
  identified as dynamic server routes
- The policy engine has **10 passing unit tests** (`npm test`) covering
  every rule: confirmation, stock/active checks, spend cap, the
  high-value approval tier, category restriction, and duplicate attempts
- The seed script's product-generation logic was verified standalone —
  correct count, correct distribution of deliberate out-of-stock/inactive
  edge cases

**NOT verified — this sandbox cannot reach these services, only you can
test them locally:**
- The actual OpenAI API calls in `lib/ai/client.ts` (intent extraction,
  candidate ranking) — typechecks and has safe fallback paths, but has
  never actually talked to OpenAI
- The actual Razorpay order creation and Checkout flow — typechecks and
  mirrors the tested policy logic, but has never actually talked to
  Razorpay's API
- The seed script against a real MongoDB Atlas cluster

Do not claim in your pitch that these are tested until you've run them
yourself with real credentials.

## What's built vs. what's next

**Built:** foundation (TypeScript/Tailwind/Next config), all 4 Mongoose
models, the policy engine + full test suite, catalog filtering, the AI
wrapper with Zod validation and hard product-ID membership enforcement,
and all 8 API routes (intent, recommend, products, orders, payments/verify,
policy, audit).

**Not built yet, deliberately:** the actual frontend (agent chat UI,
Razorpay Checkout integration, dashboard, transactions table, transaction
detail timeline, audit trail page, settings page) and the 30-scenario
evaluation script. These are real, non-trivial work — building them
properly (especially a UI that doesn't look like an AI-generated
template, per your own spec) deserves dedicated attention rather than
being rushed into the same pass as the backend.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, OPENAI_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run seed                 # populates ~110 products across 8 categories
npm run dev
```

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm test             # vitest — policy engine suite
npm run build        # production build
npm run seed          # seed MongoDB with synthetic catalog
```

## Security

Dependencies were bumped off their initially-installed versions after
`npm audit` flagged real issues: Mongoose (critical — NoSQL injection /
prototype pollution advisories) and PostCSS (high — XSS/path traversal
in source-map handling) are both pinned to patched versions. One
dev-only toolchain advisory remains open (esbuild, via
tsx/vite/vitest) — it affects the local dev server's request handling,
not anything that deploys to production, and fixing it would require a
vitest major-version bump not yet validated against this test suite.
Documented here rather than silently ignored.

Server-side price/stock validation, environment-variable-only secrets,
and Razorpay signature verification are implemented as described above.

## Known limitations

Prototype, not production-hardened: single demo user (no auth system),
no rate limiting, no real webhook handling (verification happens via the
Checkout success callback only), evaluation harness not yet built.

## Environment variables

See `.env.example`. `MONGODB_URI`, `OPENAI_API_KEY`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET` — all required, none committed to git.
