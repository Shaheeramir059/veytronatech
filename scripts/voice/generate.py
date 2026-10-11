"""Offline CPU speech export. Run download.py first. No web service or voice cloning."""
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import threading
import time

import numpy as np
import onnxruntime as ort
import psutil
import soundfile as sf
from kokoro_onnx import Kokoro
from download import ROOT, CACHE, digest

VERSION = "v1"
VOICE = "af_heart"
SPEED = 0.95
PUBLIC = ROOT / "public/audio/receptionist"
WORK = ROOT / ".voice-cache/generated"

def command(args):
    return subprocess.run(args, check=True, capture_output=True, text=True)

def loudness(path, extra=()):
    result = command(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
        "loudnorm=I=-18:TP=-1.5:LRA=7:print_format=json" + "".join(extra), "-f", "null", "-"])
    return json.loads(result.stderr[result.stderr.rfind("{") : result.stderr.rfind("}") + 1])

def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    lock = json.loads((ROOT / "scripts/voice/models.lock.json").read_text())
    for name, entry in lock.items():
        if digest(CACHE / name) != entry["sha256"]:
            raise RuntimeError(f"Model checksum mismatch: {name}")
    dialogue = json.loads((ROOT / "src/lib/receptionist-dialogue.json").read_text())
    peak = [0]
    done = threading.Event()
    process = psutil.Process()
    def sample():
        while not done.wait(.05):
            peak[0] = max(peak[0], process.memory_info().rss)
    thread = threading.Thread(target=sample, daemon=True)
    thread.start()
    started = time.perf_counter()
    options = ort.SessionOptions()
    options.intra_op_num_threads = min(4, os.cpu_count() or 1)
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(CACHE / "kokoro-v1.0.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
    model = Kokoro.from_session(session, str(CACHE / "voices-v1.0.bin"))
    if VOICE not in model.get_voices():
        raise RuntimeError("Preset voice missing")
    load_seconds = time.perf_counter() - started
    entries, evidence = {}, []
    for id, source in dialogue.items():
        begin = time.perf_counter()
        identity = json.dumps({"text":source["text"], "voice":VOICE, "speed":SPEED, "version":VERSION, "model":lock}, sort_keys=True)
        suffix = hashlib.sha256(identity.encode()).hexdigest()[:12]
        name = f"{VERSION}-{id}-{suffix}.mp3"
        wav, mp3 = WORK / f"{id}.wav", PUBLIC / name
        samples, rate = model.create(source["text"], voice=VOICE, speed=SPEED, lang="en-us")
        if not np.isfinite(samples).all() or np.max(np.abs(samples)) < .01:
            raise RuntimeError(f"Invalid synthesis: {id}")
        audible = np.flatnonzero(np.abs(samples) > .001)
        samples = samples[max(0, int(audible[0]) - int(.1*rate)): min(len(samples), int(audible[-1]) + int(.18*rate))]
        # Tiny edge fades and guarded silence preserve consonants and natural endings.
        fade = min(int(.005*rate), len(samples)//2)
        samples[:fade] *= np.linspace(0, 1, fade)
        samples[-fade:] *= np.linspace(1, 0, fade)
        samples = np.pad(samples, (int(.04*rate), int(.06*rate)))
        sf.write(wav, samples, rate, subtype="FLOAT")
        measured = loudness(wav)
        normalization = "loudnorm=I=-18:TP=-1.5:LRA=7:linear=true:" + ":".join([
            f"measured_I={measured['input_i']}", f"measured_TP={measured['input_tp']}",
            f"measured_LRA={measured['input_lra']}", f"measured_thresh={measured['input_thresh']}", f"offset={measured['target_offset']}"])
        temp = WORK / name
        command(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav), "-af", normalization,
            "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", str(temp)])
        decoded = WORK / "verify.wav"
        command(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(temp), str(decoded)])
        audio, sample_rate = sf.read(decoded)
        duration = len(audio)/sample_rate
        peak_db = float(20*np.log10(max(np.max(np.abs(audio)), 1e-12)))
        normalized = loudness(temp)
        lufs = float(normalized["input_i"])
        if not 1 < duration < 45 or not -19.5 <= lufs <= -16.5 or peak_db > -.7:
            raise RuntimeError(f"Audio validation failed: {id}: {duration=}, {lufs=}, {peak_db=}")
        # Cache identity is the final encoded content, not merely its text.
        mp3 = PUBLIC / f"{VERSION}-{id}-{digest(temp)[:12]}.mp3"
        temp.replace(mp3)
        entries[id] = {"id":id, **source, "path":f"/audio/receptionist/{mp3.name}", "duration":round(duration, 3),
            "version":VERSION, "bytes":mp3.stat().st_size, "sha256":digest(mp3)}
        evidence.append({"id":id, "generationAndExportSeconds":round(time.perf_counter()-begin, 3), "lufs":lufs,
            "samplePeakDbFS":round(peak_db, 3), "truePeakDbTP":float(normalized["input_tp"]), "sampleRate":sample_rate, "codec":"mp3", "channels":1})
        print(f"Verified {id}: {duration:.2f}s, {lufs} LUFS, {mp3.stat().st_size} bytes", flush=True)
    done.set()
    thread.join()
    manifest = {"version":VERSION, "voice":VOICE, "model":"Kokoro-82M v1.0 ONNX", "entries":entries}
    # Publish only after every source utterance has a verified recording.
    temp_manifest = PUBLIC / "manifest.json.part"
    temp_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    temp_manifest.replace(PUBLIC / "manifest.json")
    keep = {Path(entry["path"]).name for entry in entries.values()}
    if PUBLIC.resolve() != (ROOT / "public/audio/receptionist").resolve():
        raise RuntimeError("Unexpected asset directory")
    for old in PUBLIC.iterdir():
        if old.is_file() and re.fullmatch(r"v\d+-[a-z0-9-]+-[a-f0-9]{12}\.mp3", old.name) and old.name not in keep:
            old.unlink()
    report = {"provider":session.get_providers(), "threads":options.intra_op_num_threads, "voice":VOICE, "speed":SPEED,
        "modelLoadSeconds":round(load_seconds, 3), "totalSeconds":round(time.perf_counter()-started, 3),
        "peakProcessRSSBytes":peak[0], "gpuInference":False, "count":len(entries), "totalAudioBytes":sum(e["bytes"] for e in entries.values()),
        "modelFiles":lock, "assets":evidence, "listeningVerified":False}
    (ROOT / "performance/phase6-generation.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({key:value for key,value in report.items() if key not in ("modelFiles","assets")}, indent=2))

if __name__ == "__main__":
    main()
