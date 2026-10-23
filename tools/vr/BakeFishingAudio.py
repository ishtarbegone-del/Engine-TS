"""Bake 2004 net.synth + advance fishing2.mid to 22050 stereo 16-bit WAV."""
from __future__ import annotations

import math
import random
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SYNTH = ROOT / "content" / "synth" / "skills" / "fishing" / "net.synth"
JINGLE = ROOT / "content" / "jingles" / "advance fishing2.mid"
OUT_DIR = ROOT / "vr-client" / "assets" / "rs" / "audio"
RATE = 22050


def i32(x: int) -> int:
    x = int(x) & 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def sar(x: int, n: int) -> int:
    return i32(i32(x) >> n)


class P:
    def __init__(self, data: bytes) -> None:
        self.d = data
        self.pos = 0

    def g1(self) -> int:
        v = self.d[self.pos]
        self.pos += 1
        return v

    def g2(self) -> int:
        v = (self.d[self.pos] << 8) | self.d[self.pos + 1]
        self.pos += 2
        return v

    def g4(self) -> int:
        v = struct.unpack_from(">i", self.d, self.pos)[0]
        self.pos += 4
        return v

    def peek(self) -> int:
        return self.d[self.pos]

    def gsmart(self) -> int:
        return self.g1() if self.peek() < 0x80 else self.g2() - 0x8000

    def gsmarts(self) -> int:
        return self.g1() - 0x40 if self.peek() < 0x80 else self.g2() - 0xC000


class Env:
    def __init__(self) -> None:
        self.length = 0
        self.shape_delta = []
        self.shape_peak = []
        self.start = 0
        self.end = 0
        self.form = 0
        self.threshold = 0
        self.position = 0
        self.delta = 0
        self.amplitude = 0
        self.ticks = 0

    def load(self, dat: P) -> None:
        self.form = dat.g1()
        self.start = dat.g4()
        self.end = dat.g4()
        self.length = dat.g1()
        self.shape_delta = []
        self.shape_peak = []
        for _ in range(self.length):
            self.shape_delta.append(dat.g2())
            self.shape_peak.append(dat.g2())

    def gen_init(self) -> None:
        self.threshold = 0
        self.position = 0
        self.delta = 0
        self.amplitude = 0
        self.ticks = 0

    def gen_next(self, delta: int) -> int:
        if self.ticks >= self.threshold and self.shape_peak:
            self.amplitude = self.shape_peak[self.position] << 15
            self.position += 1
            if self.position >= self.length:
                self.position = self.length - 1
            self.threshold = int((self.shape_delta[self.position] / 65536.0) * delta)
            if self.threshold > self.ticks:
                self.delta = ((self.shape_peak[self.position] << 15) - self.amplitude) // (self.threshold - self.ticks)
        self.amplitude += self.delta
        self.ticks += 1
        return sar(self.amplitude - self.delta, 15)


