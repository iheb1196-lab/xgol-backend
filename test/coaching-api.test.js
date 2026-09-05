const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");

test("coaching API: persistence, credits, isolation, retries and human review lifecycle", { skip: !process.env.XGOL_TEST_MONGO_URI }, async t => {
  const uri = process.env.XGOL_TEST_MONGO_URI;
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:\d+\/xgol_coaching_test_[a-z0-9_]+$/);
  await mongoose.connect(uri);
  t.after(async () => {
    if (mongoose.connection.readyState) {
      assert.match(mongoose.connection.name, /^xgol_coaching_test_/);
      const recordings = mongoose.models.CoachingSession ? await mongoose.models.CoachingSession.find().select("+audioFile").lean() : [];
      const { audioDir } = require("../middleware/uploadAudio");
      for (const item of recordings) {
        if (item.audioFile) await require("fs/promises").unlink(require("path").join(audioDir, require("path").basename(item.audioFile))).catch(() => {});
      }
      await mongoose.connection.dropDatabase(); await mongoose.disconnect();
    }
  });
  const User = require("../models/user");
  const Role = require("../models/role");
  const Profile = require("../models/coachingProfile");
  const Session = require("../models/coachingSession");
  const License = require("../models/userLicense");
  const Feature = require("../models/featureType");
  const mantle = require("../aws/mantle");
  let providerFailure = false;
  const prompts = [];
  const originalStream = mantle.streamMantleText;
  mantle.streamMantleText = async options => {
    if (providerFailure) throw new Error("Simulated provider outage");
    prompts.push(options);
    const feedback = "## Your goal\nWin board support.\n## What worked\nYour recommendation was clear.\n## One change\nName a concrete next step.\n## Two-minute exercise\n1. State the decision.\n2. Add an owner.\n3. Repeat.\n## Moments to replay\nNo audio timestamps available.\n## Progress\nThis is the baseline.\n## Transcript draft\nText submission; no audio transcript.";
    options.onText?.(feedback); return feedback;
  };
  const originalKey = process.env.JWTPRIVATEKEY;
  process.env.JWTPRIVATEKEY = "isolated-coaching-tests-only";
  const app = express(); app.use(express.json()); app.use("/api", require("../routes/coachingRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.on("listening", resolve));
  t.after(async () => {
    mantle.streamMantleText = originalStream;
    if (originalKey === undefined) delete process.env.JWTPRIVATEKEY; else process.env.JWTPRIVATEKEY = originalKey;
    await new Promise(resolve => server.close(resolve));
  });
  const roles = await Role.create([{ name: "CLIENT", description: "Test client" }, { name: "EXPERT", description: "Test expert" }]);
  const users = await User.create([
    { firstName: "Learner", emails: ["learner@example.invalid"], verified: true, role: [roles[0]._id] },
    { firstName: "Other learner", emails: ["other@example.invalid"], verified: true, role: [roles[0]._id] },
    { firstName: "Coach", emails: ["coach@example.invalid"], verified: true, role: [roles[1]._id] },
  ]);
  const tokens = users.map(u => jwt.sign({ id: String(u._id), permissions: ["RECORD_VIDEO"], roles: ["CLIENT"] }, process.env.JWTPRIVATEKEY));
  await Feature.create({ name: "RECORD_VIDEO", credits: 2, description: "Test AI assessment" });
  await License.create(users.slice(0, 2).map((u, i) => ({ user: u._id, license: "65b799b92267c99026b2fa75", licenseEmail: `test${i}@example.invalid`, licenseSecret: `isolated-fixture-${i}`, activated: true, credits: 20, expiryDate: "2099-01-01T00:00:00.000Z" })));
  const base = `http://127.0.0.1:${server.address().port}/api/coaching`;
  async function request(route = "", method = "GET", body, user = 0) {
    const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[user]}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const raw = await response.text();
    const events = raw.startsWith("data:") ? raw.split("\n\n").filter(Boolean).map(s => JSON.parse(s.slice(6))) : null;
    return { status: response.status, data: events ? events.find(e => e.type === "done") : JSON.parse(raw), events };
  }
  const input = { title: "Board pitch", scenario: "pitch", text: "I recommend a short pilot to test demand with our customers." };
  let sessionId;
  await t.test("profiles persist and reject privilege escalation", async () => {
    assert.equal((await request("/profile", "PUT", { goal: "Win board support", language: "French", challenge: "I rush" })).status, 200);
    assert.equal((await request("/profile", "PUT", { goal: "Test", availableForReviews: true })).status, 400);
    const dashboard = await request(); assert.equal(dashboard.data.canEvaluate, true); assert.equal(dashboard.data.profile.language, "French");
  });
  await t.test("saves a personalized assessment and charges exactly once", async () => {
    const result = await request("/sessions", "POST", input);
    assert.equal(result.data?.type, "done"); sessionId = result.data.session._id;
    assert.equal(result.data.credits, 18);
    assert.equal(result.data.session.nextFocus, "Name a concrete next step.");
    assert.match(result.data.session.exercise, /3\. Repeat/);
    assert.equal(result.data.session.audioFile, undefined);
    assert.equal(JSON.parse(prompts[0].prompt).learnerProfile.language, "French");
    assert.equal((await request(`/sessions/${sessionId}`, "GET", null, 1)).status, 404);
    assert.equal((await request(`/sessions/${sessionId}`, "PATCH", { helpful: true }, 1)).status, 404);
  });
  await t.test("comparison must belong to this learner and scenario", async () => {
    assert.equal((await request("/sessions", "POST", { ...input, previous: sessionId }, 1)).status, 400);
    assert.equal((await request("/sessions", "POST", { ...input, scenario: "interview", previous: sessionId })).status, 400);
    const retry = await request("/sessions", "POST", { ...input, previous: sessionId });
    assert.equal(retry.data.session.previous, sessionId);
    assert.equal((await request()).data.stats.retries, 1);
  });
  await t.test("provider failure returns credits and keeps a failed attempt", async () => {
    const before = (await request()).data.credits;
    providerFailure = true;
    const result = await request("/sessions", "POST", input);
    providerFailure = false;
    assert.equal(result.events.at(-1).type, "error");
    assert.equal((await request()).data.credits, before);
    assert.equal(await Session.countDocuments({ user: users[0]._id, status: "FAILED" }), 1);
  });
  await t.test("only one included AI follow-up can be consumed", async () => {
    const results = await Promise.all([request(`/sessions/${sessionId}/followup`, "POST", { question: "How do I close?" }), request(`/sessions/${sessionId}/followup`, "POST", { question: "How do I close?" })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  });
  await t.test("human reviews enforce expert role and explicit assignment", async () => {
    assert.equal((await request("/availability", "PUT", { availableForReviews: true, responseHours: 24 })).status, 403);
    assert.equal((await request("/availability", "PUT", { availableForReviews: true, responseHours: 24 }, 2)).status, 200);
    assert.equal((await request("/coaches")).data.coaches.length, 1);
    assert.equal((await request(`/sessions/${sessionId}`, "GET", null, 2)).status, 404);
    assert.equal((await request(`/sessions/${sessionId}/review-request`, "POST", { coach: String(users[2]._id), note: "Check my close" })).status, 200);
    assert.equal((await request(`/sessions/${sessionId}`, "GET", null, 2)).status, 200);
    assert.equal((await request("/inbox", "GET", null, 2)).data.sessions.length, 1);
    const review = { feedback: "Your message is clear; close with a decision request.", focus: "Ask for a decision", exercise: "Name the decision, pause, repeat." };
    assert.equal((await request(`/sessions/${sessionId}/review`, "POST", review, 1)).status, 403);
    assert.equal((await request(`/sessions/${sessionId}/review`, "POST", review, 2)).status, 200);
    assert.equal((await request(`/sessions/${sessionId}/review`, "POST", review, 2)).status, 409);
    assert.equal((await request(`/sessions/${sessionId}/review-question`, "POST", { question: "How specific should my request be?" })).status, 200);
    assert.equal((await request(`/sessions/${sessionId}/review-answer`, "POST", { answer: "Name the action, owner and date." }, 2)).status, 200);
    assert.equal((await request(`/sessions/${sessionId}`)).data.session.review.answer, "Name the action, owner and date.");
  });
  await t.test("concurrent evaluations cannot overspend credits", async () => {
    await License.updateOne({ user: users[1]._id }, { credits: 2 });
    const results = await Promise.all([request("/sessions", "POST", input, 1), request("/sessions", "POST", input, 1)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 403]);
    assert.equal((await request("", "GET", null, 1)).data.credits, 0);
  });
  await t.test("90-second learning audio is validated, private, and playable by the assigned coach only", async () => {
    const bytes = Buffer.alloc(44 + 90 * 24000);
    bytes.write("RIFF"); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVE", 8); bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(12000, 24); bytes.writeUInt32LE(24000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write("data", 36); bytes.writeUInt32LE(bytes.length - 44, 40);
    const form = new FormData();
    form.append("audio", new Blob([bytes], { type: "audio/wav" }), "synthetic.wav");
    form.append("title", "Learning audio"); form.append("scenario", "leadership-change"); form.append("source", "learning"); form.append("duration", "1");
    const response = await fetch(base + "/sessions", { method: "POST", headers: { Authorization: `Bearer ${tokens[0]}` }, body: form });
    const events = (await response.text()).split("\n\n").filter(Boolean).map(s => JSON.parse(s.slice(6)));
    const session = events.find(e => e.type === "done").session;
    assert.equal(session.duration, 90);
    assert.equal(session.audioFile, undefined);
    assert.equal((await request(`/sessions/${session._id}/audio`, "GET", null, 1)).status, 404);
    assert.equal((await request(`/sessions/${session._id}/audio`, "GET", null, 2)).status, 404);
    await request(`/sessions/${session._id}/review-request`, "POST", { coach: String(users[2]._id) });
    const audioResponse = await fetch(`${base}/sessions/${session._id}/audio`, { headers: { Authorization: `Bearer ${tokens[2]}`, Range: "bytes=0-99" } });
    assert.equal(audioResponse.status, 206); assert.equal((await audioResponse.arrayBuffer()).byteLength, 100);
    assert.equal((await request(`/sessions/${session._id}/review`, "POST", { feedback: "Please try speaking into your microphone.", focus: "Check the microphone", exercise: "Record a short phrase.", moments: [{ seconds: 94, note: "Outside recording" }] }, 2)).status, 400);
    await request(`/sessions/${session._id}`, "DELETE");
    assert.equal((await request(`/sessions/${session._id}/audio`, "GET", null, 2)).status, 404);
  });
  await t.test("expired licenses do not grant AI access", async () => {
    await License.updateOne({ user: users[1]._id }, { credits: 10, expiryDate: "2001-01-01T00:00:00.000Z" });
    assert.equal((await request("", "GET", null, 1)).data.canEvaluate, false);
    assert.equal((await request("/sessions", "POST", input, 1)).status, 403);
  });
  await t.test("deleting an attempt also removes coach access", async () => {
    assert.equal((await request(`/sessions/${sessionId}`, "DELETE")).status, 200);
    assert.equal((await request(`/sessions/${sessionId}`, "GET", null, 2)).status, 404);
    assert.equal((await request("/inbox", "GET", null, 2)).data.sessions.length, 0);
  });
  assert.equal(await Profile.countDocuments({ user: users[0]._id }), 1);
});
