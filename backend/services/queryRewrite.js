import { config } from '../config.js';

// Words that point back at something earlier in the chat.
const DANGLING_REFERENCE = /\b(it|its|it's|that|this|they|them|their|those|these|he|she|his|her|there|same|above)\b/i;

const STANDALONE_WORD_COUNT = 3;
const MAX_QUERY_CHARS = 300;

// Cheap checks first, so most questions never reach the model.
export const needsRewrite = (message, history) => {
  if (history.length === 0) return false;

  const words = message.trim().split(/\s+/);
  // "why?" on its own is not much to search for.
  if (words.length <= STANDALONE_WORD_COUNT) return true;

  return DANGLING_REFERENCE.test(message);
};

const REWRITE_PROMPT = `You rewrite a follow-up question into a question that stands on its own.

Replace pronouns and references with what they point to in the conversation.
Keep the wording and terminology of the original as closely as you can.
Do not answer the question, explain, or add anything that was not said.
Reply with the rewritten question and nothing else.`;

// Returns what to search for. Any failure keeps the original question.
export const resolveSearchQuery = async (client, message, history) => {
  if (!needsRewrite(message, history)) return message;

  try {
    const transcript = history
      .map((turn) => `${turn.role === 'user' ? 'Question' : 'Answer'}: ${turn.content}`)
      .join('\n');

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      // One sentence is plenty, and caps the cost.
      max_tokens: 60,
      messages: [
        { role: 'system', content: REWRITE_PROMPT },
        { role: 'user', content: `${transcript}\n\nFollow-up: ${message}\n\nStandalone question:` },
      ],
    }, { timeout: config.requestTimeoutMs });

    const rewritten = completion.choices?.[0]?.message?.content?.trim();

    // A paragraph or an empty string would search worse than the original.
    if (!rewritten || rewritten.length > MAX_QUERY_CHARS) return message;

    return rewritten;
  } catch {
    return message;
  }
};
