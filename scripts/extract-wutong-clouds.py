from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image


COLS = 2
ROWS = 4
OUTPUT_SIZE = (1024, 512)
PADDING = 36


def clean_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    alpha = alpha.point(lambda value: 0 if value < 24 else value)
    rgba.putalpha(alpha)
    return rgba


def fit_sprite(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("Cloud cell contains no visible pixels")

    sprite = image.crop(bbox)
    max_width = OUTPUT_SIZE[0] - PADDING * 2
    max_height = OUTPUT_SIZE[1] - PADDING * 2
    scale = min(max_width / sprite.width, max_height / sprite.height)
    resized = sprite.resize(
        (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    x = (OUTPUT_SIZE[0] - resized.width) // 2
    y = (OUTPUT_SIZE[1] - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def extract_clouds(source: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(source).convert("RGBA")
    shutil.copy2(source, output_dir / "wutong-cloud-atlas.png")

    for row in range(ROWS):
        top = round(row * atlas.height / ROWS)
        bottom = round((row + 1) * atlas.height / ROWS)
        for col in range(COLS):
            left = round(col * atlas.width / COLS)
            right = round((col + 1) * atlas.width / COLS)
            cell = clean_alpha(atlas.crop((left, top, right, bottom)))
            sprite = fit_sprite(cell)
            index = row * COLS + col + 1
            sprite.save(
                output_dir / f"wutong-cloud-{index:02d}.webp",
                "WEBP",
                lossless=True,
                method=6,
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract the Wutong cloud atlas into WebP sprites")
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    extract_clouds(args.source, args.output_dir)


if __name__ == "__main__":
    main()
