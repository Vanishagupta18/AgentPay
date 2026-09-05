import type { FilterQuery } from 'mongoose';
import type { Intent } from '../ai/schema';

export function buildProductFilter(intent: Intent): FilterQuery<Record<string, unknown>> {
  const filter: FilterQuery<Record<string, unknown>> = { isActive: true };
  if (intent.category) filter.category = intent.category;
  if (intent.maxPrice !== null) filter.price = { $lte: Math.round(intent.maxPrice * 100) };
  if (intent.forBeginner !== null) filter['attributes.forBeginner'] = intent.forBeginner;
  if (intent.keywords.length > 0) {
    filter.$or = [
      { tags: { $in: intent.keywords } },
      { name: { $regex: intent.keywords.join('|'), $options: 'i' } },
    ];
  }
  return filter;
}
