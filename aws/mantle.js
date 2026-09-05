const DEFAULT_MAX_TOKENS = 4096;

const getConfig = (requestedApi) => {
  const api = (
    requestedApi ||
    process.env.BEDROCK_MANTLE_API ||
    "openai"
  ).toLowerCase();
  if (!new Set(["openai", "anthropic"]).has(api)) {
    throw new Error(
      'BEDROCK_MANTLE_API must be either "openai" or "anthropic"'
    );
  }

  const isAnthropic = api === "anthropic";
  const apiKey = isAnthropic
    ? process.env.ANTHROPIC_MANTLE_API_KEY
    : process.env.OPENAI_MANTLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      `${
        isAnthropic ? "ANTHROPIC_MANTLE_API_KEY" : "OPENAI_MANTLE_API_KEY"
      } is not configured`
    );
  }

  const modelId = isAnthropic
    ? process.env.ANTHROPIC_MANTLE_MODEL_ID
    : process.env.OPENAI_MANTLE_MODEL_ID;
  if (!modelId) {
    throw new Error(
      `${
        isAnthropic
          ? "ANTHROPIC_MANTLE_MODEL_ID"
          : "OPENAI_MANTLE_MODEL_ID"
      } is not configured`
    );
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const baseUrl = isAnthropic
    ? process.env.ANTHROPIC_MANTLE_BASE_URL ||
      `https://bedrock-mantle.${region}.api.aws/anthropic`
    : process.env.OPENAI_MANTLE_BASE_URL ||
      `https://bedrock-mantle.${region}.api.aws/openai/v1`;
  const scopeId = isAnthropic
    ? process.env.ANTHROPIC_MANTLE_WORKSPACE_ID
    : process.env.OPENAI_MANTLE_PROJECT_ID;

  return {
    api,
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    modelId,
    scopeId,
  };
};

const parseSSEEvent = (rawEvent) => {
  const data = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") return null;
  try {
    return JSON.parse(data);
  } catch (_error) {
    return null;
  }
};

const consumeSSE = async (response, onEvent) => {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop();
    events.forEach((rawEvent) => {
      const event = parseSSEEvent(rawEvent);
      if (event) onEvent(event);
    });
  }

  buffer += decoder.decode();
  const finalEvent = parseSSEEvent(buffer);
  if (finalEvent) onEvent(finalEvent);
};

const requestMantle = async ({
  api,
  apiKey,
  baseUrl,
  modelId,
  scopeId,
  system,
  prompt,
  audio,
  signal,
}) => {
  if (api === "anthropic") {
    if (audio) {
      throw new Error(
        "Raw audio input requires the OpenAI Chat Completions API on Bedrock Mantle"
      );
    }
    const messagesUrl = baseUrl.endsWith("/v1")
      ? `${baseUrl}/messages`
      : `${baseUrl}/v1/messages`;
    return fetch(messagesUrl, {
      signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(scopeId ? { "anthropic-workspace-id": scopeId } : {}),
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: DEFAULT_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });
  }

  if (audio) {
    return fetch(`${baseUrl}/chat/completions`, {
      signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(scopeId ? { "OpenAI-Project": scopeId } : {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "input_audio",
                input_audio: {
                  data: audio.data,
                  format: audio.format,
                },
              },
            ],
          },
        ],
        max_completion_tokens: DEFAULT_MAX_TOKENS,
        reasoning_effort: "high",
        stream: true,
      }),
    });
  }

  return fetch(`${baseUrl}/responses`, {
    signal,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(scopeId ? { "OpenAI-Project": scopeId } : {}),
    },
    body: JSON.stringify({
      model: modelId,
      instructions: system,
      input: prompt,
      max_output_tokens: DEFAULT_MAX_TOKENS,
      store: false,
      stream: true,
    }),
  });
};

const responseError = async (response) => {
  let detail = "";
  try {
    const payload = await response.json();
    detail = payload.error?.message || payload.message || JSON.stringify(payload);
  } catch (_error) {
    detail = await response.text().catch(() => "");
  }
  return new Error(
    `Bedrock Mantle request failed (${response.status})${
      detail ? `: ${detail}` : ""
    }`
  );
};

/**
 * Streams text from OpenAI Responses/Chat Completions or Anthropic Messages on
 * the Amazon Bedrock Mantle endpoint. Raw audio uses Chat Completions because
 * its user-message content schema includes input_audio.
 */
const streamMantleText = async ({ api, system, prompt, audio, onText, signal }) => {
  const config = getConfig(api);
  const response = await requestMantle({ ...config, system, prompt, audio, signal });
  if (!response.ok || !response.body) throw await responseError(response);

  let fullText = "";
  let streamFailure = null;
  await consumeSSE(response, (event) => {
    let delta = "";
    if (config.api === "openai" && event.type === "response.output_text.delta") {
      delta = event.delta || "";
    }
    if (config.api === "openai" && audio) {
      const chatDelta = event.choices?.[0]?.delta?.content;
      if (typeof chatDelta === "string") delta = chatDelta;
    }
    if (
      config.api === "anthropic" &&
      event.type === "content_block_delta" &&
      event.delta?.type === "text_delta"
    ) {
      delta = event.delta.text || "";
    }

    if (delta) {
      fullText += delta;
      onText?.(delta);
    }

    if (event.type === "error" || event.type === "response.failed") {
      streamFailure = new Error(
        event.error?.message ||
          event.response?.error?.message ||
          "Bedrock Mantle stream failed"
      );
    }
  });

  if (streamFailure) throw streamFailure;
  if (!fullText) throw new Error("Bedrock Mantle returned an empty response");
  return fullText;
};

module.exports = { streamMantleText };
