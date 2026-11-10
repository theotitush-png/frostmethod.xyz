# Frostmethod.xyz starter

A blue/icy video-enhancement website with a working upload and FFmpeg processing flow.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm start
```

Open http://localhost:3000.

## What processing does

The server uses FFmpeg to apply light denoising, sharpening, and a subtle contrast/saturation adjustment, then exports MP4 (H.264 + AAC). This is real video processing, but it is **not AI super-resolution** and cannot recreate details missing from the original video.

## Before deploying publicly

This is a starter, not a production-ready public service. Add:
- User authentication and per-user job ownership.
- Persistent job storage/queue and worker processes.
- Automatic deletion/retention policy for source and output files.
- Rate limits, storage quotas, malware/content scanning, and abuse controls.
- HTTPS, secure hosting, monitoring, backups, and privacy/terms pages.
- A reverse proxy / upload timeout suitable for large files.

Uploads are stored on the server in `data/`. The sample allows one video up to 500 MB and accepts MP4, MOV, M4V, WebM, and MKV file extensions. For production, also validate actual media content with FFprobe and isolate processing workers.
