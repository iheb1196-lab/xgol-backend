# XGOL backend

Express and MongoDB API for XGOL's speech-writing and audio-practice flows.
Practice recordings are stored locally and sent as raw audio to Gemma 4 E2B
through the Bedrock Mantle endpoint. Feedback is streamed to the browser with
Server-Sent Events (SSE).

## Local setup

1. Install Node.js and make a local MongoDB instance available.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the required values.
4. Run `npm run seed:local` to create the required local reference data and
   verified demo account.
5. Run `npm start` (the API defaults to `http://localhost:8080`).

Bedrock Mantle supports its OpenAI Responses and Chat Completions interfaces or
its Anthropic Messages interface. Each provider has its own API key, base URL,
model, and Project/Workspace variables; see `.env.example`. Set
`BEDROCK_MANTLE_API` to `openai` or `anthropic` to select the text provider.

The browser converts each take to mono 16 kHz PCM WAV. The backend stores it in
`uploads/audio` and sends the base64-encoded recording directly to Gemma 4 E2B
through the OpenAI-compatible Chat Completions API on Bedrock Mantle. Text-only
OpenAI requests continue to use the Responses API.

The browser upload is WAV and is limited to 2.3 MB so the base64 audio plus
prompt stays under Gemma 4 E2B's 3.5 MB request limit. Files are written to
`uploads/audio`, which is intentionally ignored by Git.

## Validation

Run syntax validation for changed backend files with:

```powershell
node --check server.js
node --check controllers/practiceController/practice.js
node --check aws/mantle.js
```

Interactive API documentation is available at `/api-docs` while the server is
running.
