// Provider abstraction: the pipeline asks for "a structured verdict from a
// prompt (+ optional image)" and this module routes it to whichever vendor
// key is configured. OPENAI_API_KEY wins if both are set; TUNYL_PROVIDER
// (openai | anthropic) forces a choice; TUNYL_MODEL overrides the model.

import type { ZodType } from "zod";

// gpt-5.6-terra over gpt-5.6-luna: verified 2026-08-04 — Luna is the budget
// tier with a documented reasoning gap and no track record on docket-style
// scene understanding; Terra costs ~$0.09-0.12/read. Switch via TUNYL_MODEL
// only after an eval-set comparison shows Luna's miss rate is acceptable.
const OPENAI_DEFAULT_MODEL = "gpt-5.6-terra";
const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 16000;

export type ParseRequest = {
  system?: string;
  text: string;
  imageB64?: string;
  schemaName: string;
};

export function providerInfo(): { provider: "openai" | "anthropic"; model: string } {
  const forced = process.env.TUNYL_PROVIDER;
  const provider =
    forced === "openai" || forced === "anthropic"
      ? forced
      : process.env.OPENAI_API_KEY
        ? "openai"
        : "anthropic";
  const model =
    process.env.TUNYL_MODEL ||
    (provider === "openai" ? OPENAI_DEFAULT_MODEL : ANTHROPIC_DEFAULT_MODEL);
  return { provider, model };
}

function err(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export async function structuredParse<T>(req: ParseRequest, schema: ZodType<T>): Promise<T> {
  const { provider, model } = providerInfo();
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw err("NO_KEY", "OPENAI_API_KEY is not configured");
    return openaiParse(req, schema, model);
  }
  if (!process.env.ANTHROPIC_API_KEY) throw err("NO_KEY", "ANTHROPIC_API_KEY is not configured");
  return anthropicParse(req, schema, model);
}

// Responses API + zodTextFormat is OpenAI's recommended path for new code
// (Chat Completions still works but is the legacy surface). detail is set
// explicitly: on GPT-5.6, "auto" means original resolution, which makes image
// token cost unpredictable; our client already resizes to 1568px.
async function openaiParse<T>(req: ParseRequest, schema: ZodType<T>, model: string): Promise<T> {
  const { default: OpenAI } = await import("openai");
  const { zodTextFormat } = await import("openai/helpers/zod");
  const client = new OpenAI();

  const content: Array<
    | { type: "input_image"; image_url: string; detail: "high" }
    | { type: "input_text"; text: string }
  > = [];
  if (req.imageB64) {
    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${req.imageB64}`,
      detail: "high",
    });
  }
  content.push({ type: "input_text", text: req.text });

  const response = await client.responses.parse({
    model,
    max_output_tokens: MAX_TOKENS,
    input: [
      ...(req.system ? [{ role: "system" as const, content: req.system }] : []),
      { role: "user" as const, content },
    ],
    text: { format: zodTextFormat(schema, req.schemaName) },
  });

  const refused = response.output?.some(
    (item) =>
      item.type === "message" &&
      item.content.some((c) => c.type === "refusal"),
  );
  if (refused) {
    throw err("REFUSAL", "The model declined to analyse this image. Try a different photo.");
  }
  if (!response.output_parsed) throw new Error(`${req.schemaName} returned no parseable output`);
  return response.output_parsed as T;
}

async function anthropicParse<T>(req: ParseRequest, schema: ZodType<T>, model: string): Promise<T> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
  const client = new Anthropic();

  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
    | { type: "text"; text: string }
  > = [];
  if (req.imageB64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: req.imageB64 },
    });
  }
  content.push({ type: "text", text: req.text });

  const response = await client.messages.parse({
    model,
    max_tokens: MAX_TOKENS,
    ...(req.system
      ? { system: [{ type: "text" as const, text: req.system, cache_control: { type: "ephemeral" as const } }] }
      : {}),
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(schema) },
  });

  if (response.stop_reason === "refusal") {
    throw err("REFUSAL", "The model declined to analyse this image. Try a different photo.");
  }
  if (!response.parsed_output) throw new Error(`${req.schemaName} returned no parseable output`);
  return response.parsed_output as T;
}
