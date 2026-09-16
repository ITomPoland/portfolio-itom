"""Prepare the user-provided cloud illustrations for the portfolio.

The source PNGs keep a large transparent square canvas.  This script crops that
empty area, keeps a small safety margin, and exports alpha-preserving WebP files
at a browser-friendly size.
"""

from pathlib import Path

from PIL import Image


DOWNLOADS = Path.home() / "Downloads"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "textures" / "clouds"

SOURCE_FILES = [
    "ChatGPT Image 2026年8月26日 23_16_30 (3).png",
    "ChatGPT Image 2026年8月26日 23_16_30 (4).png",
    "ChatGPT Image 2026年8月26日 23_16_30 (5).png",
    "ChatGPT Image 2026年8月26日 23_16_30 (6).png",
    "ChatGPT Image 2026年8月26日 23_16_30 (1).png",
    "ChatGPT Image 2026年8月26日 23_16_30 (2).png",
    "ChatGPT Image 2026年8月26日 23_16_24 (5).png",
    "ChatGPT Image 2026年8月26日 23_16_24 (6).png",
    "ChatGPT Image 2026年8月26日 23_16_23 (4).png",
    "ChatGPT Image 2026年8月26日 23_16_23 (1).png",
    "ChatGPT Image 2026年8月26日 23_16_23 (2).png",
    "ChatGPT Image 2026年8月26日 23_16_23 (3).png",
]

MAX_EDGE = 768
PADDING = 28
ALPHA_THRESHOLD = 16


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("The source image contains no visible pixels.")

    left, top, right, bottom = bbox
    return (
        max(0, left - PADDING),
        max(0, top - PADDING),
        min(image.width, right + PADDING),
        min(image.height, bottom + PADDING),
    )


def prepare_image(source: Path, destination: Path) -> None:
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        image = image.crop(alpha_bbox(image))

        longest_edge = max(image.size)
        if longest_edge > MAX_EDGE:
            ratio = MAX_EDGE / longest_edge
            image = image.resize(
                (round(image.width * ratio), round(image.height * ratio)),
                Image.Resampling.LANCZOS,
            )

        image.save(
            destination,
            "WEBP",
            quality=92,
            method=6,
            exact=True,
        )

    with Image.open(destination) as result:
        print(
            f"{destination.name}: {source.name} -> "
            f"{result.width}x{result.height}, {destination.stat().st_size / 1024:.1f} KiB"
        )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    missing = [name for name in SOURCE_FILES if not (DOWNLOADS / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing source images: {missing}")

    for index, filename in enumerate(SOURCE_FILES, start=1):
        prepare_image(
            DOWNLOADS / filename,
            OUTPUT_DIR / f"candy-cloud-{index:02d}.webp",
        )


if __name__ == "__main__":
    main()
