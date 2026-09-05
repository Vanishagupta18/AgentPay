import OpenAI from 'openai';
import { IntentSchema, RecommendationSchema, FALLBACK_INTENT, type Intent, type Recommendation } from './schema';

// NOTE ON VERIFICATION: this file has NOT been run against the live
// OpenAI API — this sandbox can't reach api.openai.com. It typechecks
// and the fallback paths are structured to fail safe, but the actual
// model call needs to be exercised by you, locally, with a real key,
// before you trust it in a demo.

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
        {
          role: 'system',
          content:
            'Extract shopping intent from the user message as JSON with keys: ' +
            'category (string or null), maxPrice (number in rupees or null), ' +
            'keywords (string array), forBeginner (boolean or null). ' +
            'Do not invent product names, prices, or IDs — only extract what the user stated.',
        },
        { role: 'user', content: userQuery },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return FALLBACK_INTENT;

    const parsed = IntentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : FALLBACK_INTENT;
  } catch {
    // Model/API failure, malformed JSON, whatever — fail to a safe,
    // empty intent rather than throwing and breaking the request.
    return FALLBACK_INTENT;
  }
}

interface CandidateForRanking {
  id: string;
  name: string;
  price: number;
  category: string;
  tags: string[];
}

export async function rankCandidates(
  userQuery: string,
  candidates: CandidateForRanking[]
): Promise<Recommendation | null> {
  if (candidates.length === 0) return null;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You will be given a user request and a JSON list of candidate products ' +
            '(id, name, price, category, tags). Rank the candidates by fit and explain ' +
            'briefly. Respond as JSON: { "rankedProductIds": [...], "explanation": "..." }. ' +
            'You may ONLY use ids from the candidate list. Never invent an id, price, or product.',
        },
        {
          role: 'user',
          content: JSON.stringify({ userQuery, candidates }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = RecommendationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    // Enforce membership even though we asked nicely in the prompt —
    // never trust the model to have actually followed the instruction.
    const validIds = new Set(candidates.map((c) => c.id));
    const filteredIds = parsed.data.rankedProductIds.filter((id) => validIds.has(id));
    if (filteredIds.length === 0) return null;

    return { rankedProductIds: filteredIds, explanation: parsed.data.explanation };
  } catch {
    return null;
  }
}
