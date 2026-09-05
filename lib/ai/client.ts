import OpenAI from 'openai';
import { IntentSchema, RecommendationSchema, FALLBACK_INTENT, type Intent, type Recommendation } from './schema';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set.');
  return new OpenAI({ apiKey });
}

export async function extractIntent(userQuery: string): Promise<Intent> {
  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Extract shopping intent as JSON: category (string|null), maxPrice (number in rupees|null), keywords (string[]), forBeginner (boolean|null). Only extract what the user stated — never invent details.' },
        { role: 'user', content: userQuery },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return FALLBACK_INTENT;
    const parsed = IntentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : FALLBACK_INTENT;
  } catch {
    return FALLBACK_INTENT;
  }
}

interface CandidateForRanking {
  id: string; name: string; price: number; category: string; tags: string[];
}

export async function rankCandidates(userQuery: string, candidates: CandidateForRanking[]): Promise<Recommendation | null> {
  if (candidates.length === 0) return null;
  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Rank candidate products by fit to the user request. Respond as JSON: { "rankedProductIds": [...], "explanation": "..." }. Only use ids from the candidate list — never invent one.' },
        { role: 'user', content: JSON.stringify({ userQuery, candidates }) },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = RecommendationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const validIds = new Set(candidates.map((c) => c.id));
    const filteredIds = parsed.data.rankedProductIds.filter((id) => validIds.has(id));
    if (filteredIds.length === 0) return null;
    return { rankedProductIds: filteredIds, explanation: parsed.data.explanation };
  } catch {
    return null;
  }
}
