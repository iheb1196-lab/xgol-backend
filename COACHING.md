# Personalized coaching

The new authenticated `/api/coaching` endpoints support the My Coaching frontend at `/coaching` and AI feedback in `/learning`. They use the existing Bedrock Mantle configuration and `RECORD_VIDEO` credit price.

## User journey

- Save a goal, audience, role, experience, challenge, feedback language/style, available practice time and optional event date.
- Start a scenario from a quick start, event preparation card or the latest feedback's practice exercise.
- Submit audio or text. Learning Lab can submit each finished recording automatically; users can turn this off before recording.
- Receive streamed AI feedback, one focus, a two-minute exercise, approximate replay moments and an explicitly labeled draft transcript when audio is intelligible.
- Save a linked retry, compare recordings and feedback, ask one included AI follow-up, rate usefulness, and mark advice applied in a real conversation.
- Request an available human coach's review, receive timestamped observations and a focused exercise, and send one follow-up question. Messages remain in the app; no emails or external notifications are sent.

Text submissions assess content and structure only. Progress and timestamps are AI observations, not validated scores. Real-life application is self-reported.

## Human coaches

A verified user with a database `EXPERT` role can open `/coach/inbox`, opt into accepting requests and set a response estimate between 1 and 168 hours. Only opted-in experts appear in the directory. A learner explicitly shares a completed attempt with one coach. Only that learner and the assigned, currently verified expert can access the attempt or its recording.

Human review and its single follow-up currently have no additional credit charge. AI evaluation uses the configured `RECORD_VIDEO` cost, with one AI follow-up included. These policies are displayed before submission. Response times are estimates supplied by the coach, not guarantees.

## Storage and operational behavior

`CoachingProfile` is unique per user. `CoachingSession` stores the profile snapshot, feedback, comparison link, human review, follow-ups and engagement signals. New collections and indexes are created by Mongoose; no existing records are migrated. Existing speech practice also reads the saved coaching profile.

Audio uses the existing local `uploads/audio` directory, with a 2.3 MiB upload limit. The coaching client converts audio to mono 12 kHz PCM WAV, allowing the 90-second learning rehearsal to fit. Duration is checked from WAV metadata. Audio is served through authenticated endpoints. Removing an attempt hides it from the learner and coach; removal is a soft delete, matching existing practice history behavior.

AI requests have a 120-second timeout. Credits are reserved with an atomic balance condition, restored on handled evaluation failures, and successful evaluations are journaled. The saved failed attempt remains available. If a browser connection ends unexpectedly, users are directed to history before submitting again.

Before a production rollout, provide persistent audio storage across application instances and backups, set a retention/purge policy, and add durable job recovery/reconciliation for server crashes during an evaluation or credit refund. Current reservation/refund handling covers request errors, not process termination or database outages. The included follow-up uses a per-session lock; an interrupted process may require clearing `followupPending` for that session after confirming no request is running.

## Verification

`npm test` runs prompt, validation, WAV and provider-stream unit tests. For the API lifecycle suite, set `XGOL_TEST_MONGO_URI` to a dedicated local database named `xgol_coaching_test_*`, then run `node --test test/coaching-api.test.js`. The test refuses other URI patterns, uses synthetic users and a mocked AI provider, and drops only its isolated test database at completion.

The API suite covers saved profiles, credit deductions/refunds, concurrent spending, comparison ownership, expert role and assignment checks, follow-up limits, expired licenses and deletion revoking coach access. Frontend interaction tests cover the text coaching journey and automatic learning feedback with linked retries.
