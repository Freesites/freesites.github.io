import type { Config } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

// Diagnostic only — remove after confirming Claude API connectivity.
export default async function handler(_req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

  const client = new Anthropic({ apiKey: key, timeout: 30_000, maxRetries: 0 });

  try {
    const start = Date.now();
    const res = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    return json({
      ok: true,
      elapsed: Date.now() - start,
      model: res.model,
      text: res.content[0].type === 'text' ? res.content[0].text : null,
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config: Config = { path: '/api/test-claude' };
