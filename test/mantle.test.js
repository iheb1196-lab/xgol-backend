const assert = require("node:assert/strict");
const test = require("node:test");

const { streamMantleText } = require("../aws/mantle");

test("raw WAV uses Chat Completions and relays streamed text", async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = {
    OPENAI_MANTLE_API_KEY: process.env.OPENAI_MANTLE_API_KEY,
    OPENAI_MANTLE_BASE_URL: process.env.OPENAI_MANTLE_BASE_URL,
    OPENAI_MANTLE_MODEL_ID: process.env.OPENAI_MANTLE_MODEL_ID,
    OPENAI_MANTLE_PROJECT_ID: process.env.OPENAI_MANTLE_PROJECT_ID,
  };

  t.after(() => {
    global.fetch = originalFetch;
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  process.env.OPENAI_MANTLE_API_KEY = "test-key";
  process.env.OPENAI_MANTLE_BASE_URL =
    "https://bedrock-mantle.us-east-1.api.aws/openai/v1";
  process.env.OPENAI_MANTLE_MODEL_ID = "google.gemma-4-e2b";
  process.env.OPENAI_MANTLE_PROJECT_ID = "proj_test";

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return new Response(
      [
        `data: ${JSON.stringify({
          choices: [{ delta: { content: "Clear " } }],
        })}`,
        `data: ${JSON.stringify({
          choices: [{ delta: { content: "feedback" } }],
        })}`,
        "data: [DONE]",
        "",
      ].join("\n\n"),
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  };

  const deltas = [];
  const result = await streamMantleText({
    api: "openai",
    system: "Coach the speaker.",
    prompt: "Evaluate this recording.",
    audio: { data: "UklGRg==", format: "wav" },
    onText: (delta) => deltas.push(delta),
  });

  assert.equal(
    request.url,
    "https://bedrock-mantle.us-east-1.api.aws/openai/v1/chat/completions"
  );
  assert.equal(request.options.headers["OpenAI-Project"], "proj_test");

  const payload = JSON.parse(request.options.body);
  assert.equal(payload.model, "google.gemma-4-e2b");
  assert.equal(payload.reasoning_effort, "high");
  assert.deepEqual(payload.messages[1].content, [
    { type: "text", text: "Evaluate this recording." },
    {
      type: "input_audio",
      input_audio: { data: "UklGRg==", format: "wav" },
    },
  ]);
  assert.deepEqual(deltas, ["Clear ", "feedback"]);
  assert.equal(result, "Clear feedback");
});
