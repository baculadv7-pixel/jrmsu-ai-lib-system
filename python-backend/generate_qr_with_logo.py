#!/usr/bin/env python3
"""
Generate QR codes with embedded logo using qrcode + Pillow.
- High error correction (H) for logo readability
- Centered logo scaled to ~20% of QR width

Usage (CLI):
  python generate_qr_with_logo.py --data '{"systemId":"JRMSU-LIBRARY"}' \
    --logo "../src/assets/JRMSU-KCS-removebg-preview.png" --out qr.png
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image


def generate_qr_with_logo(data: str | dict, logo_path: str | Path, out_path: str | Path,
                           box_size: int = 10, border: int = 4, logo_scale: float = 0.2) -> Path:
    if isinstance(data, dict):
        payload = json.dumps(data, ensure_ascii=False)
    else:
        payload = str(data)

    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    logo = Image.open(logo_path).convert("RGBA")
    # Scale logo relative to QR size
    qr_w, qr_h = img_qr.size
    logo_max_w = int(qr_w * logo_scale)
    logo_ratio = logo_max_w / logo.width
    logo_size = (logo_max_w, int(logo.height * logo_ratio))
    logo = logo.resize(logo_size, Image.LANCZOS)

    # Compute centered position
    pos = ((qr_w - logo.size[0]) // 2, (qr_h - logo.size[1]) // 2)

    # Paste logo with transparency
    img_qr.paste(logo, pos, mask=logo)

    out_path = Path(out_path)
    img_qr.save(out_path)
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="JSON string or plain text to encode")
    ap.add_argument("--logo", required=True, help="Path to logo image")
    ap.add_argument("--out", required=True, help="Output PNG path")
    ap.add_argument("--box-size", type=int, default=10)
    ap.add_argument("--border", type=int, default=4)
    ap.add_argument("--logo-scale", type=float, default=0.2)
    args = ap.parse_args()

    try:
        # Try to parse JSON; fall back to raw string
        try:
            data = json.loads(args.data)
        except json.JSONDecodeError:
            data = args.data
        out_path = generate_qr_with_logo(data, args.logo, args.out, args.box_size, args.border, args.logo_scale)
        print(str(out_path))
    except Exception as e:
        raise SystemExit(f"Failed to generate QR: {e}")


if __name__ == "__main__":
    main()
