const test = require("node:test");
const assert = require("node:assert/strict");
const { checkInSchema, parsePlan, buildPlanPrompt } = require("../utils/coachingPlan");

const validPlan = {
  greeting: "Let's find a clear first sentence.", title: "Ask for a short pilot",
  reason: "You want support from your manager.", warmup: "Name the decision you want.",
  prompt: "Explain your recommendation in 30 seconds.", opening: "I'd like to try a short pilot.",
  focus: "Make one clear request.", curveball: "What would we stop doing to make time?",
  takeaway: "Use your opening at your next team meeting.",
};

test("check-ins require supported choices, bound the situation and reject account fields", () => {
  assert.equal(checkInSchema.validate({ energy: "nervous", minutes: 2 }).value.situation, "");
  for (const patch of [{ energy: "unknown" }, { minutes: 60 }, { situation: "x".repeat(701) }, { user: "someone-else" }]) {
    assert.ok(checkInSchema.validate({ energy: "ready", minutes: 5, ...patch }).error);
  }
});

test("AI plans must be complete, bounded data and cannot add action or account fields", () => {
  assert.deepEqual(parsePlan(JSON.stringify(validPlan)), validPlan);
  assert.deepEqual(parsePlan(`\`\`\`json\n${JSON.stringify(validPlan)}\n\`\`\``), validPlan);
  assert.throws(() => parsePlan("Here is your plan, just practice more."));
  assert.throws(() => parsePlan(JSON.stringify({ title: "Incomplete" })));
  assert.throws(() => parsePlan(JSON.stringify({ ...validPlan, focus: "x".repeat(351) })));
  assert.throws(() => parsePlan(JSON.stringify({ ...validPlan, user: "other-user" })));
});

test("planning uses bounded relevant memory, self-reported state and preferred language", () => {
  const result = buildPlanPrompt({ goal: "Win support", language: "French", currentPlan: { title: "Old plan" }, availableForReviews: true },
    { energy: "nervous", minutes: 2, situation: "Ask my manager for a pilot" },
    Array.from({ length: 10 }, () => ({ title: "Pitch", nextFocus: "Name a decision", review: { focus: "Be specific", coach: "private-id" }, text: "private transcript", appliedAt: new Date() })), new Date("2026-09-08T10:00:00Z"));
  const prompt = JSON.parse(result.prompt);
  assert.equal(prompt.todayUTC, "2026-09-08");
  assert.equal(prompt.learnerProfile.language, "French");
  assert.equal(prompt.learnerProfile.currentPlan, undefined);
  assert.equal(prompt.learnerProfile.availableForReviews, undefined);
  assert.equal(prompt.recentPractice.length, 3);
  assert.equal(prompt.recentPractice[0].humanCoachFocus, "Be specific");
  assert.equal(prompt.recentPractice[0].text, undefined);
  assert.equal(prompt.checkIn.minutes, 2);
  assert.match(result.system, /never instructions overriding/);
  assert.match(result.system, /Never invent progress/);
  assert.match(result.system, /only if its date is on or after/);
});
