import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export const getAnthropicClient = (): Anthropic => {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your .env file or export it."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
};

export const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export interface StreamOptions {
  model?: string;
  system?: string;
  maxTokens?: number;
}

export const streamResponse = async (
  prompt: string,
  options: StreamOptions = {}
): Promise<string> => {
  const anthropic = getAnthropicClient();
  const {
    model = DEFAULT_MODEL,
    system,
    maxTokens = 4096,
  } = options;

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: system ?? undefined,
    messages: [{ role: "user", content: prompt }],
  });

  let fullText = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
      fullText += event.delta.text;
    }
  }
  process.stdout.write("\n");
  return fullText;
};

export const getResponse = async (
  prompt: string,
  options: StreamOptions = {}
): Promise<string> => {
  const anthropic = getAnthropicClient();
  const {
    model = DEFAULT_MODEL,
    system,
    maxTokens = 4096,
  } = options;

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: system ?? undefined,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }
  return "";
};
