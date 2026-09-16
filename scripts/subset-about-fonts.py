"""Build site-wide Chinese fonts; run again when adding copy outside GB2312.

Requires fonttools. The legacy script name is retained for existing workflows.
Original fonts are never modified. Generated fonts are checked for missing CJK.
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = (ROOT / "src", ROOT / "public")
TEXT_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".json", ".html", ".css", ".md"}
COMMON_TEXT = """
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
，。！？；：、（）《》【】「」『』“”‘’—…·+-/.:,!?%&#@()[]{}<>_=
吴桐AI设计师用与好奇心是我的下一站作品项目经历技能关于联系查看精选合集工作室负责人AIGC主理人
"""


def collect_characters():
    characters = set(COMMON_TEXT)
    # Include common simplified Chinese beyond today's copy, so CMS updates and
    # contact-form input don't immediately require a new font build.
    for high in range(0xA1, 0xF8):
        for low in range(0xA1, 0xFF):
            try:
                characters.update(bytes((high, low)).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    for source_dir in SOURCE_DIRS:
        for path in source_dir.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                try:
                    characters.update(path.read_text(encoding="utf-8"))
                except UnicodeDecodeError:
                    continue
    return "".join(sorted(characters))


def build_font(source, destination, characters):
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6]
    options.name_legacy = True
    options.name_languages = [0x0409, 0x0804]
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.drop_tables = []

    font = subset.load_font(str(source), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    subset.save_font(font, str(destination), options)
    with TTFont(destination) as built:
        cmap = built.getBestCmap()
        missing = sorted({ord(c) for c in characters if '\u3400' <= c <= '\u9fff'} - cmap.keys())
        if missing:
            raise ValueError(f"Missing CJK glyphs in {destination.name}: {missing}")


def main():
    fonts_dir = ROOT / "public" / "fonts"
    fonts_dir.mkdir(parents=True, exist_ok=True)
    characters = collect_characters()

    jobs = (
        (
            Path(r"C:\Windows\Fonts\HarmonyOS_Sans_SC_Bold.ttf"),
            fonts_dir / "HarmonyOS-Sans-SC-Bold-Site.ttf",
        ),
        (
            Path(r"C:\Windows\Fonts\HarmonyOS_Sans_SC_Regular.ttf"),
            fonts_dir / "HarmonyOS-Sans-SC-Regular-Site.ttf",
        ),
    )

    for source, destination in jobs:
        build_font(source, destination, characters)
        print(f"Built {destination.name}: {destination.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
