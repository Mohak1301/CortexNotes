import { config } from '../config.js';

// Words that point at something said earlier. A question containing one cannot be
// answered on its own, which is exactly when a rewrite earns its cost.
const DANGLING_REFERENCE = /\b(it|its|it's|that|this|they|them|their|those|these|he|she|his|her|there|same|above)\b/i;

const STANDALONE_WORD_COUNT = 3;
const MAX_QUERY_CHARS = 300;

// Two gates, cheapest first. Most questions pass straight through and cost nothing:
// a first message has no context to resolve, and a fully spelled out question does
// not need resolving. Only what survives both reaches the model.
export const needsRewrite = (message, history) => {
  if (history.length === 0) return false;

  const words = message.trim().split(/\s+/);
  // "why?" or "and refunds?" carry almost nothing on their own.
  if (words.length <= STANDALONE_WORD_COUNT) return true;

  return DANGLING_REFERENCE.test(message);
};

const REWRITE_PROMPT = `You rewrite a follow-up question into a question that stands on its own.

Replace pronouns and references with what they point to in the conversation.
Keep the wording and terminology of the original as closely as you can.
Do not answer the question, explain, or add anything that was not said.
Reply with the rewritten question and nothing else.`;

// Returns the query to search with. Rewriting is an optimisation, so every failure
// path returns the original question: a slower or vaguer search beats no answer.
export const resolveSearchQuery = async (client, message, history) => {
  if (!needsRewrite(message, history)) return message;

  try {
    const transcript = history
      .map((turn) => `${turn.role === 'user' ? 'Question' : 'Answer'}: ${turn.content}`)
      .join('\n');

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      // A standalone question is one sentence. This is also the cost ceiling.
      max_tokens: 60,
      messages: [
        { role: 'system', content: REWRITE_PROMPT },
        { role: 'user', content: `${transcript}\n\nFollow-up: ${message}\n\nStandalone question:` },
      ],
    }, { timeout: config.requestTimeoutMs });

    const rewritten = completion.choices?.[0]?.message?.content?.trim();

    // A model asked for one sentence can still return a paragraph or an empty
    // string, and either would make retrieval worse than the original.
    if (!rewritten || rewritten.length > MAX_QUERY_CHARS) return message;

    return rewritten;
  } catch {
    return message;
  }
};