class Tone:
    noise = [1 if random.random() > 0.5 else -1 for _ in range(32768)]
    sine = [int(math.sin(i / 5215.1903) * 16384.0) for i in range(32768)]
    buf = [0] * (RATE * 10)
    f_pos = [0] * 5
    f_del = [0] * 5
    f_amp = [0] * 5
    f_multi = [0] * 5
    f_offset = [0] * 5

    def __init__(self) -> None:
        self.frequency_base = None
        self.amplitude_base = None
        self.frequency_mod_rate = None
        self.frequency_mod_range = None
        self.amplitude_mod_rate = None
        self.amplitude_mod_range = None
        self.release = None
        self.attack = None
        self.harmonic_volume = [0] * 10
        self.harmonic_semitone = [0] * 10
        self.harmonic_delay = [0] * 10
        self.reverb_delay = 0
        self.reverb_volume = 100
        self.length = 500
        self.start = 0

    def load(self, dat: P) -> None:
        self.frequency_base = Env()
        self.frequency_base.load(dat)
        self.amplitude_base = Env()
        self.amplitude_base.load(dat)
        if dat.g1() != 0:
            dat.pos -= 1
            self.frequency_mod_rate = Env()
            self.frequency_mod_rate.load(dat)
            self.frequency_mod_range = Env()
            self.frequency_mod_range.load(dat)
        if dat.g1() != 0:
            dat.pos -= 1
            self.amplitude_mod_rate = Env()
            self.amplitude_mod_rate.load(dat)
            self.amplitude_mod_range = Env()
            self.amplitude_mod_range.load(dat)
        if dat.g1() != 0:
            dat.pos -= 1
            self.release = Env()
            self.release.load(dat)
            self.attack = Env()
            self.attack.load(dat)
        for harmonic in range(10):
            volume = dat.gsmart()
            if volume == 0:
                break
            self.harmonic_volume[harmonic] = volume
            self.harmonic_semitone[harmonic] = dat.gsmarts()
            self.harmonic_delay[harmonic] = dat.gsmart()
        self.reverb_delay = dat.gsmart()
        self.reverb_volume = dat.gsmart()
        self.length = dat.g2()
        self.start = dat.g2()

    def wave_func(self, amplitude: int, phase: int, form: int) -> int:
        if form == 1:
            return amplitude if (phase & 0x7FFF) < 16384 else -amplitude
        if form == 2:
            return sar(self.sine[phase & 0x7FFF] * amplitude, 14)
        if form == 3:
            return sar((phase & 0x7FFF) * amplitude, 14) - amplitude
        if form == 4:
            return self.noise[((phase // 2607) & 0x7FFF)] * amplitude
        return 0

    def generate(self, sample_count: int, length: int) -> list[int]:
        for i in range(sample_count):
            self.buf[i] = 0
        if length < 10 or self.frequency_base is None or self.amplitude_base is None:
            return self.buf
        samples_per_step = sample_count // length
        self.frequency_base.gen_init()
        self.amplitude_base.gen_init()
        frequency_start = frequency_duration = frequency_phase = 0
        if self.frequency_mod_rate and self.frequency_mod_range:
            self.frequency_mod_rate.gen_init()
            self.frequency_mod_range.gen_init()
            frequency_start = int(((self.frequency_mod_rate.end - self.frequency_mod_rate.start) * 32.768) / samples_per_step)
            frequency_duration = int((self.frequency_mod_rate.start * 32.768) / samples_per_step)
        amplitude_start = amplitude_duration = amplitude_phase = 0
        if self.amplitude_mod_rate and self.amplitude_mod_range:
            self.amplitude_mod_rate.gen_init()
            self.amplitude_mod_range.gen_init()
            amplitude_start = int(((self.amplitude_mod_rate.end - self.amplitude_mod_rate.start) * 32.768) / samples_per_step)
            amplitude_duration = int((self.amplitude_mod_rate.start * 32.768) / samples_per_step)
        for harmonic in range(5):
            if self.harmonic_volume[harmonic] != 0:
                self.f_pos[harmonic] = 0
                self.f_del[harmonic] = self.harmonic_delay[harmonic] * samples_per_step
                self.f_amp[harmonic] = (self.harmonic_volume[harmonic] << 14) // 100
                self.f_multi[harmonic] = int(
                    ((self.frequency_base.end - self.frequency_base.start) * 32.768 * math.pow(1.0057929410678534, self.harmonic_semitone[harmonic]))
                    / samples_per_step
                )
                self.f_offset[harmonic] = int((self.frequency_base.start * 32.768) / samples_per_step)
        for sample in range(sample_count):
            frequency = self.frequency_base.gen_next(sample_count)
            amplitude = self.amplitude_base.gen_next(sample_count)
            if self.frequency_mod_rate and self.frequency_mod_range:
                rate = self.frequency_mod_rate.gen_next(sample_count)
                rng = self.frequency_mod_range.gen_next(sample_count)
                frequency += sar(self.wave_func(rng, frequency_phase, self.frequency_mod_rate.form), 1)
                frequency_phase += sar(rate * frequency_start, 16) + frequency_duration
            if self.amplitude_mod_rate and self.amplitude_mod_range:
                rate = self.amplitude_mod_rate.gen_next(sample_count)
                rng = self.amplitude_mod_range.gen_next(sample_count)
                amplitude = sar(amplitude * (sar(self.wave_func(rng, amplitude_phase, self.amplitude_mod_rate.form), 1) + 32768), 15)
                amplitude_phase += sar(rate * amplitude_start, 16) + amplitude_duration
            for harmonic in range(5):
                if self.harmonic_volume[harmonic] != 0:
                    position = sample + self.f_del[harmonic]
                    if position < sample_count:
                        self.buf[position] += self.wave_func(sar(amplitude * self.f_amp[harmonic], 15), self.f_pos[harmonic], self.frequency_base.form)
                        self.f_pos[harmonic] += sar(frequency * self.f_multi[harmonic], 16) + self.f_offset[harmonic]
        if self.release and self.attack:
            self.release.gen_init()
            self.attack.gen_init()
            counter = 0
            muted = True
            for sample in range(sample_count):
                release_value = self.release.gen_next(sample_count)
                attack_value = self.attack.gen_next(sample_count)
                if muted:
                    threshold = self.release.start + sar((self.release.end - self.release.start) * release_value, 8)
                else:
                    threshold = self.release.start + sar((self.release.end - self.release.start) * attack_value, 8)
                counter += 256
                if counter >= threshold:
                    counter = 0
                    muted = not muted
                if muted:
                    self.buf[sample] = 0
        if self.reverb_delay > 0 and self.reverb_volume > 0:
            start = self.reverb_delay * samples_per_step
            for sample in range(start, sample_count):
                self.buf[sample] += (self.buf[sample - start] * self.reverb_volume) // 100
        for sample in range(sample_count):
            if self.buf[sample] < -32768:
                self.buf[sample] = -32768
            elif self.buf[sample] > 32767:
                self.buf[sample] = 32767
        return self.buf


def load_synth(path: Path) -> tuple[list, int, int]:
    dat = P(path.read_bytes())
    tones = []
    for _ in range(10):
        if dat.pos >= len(dat.d):
            break
        if dat.g1() != 0:
            dat.pos -= 1
            tone = Tone()
            tone.load(dat)
            tones.append(tone)
        else:
            tones.append(None)
    loop_begin = dat.g2() if dat.pos + 2 <= len(dat.d) else 0
    loop_end = dat.g2() if dat.pos + 2 <= len(dat.d) else 0
    return tones, loop_begin, loop_end


def render_synth(path: Path) -> bytes:
    tones, _loop_begin, _loop_end = load_synth(path)
    duration = 0
    for tone in tones:
        if tone and tone.length + tone.start > duration:
            duration = tone.length + tone.start
    if duration == 0:
        raise SystemExit(f"empty synth {path}")
    sample_count = (duration * RATE) // 1000
    wave = [128] * sample_count
    for tone in tones:
        if tone is None:
            continue
        tone_samples = (tone.length * RATE) // 1000
        start = (tone.start * RATE) // 1000
        samples = tone.generate(tone_samples, tone.length)
        for i in range(tone_samples):
            idx = i + start
            if idx >= sample_count:
                break
            add = sar(samples[i], 8)
            wave[idx] = (wave[idx] + add) & 0xFF
    return bytes(wave)


def write_stereo16(path: Path, mono_u8: bytes) -> None:
    pcm = bytearray()
    for s in mono_u8:
        v = max(-32768, min(32767, (s - 128) * 256))
        pair = struct.pack("<hh", v, v)
        pcm.extend(pair)
    write_wav(path, pcm)


def write_wav(path: Path, pcm: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + len(pcm),
        b"WAVE",
        b"fmt ",
        16,
        1,
        2,
        RATE,
        RATE * 4,
        4,
        16,
        b"data",
        len(pcm),
    )
    path.write_bytes(header + pcm)
    print(f"wrote {path} bytes={path.stat().st_size}")


def u16(b: bytes, i: int) -> int:
    return (b[i] << 8) | b[i + 1]


def u32(b: bytes, i: int) -> int:
    return (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]


def vlq(b: bytes, i: int) -> tuple[int, int]:
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if c < 0x80:
            return v, i


def midi_notes(path: Path) -> list[tuple[int, int, int]]:
    data = path.read_bytes()
    assert data[0:4] == b"MThd"
    ntrks = u16(data, 10)
    div = u16(data, 12)
    i = 14
    events: list[tuple[int, int, int, int]] = []
    for _ in range(ntrks):
        assert data[i : i + 4] == b"MTrk"
        ln = u32(data, i + 4)
        i += 8
        end = i + ln
        tick = 0
        st = 0
        while i < end:
            d, i = vlq(data, i)
            tick += d
            b0 = data[i]
            i += 1
            if b0 < 0x80:
                i -= 1
                b0 = st
            if b0 == 0xFF:
                meta = data[i]
                i += 1
                ln2, i = vlq(data, i)
                i += ln2
                if meta == 0x2F:
                    break
                continue
            if b0 == 0xF0 or b0 == 0xF7:
                ln2, i = vlq(data, i)
                i += ln2
                continue
            st = b0
            kind = b0 & 0xF0
            if kind in (0x80, 0x90, 0xA0, 0xB0, 0xE0):
                a = data[i]
                b1 = data[i + 1]
                i += 2
                events.append((tick, kind, a, b1))
            elif kind in (0xC0, 0xD0):
                i += 1
            else:
                break
    tempo = 500000
    notes: list[tuple[int, int, int]] = []
    on: dict[int, int] = {}
    for tick, kind, a, b1 in events:
        ms = int(tick * tempo / (div * 1000))
        if kind == 0x90 and b1 > 0:
            on[a] = ms
        elif kind == 0x80 or (kind == 0x90 and b1 == 0):
            start = on.pop(a, None)
            if start is not None:
                notes.append((start, max(ms - start, 20), a))
    return notes


def render_midi(path: Path) -> bytes:
    notes = midi_notes(path)
    if not notes:
        raise SystemExit(f"no notes in {path}")
    end_ms = max(s + d for s, d, _n in notes) + 80
    n = int(end_ms * RATE / 1000)
    left = [0.0] * n
    for start_ms, dur_ms, note in notes:
        freq = 440.0 * (2.0 ** ((note - 69) / 12.0))
        a0 = int(start_ms * RATE / 1000)
        a1 = min(n, a0 + int(dur_ms * RATE / 1000))
        for i in range(a0, a1):
            t = (i - a0) / RATE
            env = 1.0
            remain = (a1 - i) / RATE
            if remain < 0.02:
                env = remain / 0.02
            left[i] += env * (1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0) * 0.18
    pcm = bytearray()
    for s in left:
        v = max(-32768, min(32767, int(s * 24000)))
        pcm.extend(struct.pack("<hh", v, v))
    return bytes(pcm)


def main() -> None:
    if not SYNTH.is_file():
        raise SystemExit(f"missing {SYNTH}")
    if not JINGLE.is_file():
        raise SystemExit(f"missing {JINGLE}")
    write_stereo16(OUT_DIR / "net.wav", render_synth(SYNTH))
    write_wav(OUT_DIR / "advance_fishing2.wav", render_midi(JINGLE))


if __name__ == "__main__":
    main()
