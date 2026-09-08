const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

test("planning HTTP contract with mocked persistence and AI", async t => {
  const Profile = require("../models/coachingProfile");
  const Session = require("../models/coachingSession");
  const License = require("../models/userLicense");
  const mantle = require("../aws/mantle");
  const learner = "111111111111111111111111";
  const writes = [];
  const reservations = [];
  let available = true;
  let malformed = false;
  let providerFailure = false;
  const validPlan = { greeting: "Let's start small.", title: "Ask for a pilot", reason: "Give your manager a specific next step.", warmup: "Name one useful outcome.", prompt: "Ask for a two-week pilot.", opening: "I'd like to test an idea.", focus: "Make one clear request.", curveball: "Why should we do this now?", takeaway: "Use the request at your next meeting." };
  const generate = t.mock.method(mantle, "streamMantleText", async options => {
    assert.equal(options.api, "openai");
    assert.ok(options.signal instanceof AbortSignal);
    const input = JSON.parse(options.prompt);
    assert.equal(input.learnerProfile.language, "French");
    assert.equal(input.recentPractice[0].focus, "Name a decision");
    if (providerFailure) throw new Error("Provider offline");
    return malformed ? "{}" : JSON.stringify(validPlan);
  });
  t.mock.method(Profile, "updateOne", async (filter, fields) => { assert.equal(filter.user, learner); writes.push({ filter, fields }); return { matchedCount: 1 }; });
  t.mock.method(Profile, "findOneAndUpdate", (filter, fields, options) => {
    assert.equal(filter.user, learner);
    assert.equal(options.new, true);
    if (fields.$set.guideDismissedAt) return Promise.resolve({ guideDismissedAt: fields.$set.guideDismissedAt });
    reservations.push({ filter, fields });
    return { lean: async () => available ? { user: learner, goal: "Win support", language: "French" } : null };
  });
  t.mock.method(Session, "find", filter => {
    assert.deepEqual(filter, { user: learner, deleted: false, status: "COMPLETED" });
    return { sort: () => ({ limit: count => {
      assert.equal(count, 3);
      return { select: () => ({ lean: async () => [{ title: "Pitch", nextFocus: "Name a decision" }] }) };
    } }) };
  });
  const debit = t.mock.method(License, "findOneAndUpdate", () => { throw new Error("Planning must not reserve assessment credits"); });
  const originalKey = process.env.JWTPRIVATEKEY;
  process.env.JWTPRIVATEKEY = "planning-http-test-only";
  t.after(() => { if (originalKey === undefined) delete process.env.JWTPRIVATEKEY; else process.env.JWTPRIVATEKEY = originalKey; });
  const app = express(); app.use(express.json()); app.use("/api", require("../routes/coachingRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.on("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const token = jwt.sign({ id: learner }, process.env.JWTPRIVATEKEY);
  async function request(route, body, authenticated = true, method = "POST") {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/coaching${route}`, { method, headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  const checkIn = { energy: "nervous", minutes: 2, situation: "Speak to my manager" };
  await t.test("authentication and validation run before planning", async () => {
    assert.equal((await request("/plan", checkIn, false)).status, 401);
    assert.equal((await request("/plan", { ...checkIn, user: "other" })).status, 400);
    assert.equal((await request("/plan", { ...checkIn, minutes: 90 })).status, 400);
    assert.equal(generate.mock.callCount(), 0);
    assert.equal(writes.length, 0);
  });
  await t.test("saves the validated mission under the authenticated account without a debit", async () => {
    const result = await request("/plan", checkIn);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.plan.checkIn, checkIn);
    assert.match(result.body.plan.id, /^[a-f\d-]{36}$/);
    const saved = writes.find(write => write.fields.$set?.currentPlan);
    assert.equal(saved.fields.$set.currentPlan.id, result.body.plan.id);
    assert.ok(saved.filter.planningRequestedAt instanceof Date);
    assert.equal(reservations[0].filter.$or[0].planningRequestedAt, null);
    assert.ok(reservations[0].filter.$or[1].planningRequestedAt.$lt instanceof Date);
    assert.equal(debit.mock.callCount(), 0);
  });
  await t.test("an occupied reservation prevents a second AI request", async () => {
    available = false;
    const before = generate.mock.callCount();
    assert.equal((await request("/plan", checkIn)).status, 429);
    assert.equal(generate.mock.callCount(), before);
    available = true;
  });
  await t.test("malformed plans and provider failures release the reservation without replacing the plan", async () => {
    for (const failType of ["malformed", "provider"]) {
      malformed = failType === "malformed"; providerFailure = failType === "provider";
      const before = writes.length;
      const result = await request("/plan", checkIn);
      assert.equal(result.status, 503);
      assert.match(result.body.message, /no credits were used/);
      assert.ok(writes.slice(before).some(write => write.fields.$unset?.planningRequestedAt === ""));
      assert.equal(writes.slice(before).some(write => write.fields.$set?.currentPlan), false);
    }
    malformed = false; providerFailure = false;
    assert.equal((await request("/plan", checkIn)).status, 200);
  });
  await t.test("guide dismissal requires authentication and returns the saved timestamp", async () => {
    assert.equal((await request("/guide", {}, false, "PATCH")).status, 401);
    const result = await request("/guide", {}, true, "PATCH");
    assert.equal(result.status, 200);
    assert.ok(Number.isFinite(new Date(result.body.guideDismissedAt).getTime()));
  });
});
