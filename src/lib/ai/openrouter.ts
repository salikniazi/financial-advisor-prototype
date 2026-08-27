// Server-side only. Never import this from a client component — it reads
// OPENROUTER_API_KEY from process.env and calls OpenRouter directly.

// Two models, by role. This used to be one fixed model for every AI surface
// in the app -- that invariant predates the bank-statement work and no
// longer holds now that statement extraction needs a model chosen for
// reasoning quality on an unfamiliar document, not for cost.
//
// Role B: everything that was already here (the global assistant, the
// research assistant, asset parsing) plus statement categorisation. Bulk,
// cheap, no real reasoning required -- optimise for cost and latency.
export const MODEL = "deepseek/deepseek-v4-flash-0731";

// Role A: statement vision extraction and row repair. Rare (fanned out
// per-page but still just a handful of calls per statement), and correctness
// matters more than cost -- this is the model that actually has to make sense
// of an unfamiliar document, so reasoning quality is the only thing to
// select on.
//
// google/gemini-2.5-flash: confirmed via OpenRouter's own model page
// (WebSearch, since openrouter.ai itself is blocked by this sandbox's
// egress proxy -- direct curl and WebFetch both fail with the same
// EGRESS_BLOCKED error) to accept `tools` + `tool_choice`, and to accept
// PDF/image/text/audio/video file input. That's the two things this
// pipeline actually needs from Role A. An earlier version of this constant
// pointed at gemini-2.0-flash-001, chosen without checking either of those
// -- worth calling out since it shipped that way once already. Still not
// independently exercised end to end (no live call from this environment),
// so if it 404s as an unknown model or the file part is rejected, that's
// the first thing to check. Override with OPENROUTER_REASONING_MODEL
// without touching code.
export const REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL || "google/gemini-2.5-flash";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Requests are aborted this long before the platform's own 60s function
// budget so a hung request fails with a message this code can act on,
// instead of the whole function being killed with no chance to record
// anything.
const DEFAULT_TIMEOUT_MS = 45_000;

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/**
 * A multimodal message part. Only text and file parts are modelled -- no
 * image_url, since nothing here sends raw images; PDF pages go through as
 * file parts (OpenRouter's documented mechanism for PDF input), decided in
 * favour of client/server-side rasterisation specifically because this stack
 * has no way to rasterise a PDF page (see statementTable.ts's history --
 * pdfjs-dist's canvas polyfill and worker both failed under Next's
 * serverless bundling).
 */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export type ChatMessage = {
  role: ChatRole;
  content: string | ContentPart[] | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonSchema = Record<string, any>;

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolExecutor = (args: any) => Promise<unknown> | unknown;

export type OpenRouterResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * OpenRouter's PDF-handling plugin. The `engine` values are documented as
 * text-extraction, OCR, and native/model-handled modes, but the exact
 * current names are unverified from this environment (openrouter.ai is
 * blocked here) -- confirm against their docs before relying on a specific
 * engine. Loosely typed on purpose rather than a fabricated enum.
 */
export type OpenRouterPlugin = { id: "file-parser"; pdf?: { engine: string } } | Record<string, unknown>;

type RawCompletionResponse = {
  choices?: { message?: ChatMessage; finish_reason?: string }[];
  error?: { message?: string };
};

type CompletionValue = { message: ChatMessage; finishReason: string | null };

async function rawChatCompletion(
  messages: ChatMessage[],
  opts?: {
    model?: string;
    tools?: ToolDef[];
    tool_choice?: "auto" | { type: "function"; function: { name: string } };
    maxTokens?: number;
    timeoutMs?: number;
    plugins?: OpenRouterPlugin[];
  }
): Promise<OpenRouterResult<CompletionValue>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is not set. Add it to your environment to enable Lime's AI features." };
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter uses these to attribute/rank apps; harmless if ignored.
        "HTTP-Referer": "https://financial-advisor-prototype.vercel.app",
        "X-Title": "Lime",
      },
      body: JSON.stringify({
        model: opts?.model ?? MODEL,
        messages,
        max_tokens: opts?.maxTokens ?? 4096,
        ...(opts?.tools ? { tools: opts.tools } : {}),
        ...(opts?.tool_choice ? { tool_choice: opts.tool_choice } : {}),
        ...(opts?.plugins ? { plugins: opts.plugins } : {}),
      }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      ok: false,
      error: timedOut ? "OpenRouter didn't respond in time." : `Could not reach OpenRouter: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let body: RawCompletionResponse;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: `OpenRouter returned a non-JSON response (status ${response.status}).` };
  }

  if (!response.ok) {
    const message = body?.error?.message ?? `OpenRouter request failed with status ${response.status}.`;
    // Name the configured model id explicitly rather than a bare status --
    // an "unknown model" failure needs to say *which* id was wrong, since the
    // reasoning-model slug is only a placeholder until someone confirms it.
    const withModel = /model/i.test(message) ? `${message} (configured model: "${opts?.model ?? MODEL}")` : message;
    return { ok: false, error: withModel };
  }

  const choice = body.choices?.[0];
  if (!choice?.message) {
    return { ok: false, error: "OpenRouter returned an empty response." };
  }

  return { ok: true, value: { message: choice.message, finishReason: choice.finish_reason ?? null } };
}

/**
 * Runs the standard OpenAI-compatible tool-calling loop: sends messages + tools,
 * and if the model responds with tool_calls, executes them against the provided
 * executor registry, appends the results as `role: "tool"` messages, and calls
 * the model again. Repeats until the model returns a plain text response or the
 * iteration cap is hit.
 */
export async function runToolLoop(opts: {
  systemPrompt: string;
  history: ChatMessage[];
  tools: ToolDef[];
  executors: Record<string, ToolExecutor>;
  maxIterations?: number;
}): Promise<OpenRouterResult<{ text: string; toolCalls: { name: string; args: unknown }[] }>> {
  const { systemPrompt, history, tools, executors, maxIterations = 5 } = opts;
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...history];
  const toolCallLog: { name: string; args: unknown }[] = [];

  for (let i = 0; i < maxIterations; i++) {
    const result = await rawChatCompletion(messages, { tools, tool_choice: "auto" });
    if (!result.ok) return result;

    const { message } = result.value;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { ok: true, value: { text: typeof message.content === "string" ? message.content : "", toolCalls: toolCallLog } };
    }

    for (const call of message.tool_calls) {
      const executor = executors[call.function.name];
      let toolResult: unknown;
      if (!executor) {
        toolResult = { error: `Unknown tool "${call.function.name}"` };
      } else {
        let args: unknown = {};
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          args = {};
        }
        toolCallLog.push({ name: call.function.name, args });
        // Server-side visibility that the model is actually calling tools,
        // not hallucinating -- name only, not the arguments themselves.
        // Statement categorisation now runs through this loop and its
        // arguments carry real merchant/transaction text; logging them in
        // full would put that in Vercel's logs for no operational benefit.
        console.log(`[lime-ai] tool call: ${call.function.name}`);
        try {
          toolResult = await executor(args);
        } catch (err) {
          toolResult = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    ok: true,
    value: {
      text: "I looked into a few things but couldn't quite pin down a complete answer. Could you try rephrasing, or ask about one thing at a time?",
      toolCalls: toolCallLog,
    },
  };
}

/**
 * For structured extraction: forces the model to call exactly one tool and
 * returns its parsed arguments, rather than asking for JSON in prose (most
 * models used here don't support response_format / JSON mode). Retries once
 * on a missing or unparsable tool call.
 */
export async function extractWithForcedTool<T>(opts: {
  systemPrompt: string;
  userContent: string | ContentPart[];
  tool: ToolDef;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
  plugins?: OpenRouterPlugin[];
}): Promise<OpenRouterResult<T>> {
  const { systemPrompt, userContent, tool, model, maxTokens, timeoutMs, plugins } = opts;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await rawChatCompletion(messages, {
      model,
      maxTokens,
      timeoutMs,
      plugins,
      tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
    });
    if (!result.ok) return result;

    const { message, finishReason } = result.value;
    const call = message.tool_calls?.[0];
    if (call?.function.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments) as T;
        // Log that a tool call landed, not its contents -- real statement
        // and asset data flows through this function.
        console.log(`[lime-ai] forced tool call: ${tool.function.name}`);
        return { ok: true, value: parsed };
      } catch {
        // fall through to retry
      }
    }

    // A truncated response failing to parse is a different problem than the
    // model just not calling the tool -- retrying with the same max_tokens
    // would truncate again. Surface it distinctly rather than exhausting the
    // retry on a request that can't succeed as configured.
    if (finishReason === "length") {
      return { ok: false, error: "The model's response was cut off before it finished. Try again with a smaller input." };
    }

    // Push what the model actually said before nudging it -- without this
    // the retry sees the original request plus a bare "please retry" with no
    // record of what it tried the first time.
    messages.push(message);
    messages.push({ role: "user", content: "Please call the tool with valid, complete JSON arguments." });
  }

  return { ok: false, error: "The model didn't return usable structured data. Please try again." };
}
