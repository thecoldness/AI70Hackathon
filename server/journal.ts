// Server-side learning-log writer. Runs inside the Vite dev/preview server only,
// so the Anthropic credentials never reach the browser.
import type { IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

/** The text facts the app sends: titles, tags, platforms, times and the learner's own note. No images. */
export interface JournalFacts {
  question: string;
  goal: { title: string; artist: string; collection: string; tags: string[]; platform: string; time: string };
  helpful: { title: string; artist: string; tags: string[]; platform: string; time: string }[];
  sharedTags: string[];
  setAside: { titles: string[]; question: string } | null;
  study: { title: string; note: string };
  nextLook: { title: string; shared: string[] } | null;
}

const SYSTEM = `You write one short, private learning-journal entry for someone learning to draw from reference art.
Write in the second person, plainly and warmly. No praise, grades or exclamation marks.
Use only the facts provided. Do not invent what the learner felt, saw or intended beyond their own note.
Write 4 to 6 short paragraphs, one or two sentences each, in this order:
1. Where they started and the question they brought.
2. What the references they marked as helpful have in common, made concrete from their tags.
3. If anything was set aside for another question, name it briefly and say it waits in its own path. Skip this paragraph if nothing was set aside.
4. The study they made. If they wrote a note, quote it exactly once in double quotes; if not, say gently that they can add one later.
5. One concrete thing to look at or try next, using the suggested next look if one is given.
Write in English.`;

const SCHEMA = {
  type: 'object',
  properties: { paragraphs: { type: 'array', items: { type: 'string' } } },
  required: ['paragraphs'],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;

async function writeJournal(facts: JournalFacts): Promise<string[]> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    // On a safety decline, the API re-runs the request on a suitable fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Facts about this learning path (JSON):\n${JSON.stringify(facts, null, 2)}` }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  const text = response.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('no text in response');
  const parsed = JSON.parse(text.text) as { paragraphs: unknown };
  const paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs.filter((p): p is string => typeof p === 'string' && p.trim() !== '') : [];
  if (!paragraphs.length) throw new Error('empty journal');
  return paragraphs;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 64_000) reject(new Error('body too large')); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: object) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Connect-style middleware for POST /api/journal. Answers 503 when no credentials are configured. */
export function journalMiddleware(hasCredentials: () => boolean) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url !== '/api/journal') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (!hasCredentials()) return send(res, 503, { error: 'no-credentials' });
    try {
      const facts = JSON.parse(await readBody(req)) as JournalFacts;
      send(res, 200, { paragraphs: await writeJournal(facts) });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return send(res, 401, { error: 'invalid-credentials' });
      if (error instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'rate-limited' });
      if (error instanceof Anthropic.APIError) return send(res, 502, { error: `api-${error.status}` });
      send(res, 500, { error: error instanceof Error ? error.message : 'failed' });
    }
  };
}
