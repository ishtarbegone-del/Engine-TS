"""Bake 2004 firemaking synths + advance firemarking2.mid to 22050 stereo 16-bit WAV."""
from pathlib import Path

from BakeFishingAudio import render_midi, render_synth, write_stereo16, write_wav

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "vr-client" / "assets" / "rs" / "audio"
JINGLE = ROOT / "content" / "jingles" / "advance firemarking2.mid"
FIRE_LIT = ROOT / "content" / "synth" / "skills" / "firemaking" / "fire_lit.synth"
STRIKE = ROOT / "content" / "synth" / "skills" / "firemaking" / "tinderbox_strike.synth"


def main() -> None:
    if not JINGLE.is_file():
        raise SystemExit(f"missing {JINGLE}")
    if not FIRE_LIT.is_file():
        raise SystemExit(f"missing {FIRE_LIT}")
    if not STRIKE.is_file():
        raise SystemExit(f"missing {STRIKE}")
    write_wav(OUT_DIR / "advance_firemaking2.wav", render_midi(JINGLE))
    write_stereo16(OUT_DIR / "fire_lit.wav", render_synth(FIRE_LIT))
    write_stereo16(OUT_DIR / "tinderbox_strike.wav", render_synth(STRIKE))


if __name__ == "__main__":
    main()
