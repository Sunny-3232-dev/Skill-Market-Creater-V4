#!/usr/bin/env python3
"""サムネイルのトンマナ見本を components/previewImages.ts に埋め込み直す。

使い方:
  1. ChatGPT で作った見本を public/previews/<キー>.png（または .jpg）として保存する
     キー: benefit_banner / standard / simple / watercolor / pop / youtube / puffy_3d
  2. python3 scripts/encode_previews.py
  3. components/previewImages.ts が書き換わるので、画面で見た目を確認してコミットする

外部ファイル参照だと Google AI Studio で配信されないため、240px の JPEG にして data URI でソースに埋め込む。
Pillow が必要（pip install pillow）。
"""
from __future__ import annotations

import base64
import io
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow が入っていません: pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "previews"
OUT = ROOT / "components" / "previewImages.ts"
KEYS = ["standard", "simple", "watercolor", "pop", "youtube", "puffy_3d", "benefit_banner"]
WIDTH = 240
QUALITY = 78


def find_source(key: str) -> Path | None:
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = SRC / f"{key}.{ext}"
        if p.exists():
            return p
    return None


def encode(path: Path) -> str:
    im = Image.open(path).convert("RGB")
    # 3:2 に寄せる（生成画像は 3:2 のはずだが、少しずれていても中央で切る）
    w, h = im.size
    target_h = round(w * 2 / 3)
    if h > target_h:
        top = (h - target_h) // 2
        im = im.crop((0, top, w, top + target_h))
    elif h < target_h:
        target_w = round(h * 3 / 2)
        left = (w - target_w) // 2
        im = im.crop((left, 0, left + target_w, h))
    im = im.resize((WIDTH, round(WIDTH * 2 / 3)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=QUALITY, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> int:
    entries: list[tuple[str, str]] = []
    missing: list[str] = []
    for key in KEYS:
        src = find_source(key)
        if not src:
            missing.append(key)
            continue
        uri = encode(src)
        entries.append((key, uri))
        print(f"  {key:15s} {src.name:22s} -> {len(uri) // 1024}KB")
    if missing:
        print("見本が無いキー（スキップ）:", ", ".join(missing))
    if not entries:
        return 1

    lines = [
        "// 自動生成: サムネイルのトンマナ見本（ChatGPT で生成した見本を 240px/JPEG に圧縮し data URI 化）。",
        "// 外部ファイル参照だと Google AI Studio で配信されないため、ソースに埋め込んで確実に表示する。",
        "// 更新する場合は元画像を public/previews/<キー>.png に置き、scripts/encode_previews.py を実行すること。",
        "",
        "export const PREVIEW_DATA_URIS: Record<string, string> = {",
    ]
    for key, uri in entries:
        lines.append(f'  {key}: "{uri}",')
    lines.append("};")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"-> {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024}KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
