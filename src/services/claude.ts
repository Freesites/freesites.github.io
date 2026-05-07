import Anthropic from '@anthropic-ai/sdk';
import type { ContentJson } from '../schemas/content.schema';
import { assemblePrompt, loadDesignSpec } from '../prompts/loader';
import { withRetry } from '../utils/retry';

// ---------------------------------------------------------------------------
// Client — reads ANTHROPIC_API_KEY from the environment automatically.
// ---------------------------------------------------------------------------

// SDK-level timeout + maxRetries:0 so our withRetry wrapper controls retries.
const client = new Anthropic({ timeout: 6 * 60 * 1000, maxRetries: 0 });

// Hard per-call abort: belt-and-suspenders alongside the SDK timeout.
// Fires after 6 minutes via Node's native AbortController so it works
// regardless of SDK internals.
const CALL_TIMEOUT_MS = 6 * 60 * 1000;

function withAbort<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  return fn(controller.signal).finally(() => clearTimeout(id));
}

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';
const MAX_TOKENS = Number(process.env.CLAUDE_MAX_TOKENS ?? '8000');

// ---------------------------------------------------------------------------
// HTML cleaning and validation
// ---------------------------------------------------------------------------

// Matches a complete ``` or ```html block with a closing fence.
const CODE_FENCE_COMPLETE_RE = /^```(?:html)?\s*\n([\s\S]*?)\n```\s*$/;
// Matches an opening fence only — handles responses truncated before the closing ```.
const CODE_FENCE_OPEN_RE = /^```(?:html)?\s*\n([\s\S]*)$/;

export function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const complete = trimmed.match(CODE_FENCE_COMPLETE_RE);
  if (complete) return complete[1];
  // Truncated response: opening fence present but closing fence missing.
  const open = trimmed.match(CODE_FENCE_OPEN_RE);
  if (open) return open[1];
  return trimmed;
}

export function isValidHtml(text: string): boolean {
  // Only check the prefix — we trust Claude to produce complete documents.
  // slice(0, 15) avoids scanning the whole string for a cheap check.
  return text.trimStart().slice(0, 15).toLowerCase().startsWith('<!doctype html');
}

// ---------------------------------------------------------------------------
// Retry instruction — sent as a follow-up user turn when the first response
// fails HTML validation. Multi-turn lets Claude see what it produced and
// correct specifically rather than regenerating from scratch.
// ---------------------------------------------------------------------------

const RETRY_INSTRUCTION =
  'Your previous response did not begin with <!DOCTYPE html>. ' +
  'Output ONLY the complete HTML document. ' +
  'The very first characters of your response must be <!DOCTYPE html>. ' +
  'No explanation, no markdown, no code fences of any kind.';

// ---------------------------------------------------------------------------
// GenerationResult — returned by generateSite so callers can log cost and
// audit which template version produced each deployed site.
// ---------------------------------------------------------------------------

export interface GenerationResult {
  html: string;
  model: string;
  templateHash: string;
  inputTokens: number;
  outputTokens: number;
  retried: boolean;
}

// ---------------------------------------------------------------------------
// generateSite — orchestrates the full generation cycle:
//   1. Assemble the prompt (template + mapped payload)
//   2. Call Claude with two content blocks for prompt caching
//   3. Strip code fences and validate HTML
//   4. If invalid, retry once as a multi-turn conversation
//   5. Throw if the retry also fails
// ---------------------------------------------------------------------------

export async function generateSite(content: ContentJson): Promise<GenerationResult> {
  const assembled = assemblePrompt(content);
  const { siteId } = content;
  const { verticalType, templateHash, templatePrefix, payloadJson, templateSuffix } = assembled;

  log('generate.start', { siteId, verticalType, templateHash, model: MODEL });

  // Build the user message as up to three content blocks:
  //   block 0 — design spec (static, cached) — loaded from the Stitch export
  //             at public/stitch-reference/design-spec.md. Omitted if the file
  //             is not yet present so generation degrades gracefully.
  //   block 1 — static template prefix (cached) — identical per vertical,
  //             cache-hits on every call after the first within the TTL window.
  //   block 2 — dynamic client payload — changes per client, never cached.
  const designSpec = loadDesignSpec();
  const dynamicText = payloadJson + (templateSuffix.trim() ? '\n' + templateSuffix : '');
  const userBlocks = buildUserBlocks(templatePrefix, dynamicText, designSpec);

  const firstResponse = await withRetry(() =>
    withAbort(signal => client.messages.create(
      { model: MODEL, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: userBlocks }] },
      { signal },
    )),
  );

  const firstRaw = extractText(firstResponse);
  const firstHtml = stripCodeFences(firstRaw);

  if (isValidHtml(firstHtml)) {
    log('generate.success', {
      siteId,
      retried: false,
      inputTokens: firstResponse.usage.input_tokens,
      outputTokens: firstResponse.usage.output_tokens,
    });

    return {
      html: firstHtml,
      model: firstResponse.model,
      templateHash,
      inputTokens: firstResponse.usage.input_tokens,
      outputTokens: firstResponse.usage.output_tokens,
      retried: false,
    };
  }

  // --------------------------------------------------------------------------
  // First attempt produced invalid HTML. Build a multi-turn conversation so
  // Claude can see its own output and correct it.
  // --------------------------------------------------------------------------

  log('generate.retry', {
    siteId,
    reason: 'html_invalid',
    // Log a short preview to help debug recurring failures without flooding logs.
    preview: firstHtml.slice(0, 200),
  });

  const retryResponse = await withRetry(() =>
    withAbort(signal => client.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'user', content: userBlocks },
          { role: 'assistant', content: firstRaw },
          { role: 'user', content: RETRY_INSTRUCTION },
        ],
      },
      { signal },
    )),
  );

  const retryRaw = extractText(retryResponse);
  const retryHtml = stripCodeFences(retryRaw);

  if (!isValidHtml(retryHtml)) {
    log('generate.failed', { siteId, preview: retryHtml.slice(0, 300) });
    throw new Error(
      `HTML generation failed after retry for siteId=${siteId}. ` +
      `Output preview: ${retryHtml.slice(0, 300)}`,
    );
  }

  const totalInput = firstResponse.usage.input_tokens + retryResponse.usage.input_tokens;
  const totalOutput = firstResponse.usage.output_tokens + retryResponse.usage.output_tokens;

  log('generate.success', { siteId, retried: true, inputTokens: totalInput, outputTokens: totalOutput });

  return {
    html: retryHtml,
    model: retryResponse.model,
    templateHash,
    inputTokens: totalInput,
    outputTokens: totalOutput,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}

// Typed as readonly tuple to satisfy the Anthropic SDK's MessageParam content
// union without casting. The SDK's TextBlockParam type includes cache_control.
function buildUserBlocks(
  staticPart: string,
  dynamicPart: string,
  designSpec: string | null = null,
): Anthropic.MessageParam['content'] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  if (designSpec) {
    blocks.push({
      type: 'text',
      text: `# Design System Reference\n\nApply this design system to every generated site:\n\n${designSpec}`,
      cache_control: { type: 'ephemeral' },
    });
  }

  blocks.push({
    type: 'text',
    text: staticPart,
    cache_control: { type: 'ephemeral' },
  });

  blocks.push({
    type: 'text',
    text: dynamicPart,
  });

  return blocks;
}

function log(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...data }));
}
