#!/usr/bin/env python3
"""Rewrite a Blender OBJ to the RS vertex-color glb layout WorldStreamer reads."""
from __future__ import annotations

import json
import math
import os
import struct
import sys

# Average 2004 model 2800 face colour (hslToRgb, skip near-black).
WOOD = (0.380, 0.200, 0.042, 1.0)
REF_LONGEST = 0.2734375


def parse_obj(path: str) -> tuple[list[tuple[float, float, float]], list[tuple[int, int, int]]]:
    verts: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("v "):
                parts = line.split()
                verts.append((float(parts[1]), float(parts[2]), float(parts[3])))
            elif line.startswith("f "):
                ids = []
                for tok in line.split()[1:]:
                    ids.append(int(tok.split("/")[0]) - 1)
                if len(ids) < 3:
                    continue
                for i in range(1, len(ids) - 1):
                    a, b, c = ids[0], ids[i], ids[i + 1]
                    if a == b or b == c or a == c:
                        continue
                    faces.append((a, b, c))
    return verts, faces


def aabb(pts: list[tuple[float, float, float]]) -> tuple[list[float], list[float]]:
    mn = [math.inf, math.inf, math.inf]
    mx = [-math.inf, -math.inf, -math.inf]
    for p in pts:
        for k in range(3):
            mn[k] = min(mn[k], p[k])
            mx[k] = max(mx[k], p[k])
    return mn, mx


def longest(mn: list[float], mx: list[float]) -> float:
    return max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])


def glb_aabb(path: str) -> tuple[list[float], list[float]] | None:
    data = open(path, "rb").read()
    if data[:4] != b"glTF":
        return None
    json_len = struct.unpack_from("<I", data, 12)[0]
    parsed = json.loads(data[20 : 20 + json_len].decode("utf-8").replace("\x00", "").strip())
    accessors = parsed.get("accessors", [])
    views = parsed.get("bufferViews", [])
    meshes = parsed.get("meshes", [])
    if not accessors or not views or not meshes:
        return None
    bin_start = 20 + json_len + 8
    mn = [math.inf, math.inf, math.inf]
    mx = [-math.inf, -math.inf, -math.inf]
    for prim in meshes[0].get("primitives", []):
        attrs = prim.get("attributes", {})
        if "POSITION" not in attrs:
            continue
        acc = accessors[int(attrs["POSITION"])]
        if "min" in acc and "max" in acc:
            for k in range(3):
                mn[k] = min(mn[k], float(acc["min"][k]))
                mx[k] = max(mx[k], float(acc["max"][k]))
            continue
        view = views[int(acc.get("bufferView", 0))]
        off = bin_start + int(view.get("byteOffset", 0)) + int(acc.get("byteOffset", 0))
        count = int(acc.get("count", 0))
        for i in range(count):
            x, y, z = struct.unpack_from("<fff", data, off + i * 12)
            mn[0] = min(mn[0], x)
            mn[1] = min(mn[1], y)
            mn[2] = min(mn[2], z)
            mx[0] = max(mx[0], x)
            mx[1] = max(mx[1], y)
            mx[2] = max(mx[2], z)
    if mn[0] == math.inf:
        return None
    return mn, mx


def pad4(n: int) -> int:
    return (4 - (n % 4)) % 4


def write_glb(out_path: str, verts: list[tuple[float, float, float]], faces: list[tuple[int, int, int]]) -> None:
    pos = []
    col = []
    idx = []
    for a, b, c in faces:
        base = len(pos) // 3
        for i in (a, b, c):
            x, y, z = verts[i]
            pos.extend((x, y, z))
            col.extend(WOOD)
        idx.extend((base, base + 1, base + 2))
    pos_b = struct.pack(f"<{len(pos)}f", *pos)
    col_b = struct.pack(f"<{len(col)}f", *col)
    idx_b = struct.pack(f"<{len(idx)}I", *idx)
    mn, mx = aabb([(pos[i], pos[i + 1], pos[i + 2]) for i in range(0, len(pos), 3)])

    parts: list[bytes] = []
    views: list[dict] = []
    bin_size = 0

    def add_view(raw: bytes, target: int) -> int:
        nonlocal bin_size
        views.append({"buffer": 0, "byteOffset": bin_size, "byteLength": len(raw), "target": target})
        parts.append(raw)
        bin_size += len(raw) + pad4(len(raw))
        return len(views) - 1

    accessors = []
    pos_view = add_view(pos_b, 34962)
    accessors.append(
        {
            "bufferView": pos_view,
            "componentType": 5126,
            "count": len(pos) // 3,
            "type": "VEC3",
            "min": mn,
            "max": mx,
        }
    )
    col_view = add_view(col_b, 34962)
    accessors.append({"bufferView": col_view, "componentType": 5126, "count": len(col) // 4, "type": "VEC4"})
    idx_view = add_view(idx_b, 34963)
    accessors.append({"bufferView": idx_view, "componentType": 5125, "count": len(idx), "type": "SCALAR"})
    prim = {"attributes": {"POSITION": 0, "COLOR_0": 1}, "indices": 2, "mode": 4}
    gltf = {
        "asset": {"version": "2.0", "generator": "lostcity-vr-obj-to-rs"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "model_2800"}],
        "meshes": [{"primitives": [prim]}],
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": bin_size}],
    }
    bin = bytearray(bin_size)
    cursor = 0
    for part in parts:
        bin[cursor : cursor + len(part)] = part
        cursor += len(part) + pad4(len(part))
    js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    jp = pad4(len(js))
    json_chunk = len(js) + jp
    bp = pad4(len(bin))
    bin_chunk = len(bin) + bp
    total = 12 + 8 + json_chunk + 8 + bin_chunk
    out = bytearray(total)
    struct.pack_into("<III", out, 0, 0x46546C67, 2, total)
    struct.pack_into("<II", out, 12, json_chunk, 0x4E4F534A)
    out[20 : 20 + len(js)] = js
    struct.pack_into("<II", out, 20 + json_chunk, bin_chunk, 0x004E4942)
    out[28 + json_chunk : 28 + json_chunk + len(bin)] = bin
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(out)


def main() -> int:
    src = sys.argv[1] if len(sys.argv) > 1 else r"E:\logs.obj"
    dest = sys.argv[2] if len(sys.argv) > 2 else r"E:\Server-main\Server-main\vr-client\assets\rs\models\2800.glb"
    verts, faces = parse_obj(src)
    if not verts or not faces:
        print("no verts/faces", file=sys.stderr)
        return 1
    src_mn, src_mx = aabb(verts)
    src_len = longest(src_mn, src_mx)
    scale = REF_LONGEST / src_len if src_len > 1e-6 else 1.0
    print(f"src aabb {src_mn} {src_mx} faces={len(faces)} scale={scale:.4f} ref_longest={REF_LONGEST}")
    cx = (src_mn[0] + src_mx[0]) * 0.5
    cz = (src_mn[2] + src_mx[2]) * 0.5
    cy = src_mn[1]
    fitted = [((x - cx) * scale, (y - cy) * scale, (z - cz) * scale) for x, y, z in verts]
    write_glb(dest, fitted, faces)
    print(f"wrote {dest} bytes={os.path.getsize(dest)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
