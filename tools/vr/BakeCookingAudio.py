"""Bake 2004 cooking synths + advance cooking2.mid to 22050 stereo 16-bit WAV."""
from pathlib import Path

from BakeFishingAudio import render_midi, render_synth, write_stereo16, write_wav

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "vr-client" / "assets" / "rs" / "audio"
JINGLE = ROOT / "content" / "jingles" / "advance cooking2.mid"
FRY = ROOT / "content" / "synth" / "skills" / "cooking" / "fry.synth"
SIZZLE = ROOT / "content" / "synth" / "skills" / "cooking" / "sizzle.synth"


def main() -> None:
    if not JINGLE.is_file():
        raise SystemExit(f"missing {JINGLE}")
    if not FRY.is_file():
        raise SystemExit(f"missing {FRY}")
    if not SIZZLE.is_file():
        raise SystemExit(f"missing {SIZZLE}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_wav(OUT_DIR / "advance_cooking2.wav", render_midi(JINGLE))
    write_stereo16(OUT_DIR / "fry.wav", render_synth(FRY))
    write_stereo16(OUT_DIR / "sizzle.wav", render_synth(SIZZLE))


if __name__ == "__main__":
    main()
