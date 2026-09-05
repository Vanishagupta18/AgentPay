import type { FilterQuery } from 'mongoose';
import type { Intent } from '../ai/schema';

// Deterministic, server-side filtering. This is what shrinks "several
// hundred products" down to a small candidate set BEFORE anything goes
// to the LLM — we never send the whole catalog to the model.
export function buildProductFilter(intent: Intent): FilterQuery<Record<string, unknown>> {
  const filter: FilterQuery<Record<string, unknown>> = { isActive: true };

  if (intent.category) {
    filter.category = intent.category;
  }
  if (intent.maxPrice !== null) {
    filter.price = { $lte: Math.round(intent.maxPrice * 100) }; // rupees -> paise
  }
  if (intent.forBeginner !== null) {
    filter['attributes.forBeginner'] = intent.forBeginner;
  }
  if (intent.keywords.length > 0) {
    filter.$or = [
      { tags: { $in: intent.keywords } },
      { name: { $regex: intent.keywords.join('|'), $options: 'i' } },
    ];
  }
  return filter;
}
