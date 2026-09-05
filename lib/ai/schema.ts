import { z } from 'zod';

export const IntentSchema = z.object({
  category: z.string().nullable(),
  maxPrice: z.number().nullable(),
  keywords: z.array(z.string()).default([]),
  forBeginner: z.boolean().nullable(),
});
export type Intent = z.infer<typeof IntentSchema>;

export const RecommendationSchema = z.object({
  rankedProductIds: z.array(z.string()).min(1),
  explanation: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const FALLBACK_INTENT: Intent = { category: null, maxPrice: null, keywords: [], forBeginner: null };
