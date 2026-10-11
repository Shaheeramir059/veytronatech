# Reproduce the offline receptionist recordings

Verified locally on Windows, Python 3.11.9, CPU ONNX Runtime 1.30.0, FFmpeg 9.0.1. The RTX 5060 is not used. These tools are never needed by the deployed website.

```powershell
python -m venv .voice-venv
.\.voice-venv\Scripts\python.exe -m pip install -r scripts/voice/requirements.txt
# Install an approved FFmpeg build separately if ffmpeg is not on PATH.
.\.voice-venv\Scripts\python.exe scripts/voice/download.py
.\.voice-venv\Scripts\python.exe scripts/voice/generate.py
npm test
```

Edit **src/lib/receptionist-dialogue.json** for source text; retain stable IDs and update the conversation mapping in `demo-motion.ts` when adding branches. Do not edit the generated manifest by hand. The current 28 utterances cover five scenarios, all five offered guest counts and three times, large parties, unavailable requests and handoff; other guest counts use a generic summary. One model preset (`af_heart`), US English, speed 0.95, mono 24 kHz, 64 kbps MP3.

`download.py` fetches only the official versioned release URLs and verifies the committed SHA-256 lock. The first download established that lock from the upstream release; hashes do not replace upstream publisher authentication. Model and voice files occupy 353,719,767 bytes in `.voice-cache/models`. The original model-card PyTorch checksum is deliberately not used for the distinct ONNX conversion.

`generate.py` verifies the lock, loads CPU inference with four threads, trims excessive edge silence with guarded padding/fades, runs two-pass FFmpeg loudness normalization, decodes every final MP3, checks loudness/peak/duration and publishes a manifest only after all utterances pass. It records generation time and sampled peak process RSS in `performance/phase6-generation.json`. RAM sampling is at 50 ms and excludes separate FFmpeg process memory. There are no GPU inference allocations. Raw WAVs stay in `.voice-cache/generated`.

Encoded-content hashes name the public files, so byte changes always get new cache URLs even if text is unchanged. CPU inference can vary slightly across runs/tool versions; reproducible tooling does not promise bit-identical synthesis. The generator removes obsolete generated files **only after** publishing a complete manifest. Export locally, listen, rebuild, and deploy a complete release atomically only after separate owner authorization. Preserve old assets in a release archive/CDN when updating a live version: a visitor with an older open demo may still request them.

For new export settings, increment `VERSION` in generate.py. Review the actual loudness and pronunciation, never just the generated evidence. `models.lock.json`, dependency pins and [LICENSES.md](LICENSES.md) document provenance. The full Apache/MIT license copies are alongside this guide. The venv/model cache are ignored and must not be shipped.

The app loads only the manifest when VoiceDemo mounts. Audio starts after explicit Play; at most the current and immediately next receptionist recordings are prepared. Browser media caching handles playback/replay. No service worker, storage, microphone, telephony or cloud inference is added.
