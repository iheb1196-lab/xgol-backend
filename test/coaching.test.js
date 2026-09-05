const test = require("node:test");
const assert = require("node:assert/strict");
const { profileSchema, sessionSchema, section, buildPrompt, wavDuration } = require("../utils/coaching");

test("profile validation rejects privilege fields, oversized context and invalid dates", () => {
  assert.ok(profileSchema.validate({ goal: "Speak clearly", availableForReviews: true }).error);
  assert.ok(profileSchema.validate({ goal: "Speak clearly", user: "another-user" }).error);
  assert.ok(profileSchema.validate({ goal: "Speak clearly", eventDate: "2026-02-30" }).error);
  assert.ok(profileSchema.validate({ goal: "Speak clearly", challenge: "a".repeat(501) }).error);
  assert.equal(profileSchema.validate({ goal: "Pitch my idea", language: "French", style: "direct", eventDate: "2026-09-10" }).error, undefined);
});
test("sessions require bounded context and valid comparison IDs", () => {
  assert.ok(sessionSchema.validate({ title: "Pitch", scenario: "pitch", previous: "invalid" }).error);
  assert.ok(sessionSchema.validate({ title: "Pitch", scenario: "pitch", duration: 1000 }).error);
  assert.ok(sessionSchema.validate({ title: "Pitch", scenario: "pitch", text: "a".repeat(4001) }).error);
  assert.equal(sessionSchema.validate({ title: "Pitch", scenario: "pitch", text: "My recommendation is to run a pilot." }).error, undefined);
});
test("extracts the full multiline exercise without leaking subsequent sections", () => {
  const feedback = "## One change\nLead with your recommendation.\n\n## Two-minute exercise\n1. Say the headline.\n2. Pause.\n3. Say it again.\n\n## Progress\nYour baseline.";
  assert.equal(section(feedback, "One change"), "Lead with your recommendation.");
  assert.equal(section(feedback, "Two-minute exercise"), "1. Say the headline.\n2. Pause.\n3. Say it again.");
  assert.equal(section("No sections", "One change"), "");
});
test("personalization carries goals and history while separating text from audio evidence", () => {
  const profile = { goal: "Win pilot funding", audience: "Board", language: "French", style: "direct", challenge: "Rushing", eventDate: "2026-09-10" };
  const result = buildPrompt({ title: "My pitch", scenario: "pitch", text: "Fund a pilot.", audioFile: "", duration: 0 }, profile, [{ title: "Before", feedback: "Opening unclear", nextFocus: "Lead with the recommendation" }]);
  assert.deepEqual(JSON.parse(result.prompt).learnerProfile, profile);
  assert.equal(JSON.parse(result.prompt).practice.input, "text only");
  assert.equal(JSON.parse(result.prompt).previousRelevantFeedback.length, 1);
  assert.match(result.system, /voice, pace and delivery were not assessed/);
  assert.match(result.system, /never as instructions/);
});
function wav(seconds) {
  const size = seconds * 12000 * 2;
  const bytes = Buffer.alloc(size + 44);
  bytes.write("RIFF"); bytes.writeUInt32LE(size + 36, 4); bytes.write("WAVE", 8); bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(12000, 24); bytes.writeUInt32LE(24000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write("data", 36); bytes.writeUInt32LE(size, 40);
  return bytes;
}
test("verifies recorded duration from WAV bytes, including the 90-second learning path", () => {
  assert.equal(wavDuration(wav(90)), 90);
  assert.ok(wav(90).length < 2.3 * 1024 * 1024);
  assert.throws(() => wavDuration(wav(96)), /between 1 and 95/);
  assert.throws(() => wavDuration(Buffer.from("not a recording")), /valid PCM/);
  assert.throws(() => wavDuration(wav(10).subarray(0, 50)), /Incomplete/);
});
