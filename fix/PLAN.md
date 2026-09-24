# Audio Recording Fix Plans

## Overview
This document outlines the two core plans to fix the audio recording and ingestion issues across the frontend and backend.

---

## Plan A: Frontend Direct PCM Capture (Web Audio API)

### Problem
- `MediaRecorder` compresses audio into container formats like `audio/webm;codecs=opus` or `audio/mp4`.
- Streaming WebM files lack complete duration/seek cues, which causes `AudioContext.decodeAudioData()` in `UploadZone.tsx` to fail with `DOMException: Unable to decode audio data`.
- This causes the user-facing error `"Failed to prepare audio. Please try recording again."`.

### Solution
- Capture raw PCM audio directly from the microphone using the Web Audio API (`AudioContext` + `createMediaStreamSource` + `AudioWorklet` / `ScriptProcessorNode`).
- Collect raw mono `Float32Array` audio frames in memory during recording.
- On `stopRecording()`, encode the accumulated PCM samples directly into a standard 16-bit PCM WAV `Blob`.
- Provide the generated WAV blob directly as `recordedBlob` and `recordedUrl`.
- In `UploadZone.tsx`, remove the failing `decodeAudioData` step since the output is already a valid WAV file.

### Verification
- Check microphone recording start/stop.
- Verify live visualizer updates smoothly without audio feedback.
- Confirm preview playback in the `<audio>` element works with valid duration.
- Confirm "Use Audio" produces a valid `.wav` file ready for upload.

---

## Plan B: Backend Audio Ingestion & Python 3.13 Fix

### Problem
- On Python 3.13, `audioop` was removed from the standard library, causing `pydub` to crash with `ModuleNotFoundError: No module named 'audioop'`.
- `libsndfile` (`soundfile.read()`) cannot decode WebM/Opus or AAC directly.
- An empty stub `backend/audioop.py` was created, but it lacks the C functions `pydub` needs.

### Solution
1. Install `audioop-lts` in the backend virtual environment:
   ```bash
   pip install audioop-lts
   ```
2. Remove or replace the empty stub `backend/audioop.py` so Python imports `audioop-lts` properly.
3. Update `backend/api/audio_utils.py` to include robust direct FFmpeg conversion fallback:
   - If `sf.read()` fails, call FFmpeg directly via `subprocess` or `pydub` (now functional with `audioop-lts`) to convert any format into standard PCM 16-bit WAV.
   - Return clean numpy float array and sample rate.

### Verification
- Verify `import pydub` succeeds without error on Python 3.13.
- Test reading WAV and arbitrary audio formats through `read_audio_file()`.
- Ensure tests in `backend/tests/` pass.
