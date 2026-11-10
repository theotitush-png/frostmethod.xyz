const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data");
const UPLOADS = path.join(DATA, "uploads");
const OUTPUTS = path.join(DATA, "outputs");
for (const dir of [UPLOADS, OUTPUTS]) fs.mkdirSync(dir, { recursive: true });

app.use(express.static(path.join(__dirname, "public")));
app.use("/files", express.static(OUTPUTS));

const jobs = new Map();
const allowed = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(allowed.has(ext) ? null : new Error("Unsupported video format."), allowed.has(ext));
  }
});

app.post("/api/enhance", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a video first." });

  const id = crypto.randomUUID();
  const input = req.file.path;
  const outputName = `${id}.mp4`;
  const output = path.join(OUTPUTS, outputName);
  jobs.set(id, { status: "processing", progress: 0, output: null, error: null });

  const filter = "hqdn3d=1.5:1.5:6:6,unsharp=5:5:0.7:3:3:0.25,eq=contrast=1.04:saturation=1.03";
  const args = [
    "-y", "-i", input,
    "-vf", filter,
    "-c:v", "libx264", "-preset", "medium", "-crf", "19",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    output
  ];

  const child = spawn(ffmpegPath, args);
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk.toString(); });
  child.on("close", code => {
    fs.rm(input, { force: true }, () => {});
    if (code === 0) {
      jobs.set(id, { status: "done", progress: 100, output: `/files/${outputName}`, error: null });
    } else {
      jobs.set(id, { status: "error", progress: 0, output: null, error: "Video processing failed. Try another MP4, MOV, or WebM file." });
      fs.rm(output, { force: true }, () => {});
      console.error("FFmpeg error:", stderr.slice(-2000));
    }
  });
  child.on("error", err => {
    jobs.set(id, { status: "error", progress: 0, output: null, error: "Could not start the video processor. Check that FFmpeg is available." });
    console.error(err);
  });

  res.json({ id });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found." });
  res.json(job);
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Maximum upload size is 500 MB." });
  }
  res.status(400).json({ error: err.message || "Upload failed." });
});

app.listen(PORT, () => console.log(`Frostmethod running at http://localhost:${PORT}`));
