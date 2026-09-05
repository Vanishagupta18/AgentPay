import { z } from 'zod';

// Everything the LLM is allowed to produce, validated. If the model's
// output doesn't parse against these schemas, we fall back — we never
// pass raw, unvalidated model output further into the system.

export const IntentSchema = z.object({
  category: z.string().nullable(),
  maxPrice: z.number().nullable(), // rupees
  keywords: z.array(z.string()).default([]),
  forBeginner: z.boolean().nullable(),
});
export type Intent = z.infer<typeof IntentSchema>;

// The model ranks/explains ONLY over product IDs we hand it — it cannot
// invent an ID that wasn't in the candidate set we sent. We enforce that
// membership check in code (see recommend/route.ts), not just via schema.
export const RecommendationSchema = z.object({
  rankedProductIds: z.array(z.string()).min(1),
  explanation: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const FALLBACK_INTENT: Intent = {
  category: null,
  maxPrice: null,
  keywords: [],
  forBeginner: null,
};
