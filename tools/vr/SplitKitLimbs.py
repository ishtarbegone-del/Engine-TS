#!/usr/bin/env python3
"""Split kit arm/hand GLBs into left/right halves, centered on the hand."""

from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MODELS = ROOT / "vr-client" / "assets" / "rs" / "models"
OUT = ROOT / "vr-client" / "assets" / "rs" / "kit"

GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def _pad4(n: int) -> int:
    return (4 - (n % 4)) % 4


def read_glb(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    magic, _ver, _length = struct.unpack_from("<III", data, 0)
    if magic != GLB_MAGIC:
        raise ValueError(f"not a glb: {path}")
    json_len, json_type = struct.unpack_from("<II", data, 12)
    if json_type != JSON_CHUNK:
        raise ValueError("missing JSON chunk")
    js = data[20 : 20 + json_len].decode("utf-8").replace("\x00", "").strip()
    parsed = json.loads(js)
    bin_start = 20 + json_len + 8
    return parsed, data, bin_start


def view_bytes(data: bytes, views: list, acc: dict, bin_start: int) -> bytes:
    view = views[int(acc.get("bufferView", 0))]
    off = bin_start + int(view.get("byteOffset", 0)) + int(acc.get("byteOffset", 0))
    count = int(acc["count"])
    ctype = int(acc["componentType"])
    typ = acc["type"]
    comps = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[typ]
    width = {5121: 1, 5123: 2, 5125: 4, 5126: 4}[ctype]
    nbytes = count * comps * width
    return data[off : off + nbytes]


def unpack_vec3(blob: bytes) -> list[tuple[float, float, float]]:
    n = len(blob) // 12
    out = []
    for i in range(n):
        out.append(struct.unpack_from("<fff", blob, i * 12))
    return out


def unpack_u32(blob: bytes) -> list[int]:
    n = len(blob) // 4
    return list(struct.unpack_from("<%sI" % n, blob, 0))


def load_mesh(path: Path) -> tuple[list, list, list]:
    parsed, data, bin_start = read_glb(path)
    accs = parsed["accessors"]
    views = parsed["bufferViews"]
    prim = parsed["meshes"][0]["primitives"][0]
    attrs = prim["attributes"]
    pos = unpack_vec3(view_bytes(data, views, accs[int(attrs["POSITION"])], bin_start))
    col = unpack_vec3(view_bytes(data, views, accs[int(attrs["COLOR_0"])], bin_start))
    idx = unpack_u32(view_bytes(data, views, accs[int(prim["indices"])], bin_start))
    return pos, col, idx


def split_side(
    pos: list, col: list, idx: list, keep_positive: bool
) -> tuple[list, list, list]:
    out_p: list = []
    out_c: list = []
    out_i: list = []
    i = 0
    while i + 2 < len(idx):
        a, b, c = idx[i], idx[i + 1], idx[i + 2]
        i += 3
        if a < 0 or b < 0 or c < 0 or a >= len(pos) or b >= len(pos) or c >= len(pos):
            continue
        mid = (pos[a][0] + pos[b][0] + pos[c][0]) / 3.0
        if (mid >= 0.0) != keep_positive:
            continue
        base = len(out_p)
        for vi in (a, b, c):
            out_p.append(pos[vi])
            out_c.append(col[vi] if vi < len(col) else (1.0, 1.0, 1.0))
        out_i.extend((base, base + 1, base + 2))
    return out_p, out_c, out_i


def aabb_center(pos: list) -> tuple[float, float, float]:
    xs = [p[0] for p in pos]
    ys = [p[1] for p in pos]
    zs = [p[2] for p in pos]
    return (
        (min(xs) + max(xs)) * 0.5,
        (min(ys) + max(ys)) * 0.5,
        (min(zs) + max(zs)) * 0.5,
    )


def shift(pos: list, origin: tuple[float, float, float]) -> list:
    ox, oy, oz = origin
    return [(p[0] - ox, p[1] - oy, p[2] - oz) for p in pos]


def write_glb(path: Path, name: str, pos: list, col: list, idx: list) -> None:
    n = len(pos)
    pos_b = b"".join(struct.pack("<fff", *p) for p in pos)
    col_b = b"".join(struct.pack("<fff", *c) for c in col)
    idx_b = struct.pack("<%sI" % len(idx), *idx)
    bin_blob = pos_b + col_b + idx_b
    xs = [p[0] for p in pos]
    ys = [p[1] for p in pos]
    zs = [p[2] for p in pos]
    doc = {
        "asset": {"version": "2.0", "generator": "lostcity-vr-kit-split"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [
            {
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "COLOR_0": 1},
                        "indices": 2,
                        "mode": 4,
                    }
                ]
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": n,
                "type": "VEC3",
                "min": [min(xs), min(ys), min(zs)],
                "max": [max(xs), max(ys), max(zs)],
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": n,
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5125,
                "count": len(idx),
                "type": "SCALAR",
            },
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(pos_b), "target": 34962},
            {
                "buffer": 0,
                "byteOffset": len(pos_b),
                "byteLength": len(col_b),
                "target": 34962,
            },
            {
                "buffer": 0,
                "byteOffset": len(pos_b) + len(col_b),
                "byteLength": len(idx_b),
                "target": 34963,
            },
        ],
        "buffers": [{"byteLength": len(bin_blob)}],
    }
    json_bytes = json.dumps(doc, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * _pad4(len(json_bytes))
    bin_blob += b"\x00" * _pad4(len(bin_blob))
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    header = struct.pack("<III", GLB_MAGIC, 2, total)
    jhdr = struct.pack("<II", len(json_bytes), JSON_CHUNK)
    bhdr = struct.pack("<II", len(bin_blob), BIN_CHUNK)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + jhdr + json_bytes + bhdr + bin_blob)
    print(f"wrote {path} verts={n} tris={len(idx) // 3}")


def main() -> None:
    arm_pos, arm_col, arm_idx = load_mesh(MODELS / "162.glb")
    hand_pos, hand_col, hand_idx = load_mesh(MODELS / "176.glb")
    plate_pos, plate_col, plate_idx = load_mesh(MODELS / "164.glb")
    for keep_positive, suffix in ((False, "L"), (True, "R")):
        hp, hc, hi = split_side(hand_pos, hand_col, hand_idx, keep_positive)
        ap, ac, ai = split_side(arm_pos, arm_col, arm_idx, keep_positive)
        pp, pc, pi = split_side(plate_pos, plate_col, plate_idx, keep_positive)
        if not hp:
            raise SystemExit(f"no hand triangles for {suffix}")
        origin = aabb_center(hp)
        hp = shift(hp, origin)
        ap = shift(ap, origin)
        write_glb(OUT / f"176_{suffix}.glb", f"kit_176_{suffix}", hp, hc, hi)
        write_glb(OUT / f"162_{suffix}.glb", f"kit_162_{suffix}", ap, ac, ai)
        if not pp:
            raise SystemExit(f"no plate-arm triangles for {suffix}")
        pp = shift(pp, origin)
        write_glb(OUT / f"164_{suffix}.glb", f"kit_164_{suffix}", pp, pc, pi)


if __name__ == "__main__":
    main()
