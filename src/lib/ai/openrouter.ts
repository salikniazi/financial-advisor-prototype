// Server-side only. Never import this from a client component — it reads
// OPENROUTER_API_KEY from process.env and calls OpenRouter directly.

// The model is intentionally fixed, not configurable via env var: every AI
// surface in this app must use exactly this model.
export const MODEL = "deepseek/deepseek-v4-flash-0731";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage = {
  role: ChatRole;
  content: string | null;
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

type RawCompletionResponse = {
  choices?: { message?: ChatMessage; finish_reason?: string }[];
  error?: { message?: string };
};

async function rawChatCompletion(
  messages: ChatMessage[],
  opts?: { tools?: ToolDef[]; tool_choice?: "auto" | { type: "function"; function: { name: string } } }
): Promise<OpenRouterResult<ChatMessage>> {
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
        model: MODEL,
        messages,
        ...(opts?.tools ? { tools: opts.tools } : {}),
        ...(opts?.tool_choice ? { tool_choice: opts.tool_choice } : {}),
      }),
    });
  } catch (err) {
    return { ok: false, error: `Could not reach OpenRouter: ${err instanceof Error ? err.message : String(err)}` };
  }

  let body: RawCompletionResponse;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: `OpenRouter returned a non-JSON response (status ${response.status}).` };
  }

  if (!response.ok) {
    const message = body?.error?.message ?? `OpenRouter request failed with status ${response.status}.`;
    return { ok: false, error: message };
  }

  const message = body.choices?.[0]?.message;
  if (!message) {
    return { ok: false, error: "OpenRouter returned an empty response." };
  }

  return { ok: true, value: message };
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

    const message = result.value;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { ok: true, value: { text: message.content ?? "", toolCalls: toolCallLog } };
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
        // Server-side visibility that the model is actually calling tools, not hallucinating.
        console.log(`[lime-ai] tool call: ${call.function.name}`, args);
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
 * For structured extraction (Part 4): forces the model to call exactly one
 * tool and returns its parsed arguments, rather than asking for JSON in prose
 * (this model doesn't support response_format / JSON mode). Retries once on a
 * missing or unparsable tool call.
 */
export async function extractWithForcedTool<T>(opts: {
  systemPrompt: string;
  userContent: string;
  tool: ToolDef;
}): Promise<OpenRouterResult<T>> {
  const { systemPrompt, userContent, tool } = opts;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await rawChatCompletion(messages, {
      tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
    });
    if (!result.ok) return result;

    const call = result.value.tool_calls?.[0];
    if (call?.function.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments) as T;
        console.log(`[lime-ai] forced tool call: ${tool.function.name}`, parsed);
        return { ok: true, value: parsed };
      } catch {
        // fall through to retry
      }
    }
    // Nudge and retry once.
    messages.push({ role: "user", content: "Please call the tool with valid, complete JSON arguments." });
  }

  return { ok: false, error: "The model didn't return usable structured data. Please try rephrasing what you pasted." };
}
