const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const {
  deleteAudio,
  saveAudio,
  streamAudio,
} = require("../utils/audioStorage");

test("local audio storage saves, serves byte ranges, and deletes recordings", async (t) => {
  const previousMode = process.env.AUDIO_STORAGE;
  process.env.AUDIO_STORAGE = "local";
  t.after(() => {
    if (previousMode === undefined) delete process.env.AUDIO_STORAGE;
    else process.env.AUDIO_STORAGE = previousMode;
  });

  const bytes = Buffer.from("0123456789");
  const reference = await saveAudio({
    buffer: bytes,
    contentType: "audio/wav",
    userId: "storage-test",
  });
  t.after(() => deleteAudio(reference));

  const app = express();
  app.get("/audio", async (req, res) => {
    try {
      await streamAudio(reference, req, res, "audio/wav");
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const url = `http://127.0.0.1:${server.address().port}/audio`;
  const response = await fetch(url, { headers: { Range: "bytes=2-5" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await response.text(), "2345");

  await deleteAudio(reference);
  const missing = await fetch(url);
  assert.equal(missing.status, 404);
});

test("Vercel audio uploads fail clearly until a Blob store is connected", async (t) => {
  const previous = {
    vercel: process.env.VERCEL,
    mode: process.env.AUDIO_STORAGE,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    oidc: process.env.VERCEL_OIDC_TOKEN,
    store: process.env.BLOB_STORE_ID,
  };
  process.env.VERCEL = "1";
  process.env.AUDIO_STORAGE = "local";
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.BLOB_STORE_ID;

  t.after(() => {
    const restore = (name, value) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    };
    restore("VERCEL", previous.vercel);
    restore("AUDIO_STORAGE", previous.mode);
    restore("BLOB_READ_WRITE_TOKEN", previous.token);
    restore("VERCEL_OIDC_TOKEN", previous.oidc);
    restore("BLOB_STORE_ID", previous.store);
  });

  await assert.rejects(
    saveAudio({ buffer: Buffer.from("wav"), userId: "storage-test" }),
    (error) => error.code === "AUDIO_STORAGE_NOT_CONFIGURED"
  );
});
