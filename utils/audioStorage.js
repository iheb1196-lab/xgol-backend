const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");
const { put, get, del } = require("@vercel/blob");
const { audioDir } = require("../middleware/uploadAudio");

const isBlobReference = (reference) =>
  typeof reference === "string" &&
  /^https:\/\/[^/]+\.(?:private|public)\.blob\.vercel-storage\.com\//i.test(
    reference
  );

const hasBlobCredentials = () =>
  Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );

const shouldUseBlob = () => {
  if (process.env.VERCEL) return true;
  if (process.env.AUDIO_STORAGE === "local") return false;
  return process.env.AUDIO_STORAGE === "blob" || hasBlobCredentials();
};

const blobConfigurationError = () => {
  const error = new Error(
    "Audio storage is not configured. Connect a private Vercel Blob store to this project."
  );
  error.code = "AUDIO_STORAGE_NOT_CONFIGURED";
  error.status = 503;
  return error;
};

const notFoundError = () => {
  const error = new Error("Audio file not found");
  error.code = "AUDIO_NOT_FOUND";
  error.status = 404;
  return error;
};

const localPath = (reference) =>
  path.join(audioDir, path.basename(String(reference || "")));

const saveAudio = async ({ buffer, contentType = "audio/wav", userId }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("An audio buffer is required");
  }

  const filename = `${Date.now()}-${randomUUID()}.wav`;

  if (shouldUseBlob()) {
    if (!hasBlobCredentials()) throw blobConfigurationError();
    const pathname = `audio/${String(userId || "unknown")}/${filename}`;
    const blob = await put(pathname, buffer, {
      access: "private",
      addRandomSuffix: false,
      contentType,
    });
    return blob.url;
  }

  await fsPromises.mkdir(audioDir, { recursive: true });
  await fsPromises.writeFile(localPath(filename), buffer);
  return filename;
};

const copyHeader = (source, response, name) => {
  const value = source?.get?.(name);
  if (value) response.setHeader(name, value);
};

const streamLocalAudio = async (reference, request, response, contentType) => {
  const filePath = localPath(reference);
  let stats;
  try {
    stats = await fsPromises.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") throw notFoundError();
    throw error;
  }

  const range = request.headers.range;
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", contentType || "audio/wav");
  response.setHeader("Cache-Control", "private, no-store");

  if (!range) {
    response.status(200);
    response.setHeader("Content-Length", stats.size);
    await pipeline(fs.createReadStream(filePath), response);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    response.status(416).setHeader("Content-Range", `bytes */${stats.size}`);
    response.end();
    return;
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : stats.size - 1;
  if (start > end || start >= stats.size || end >= stats.size) {
    response.status(416).setHeader("Content-Range", `bytes */${stats.size}`);
    response.end();
    return;
  }

  response.status(206);
  response.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);
  response.setHeader("Content-Length", end - start + 1);
  await pipeline(fs.createReadStream(filePath, { start, end }), response);
};

const streamBlobAudio = async (reference, request, response, contentType) => {
  if (!hasBlobCredentials()) throw blobConfigurationError();

  const headers = request.headers.range
    ? { Range: request.headers.range }
    : undefined;
  const result = await get(reference, { access: "private", headers });

  if (!result || !result.stream || result.statusCode === 404) {
    throw notFoundError();
  }

  response.status(result.statusCode || 200);
  response.setHeader(
    "Content-Type",
    result.blob.contentType || contentType || "audio/wav"
  );
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  copyHeader(result.headers, response, "accept-ranges");
  copyHeader(result.headers, response, "content-length");
  copyHeader(result.headers, response, "content-range");
  copyHeader(result.headers, response, "etag");

  await pipeline(Readable.fromWeb(result.stream), response);
};

const streamAudio = async (reference, request, response, contentType) => {
  if (!reference) throw notFoundError();
  if (isBlobReference(reference)) {
    return streamBlobAudio(reference, request, response, contentType);
  }
  return streamLocalAudio(reference, request, response, contentType);
};

const deleteAudio = async (reference) => {
  if (!reference) return;
  if (isBlobReference(reference)) {
    if (!hasBlobCredentials()) throw blobConfigurationError();
    await del(reference);
    return;
  }
  await fsPromises.unlink(localPath(reference)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};

module.exports = {
  deleteAudio,
  isBlobReference,
  saveAudio,
  streamAudio,
};
