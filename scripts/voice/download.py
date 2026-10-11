"""Download the official Kokoro ONNX v1.0 release, never into public/."""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".voice-cache/models"
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/"
FILES = ("kokoro-v1.0.onnx", "voices-v1.0.bin")
LICENSES = {
    "LICENSE-Apache-2.0.txt": "https://www.apache.org/licenses/LICENSE-2.0.txt",
    "LICENSE-kokoro-onnx-MIT.txt": "https://raw.githubusercontent.com/thewh1teagle/kokoro-onnx/main/LICENSE",
}

def digest(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    lock_path = ROOT / "scripts/voice/models.lock.json"
    lock = json.loads(lock_path.read_text()) if lock_path.exists() else {}
    for name in FILES:
        target = CACHE / name
        expected = lock.get(name, {}).get("sha256")
        if not target.exists() or (expected and digest(target) != expected):
            temp = target.with_suffix(target.suffix + ".part")
            print(f"Downloading {name}", flush=True)
            urllib.request.urlretrieve(BASE + name, temp)
            actual = digest(temp)
            if expected and actual != expected:
                temp.unlink()
                raise RuntimeError(f"Checksum mismatch for {name}")
            temp.replace(target)
        lock[name] = {"url": BASE + name, "sha256": digest(target), "bytes": target.stat().st_size}
        print(f"Verified {name}: {lock[name]['bytes']} bytes", flush=True)
    # First download records provenance; subsequent downloads require this digest.
    lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
    for filename, url in LICENSES.items():
        path = ROOT / "scripts/voice" / filename
        if not path.exists():
            with urllib.request.urlopen(url, timeout=30) as response:
                path.write_bytes(response.read())
            print(f"Saved upstream license: {filename}", flush=True)

if __name__ == "__main__":
    main()
