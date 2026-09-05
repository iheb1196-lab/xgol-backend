const multer = require("multer");
const path = require("path");

// Kept for local-development storage and compatibility with older recordings.
const audioDir = path.join(__dirname, "..", "uploads", "audio");

const extensionByMime = {
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
};

const upload = multer({
  // Keep the small WAV in memory so the request can send it to the AI provider
  // and persist it to Vercel Blob without writing to Vercel's read-only disk.
  storage: multer.memoryStorage(),
  // Gemma 4 E2B has a 3.5 MB total JSON request limit. A 2.3 MiB WAV
  // becomes about 3.2 MB after base64 encoding, leaving room for prompts.
  limits: { fileSize: Math.floor(2.3 * 1024 * 1024) },
  fileFilter: (_req, file, cb) => {
    if (!extensionByMime[file.mimetype]) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "audio"));
    }
    return cb(null, true);
  },
});

const uploadAudio = (req, res, next) => {
  upload.single("audio")(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "The audio recording must be smaller than 2.3 MB"
        : "Please upload a WAV audio recording";
    return res.status(400).json({ status: "Failed", message });
  });
};

module.exports = { uploadAudio, audioDir };
