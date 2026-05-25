from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "eating out"
W, H = 1600, 900

CREAM = "#f7efd9"
PAPER = "#fff8e8"
INK = "#2c2418"
MUTED = "#8d6630"
RED = "#e63725"
DARK_RED = "#bd281d"
GOLD = "#c8953b"
SOFT_GOLD = "#ead7a7"
SHADOW = "#d7bd7c"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


JP_BOLD = r"C:\Windows\Fonts\YuGothB.ttc"
JP_REG = r"C:\Windows\Fonts\YuGothM.ttc"
LATIN = r"C:\Windows\Fonts\GOTHIC.TTF"
LATIN_BOLD = r"C:\Windows\Fonts\GOTHICB.TTF"


@dataclass(frozen=True)
class Restaurant:
    id: str
    category: str
    ja: str
    en: str
    glyph: str
    setting: str
    motif: str
    variant: int


RESTAURANTS: list[Restaurant] = [
    Restaurant("ramen-yabu", "ramen", "藪ラーメン", "Yabu Ramen", "佐", "下町の小さなラーメン屋", "醤油", 0),
    Restaurant("ramen-tora", "ramen", "虎拉麺", "Tora Ramen", "山", "屋台風のラーメン店", "虎", 1),
    Restaurant("ramen-michi", "ramen", "みち食堂", "Michi Shokudō", "田", "駅前のラーメン食堂", "駅前", 2),
    Restaurant("sushi-kiyo", "sushi", "清寿司", "Kiyo Sushi", "板", "カウンター席の寿司屋", "清", 0),
    Restaurant("sushi-tama", "sushi", "玉鮨", "Tama Sushi", "寿", "回転寿司のお店", "回転", 1),
    Restaurant("sushi-hana", "sushi", "花鮨", "Hana Sushi", "本", "カウンターだけの寿司屋", "花", 2),
    Restaurant("omakase-hibiki", "omakase", "響", "Hibiki", "匠", "静かな小さな店", "旬", 0),
    Restaurant("omakase-sen", "omakase", "千", "Sen", "匠", "カウンター8席の店", "八席", 1),
    Restaurant("omakase-mori", "omakase", "杜", "Mori", "匠", "隠れ家の懐石料理店", "杜", 2),
    Restaurant("izakaya-akari", "izakaya", "あかり", "Akari", "居", "居酒屋のテーブル席", "灯", 0),
    Restaurant("izakaya-tsuki", "izakaya", "つき", "Tsuki", "居", "路地裏の居酒屋", "月", 1),
    Restaurant("izakaya-take", "izakaya", "たけ", "Take", "居", "大衆居酒屋", "竹", 2),
    Restaurant("yatai-tora", "yatai", "とら屋台", "Tora Yatai", "屋", "橋のたもとの屋台", "とら", 0),
    Restaurant("yatai-yumi", "yatai", "ゆみの店", "Yumi-no-mise", "屋", "お祭りの屋台", "祭", 1),
    Restaurant("yatai-hyaku", "yatai", "百屋台", "Hyaku Yatai", "屋", "夜店の通り", "百", 2),
    Restaurant("konbini-lawson", "konbini", "ローソン", "Lawson", "店", "24時間のコンビニ", "24", 0),
    Restaurant("konbini-family", "konbini", "ファミリーマート", "FamilyMart", "店", "駅前のコンビニ", "駅前", 1),
    Restaurant("konbini-seven", "konbini", "セブン-イレブン", "Seven-Eleven", "店", "交差点のコンビニ", "7", 2),
]


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def centered_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill, anchor="mm") -> None:
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor)


def vertical_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill, gap=2) -> None:
    x, y = xy
    for char in text:
        if char in "-ー":
            draw.line((x - 26, y + 28, x + 26, y + 28), fill=fill, width=8)
            y += fnt.size + gap
            continue
        w, h = text_size(draw, char, fnt)
        draw.text((x - w / 2, y), char, font=fnt, fill=fill)
        y += h + gap + 8


def draw_paper(draw: ImageDraw.ImageDraw) -> None:
    draw.rectangle((0, 0, W, H), fill=CREAM)
    for x in range(0, W, 18):
        for y in range(0, H, 18):
            draw.point((x + 2, y + 2), fill="#eadfc3")
    for i in range(42):
        x = -180 + i * 48
        draw.line((x, H + 60, x + 760, -80), fill="#efd9a6", width=1)
    draw.rounded_rectangle((34, 34, W - 34, H - 34), radius=28, outline="#e2c78b", width=2)


def glow(base: Image.Image, center: tuple[int, int], radius: int, color=(230, 55, 37, 72)) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(radius // 2))
    base.alpha_composite(layer)


def draw_city_lines(draw: ImageDraw.ImageDraw, shift: int = 0) -> None:
    line = "#ef6b5f"
    for i, x in enumerate([82, 208, 370, 1060, 1230, 1420]):
        top = 70 + ((i + shift) % 3) * 35
        bottom = 820 - ((i + shift) % 2) * 42
        draw.polygon([(x, top), (x + 100, top + 38), (x + 92, bottom), (x - 16, bottom - 28)], outline=line, fill=None)
        for yy in range(top + 60, bottom - 40, 54):
            draw.line((x + 7, yy, x + 82, yy + 16), fill=line, width=1)
        for yy in range(top + 92, bottom - 60, 88):
            draw.rectangle((x + 28, yy, x + 72, yy + 34), outline=line, width=2)
    for x in [520, 690, 880]:
        draw.line((x, 66, x - 230, 820), fill=line, width=1)
        draw.line((x + 42, 58, x - 120, 820), fill=line, width=1)


def draw_lantern(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, scale=1.0) -> None:
    w, h = int(138 * scale), int(190 * scale)
    draw.rounded_rectangle((x - w // 2, y - h // 2, x + w // 2, y + h // 2), radius=w // 2, fill=RED, outline=DARK_RED, width=4)
    for k in range(7):
        yy = y - h // 2 + 18 + k * (h - 36) / 6
        draw.arc((x - w // 2 + 8, yy - 18, x + w // 2 - 8, yy + 18), 0, 180, fill="#ff8c78", width=1)
    f = font(JP_BOLD, int(56 * scale))
    vertical_text(draw, (x, y - h // 2 + 28), label[:3], f, PAPER, gap=-6)
    draw.rectangle((x - w // 3, y - h // 2 - 18, x + w // 3, y - h // 2 + 8), fill=DARK_RED)


def draw_awning(draw: ImageDraw.ImageDraw, y: int, tilt: int = 0) -> None:
    draw.polygon([(448, y + 42), (1188, y - 32), (1476, y + 78), (640, y + 160)], fill=RED, outline=DARK_RED)
    for x in [580, 780, 980, 1180, 1370]:
        draw.line((x, y + 28 + tilt, x + 76, y + 118), fill=PAPER, width=10)
    draw.line((448, y + 42, 640, y + 160), fill=PAPER, width=8)
    draw.line((1188, y - 32, 1476, y + 78), fill=PAPER, width=8)


def draw_title_block(draw: ImageDraw.ImageDraw, r: Restaurant) -> None:
    fjp = font(JP_BOLD, 74 if len(r.ja) <= 5 else 60)
    fen = font(LATIN, 26)
    fset = font(JP_REG, 27)
    draw.rounded_rectangle((78, 620, 780, 808), radius=8, fill="#fff4d9", outline="#e2c78b", width=2)
    draw.rectangle((78, 620, 100, 808), fill=GOLD)
    draw.text((128, 642), r.ja, font=fjp, fill=INK)
    draw.text((132, 720), r.en.upper(), font=fen, fill=MUTED)
    draw.text((132, 762), r.setting, font=fset, fill=MUTED)
    badge_font = font(JP_BOLD, 48)
    draw.ellipse((680, 646, 754, 720), fill=SOFT_GOLD, outline=GOLD, width=3)
    centered_text(draw, (717, 682), r.glyph, badge_font, MUTED)


def draw_category_label(draw: ImageDraw.ImageDraw, r: Restaurant) -> None:
    labels = {
        "ramen": "ラーメン",
        "sushi": "寿司",
        "omakase": "おまかせ",
        "izakaya": "居酒屋",
        "yatai": "屋台",
        "konbini": "コンビニ",
    }
    f = font(JP_BOLD, 30)
    draw.rounded_rectangle((1248, 70, 1518, 132), radius=31, fill=PAPER, outline="#e2c78b", width=2)
    draw.text((1282, 83), labels[r.category], font=f, fill=MUTED)


def draw_bowl(draw: ImageDraw.ImageDraw, x: int, y: int, scale=1.0) -> None:
    w, h = int(360 * scale), int(160 * scale)
    draw.ellipse((x - w // 2, y - h // 2, x + w // 2, y + h // 2), fill=PAPER, outline=RED, width=7)
    draw.arc((x - w // 2 + 18, y - h // 2 + 22, x + w // 2 - 18, y + h // 2 + 18), 0, 180, fill=DARK_RED, width=5)
    for i in range(7):
        yy = y - 30 + i * 10
        draw.arc((x - 118 + i * 8, yy, x + 120 + i * 8, yy + 44), 180, 350, fill=RED, width=3)
    draw.ellipse((x - 94, y - 54, x - 26, y + 12), outline=RED, width=5)
    draw.ellipse((x + 28, y - 66, x + 104, y + 10), outline=RED, width=5)
    draw.line((x + 118, y - 98, x + 240, y - 188), fill=INK, width=12)
    draw.line((x + 144, y - 90, x + 266, y - 178), fill=INK, width=12)
    draw.arc((x - w // 2 + 18, y - h // 2 + 58, x + w // 2 - 18, y + h), 0, 180, fill=RED, width=6)


def draw_sushi_set(draw: ImageDraw.ImageDraw, x: int, y: int, scale=1.0) -> None:
    for i, color in enumerate([RED, DARK_RED, GOLD, RED]):
        xx = x + int((i - 1.5) * 120 * scale)
        draw.rounded_rectangle((xx - 48, y, xx + 48, y + 92), radius=24, fill=PAPER, outline=RED, width=5)
        draw.rounded_rectangle((xx - 54, y - 20, xx + 54, y + 34), radius=22, fill=color, outline=DARK_RED, width=3)
        draw.line((xx - 34, y + 44, xx + 34, y + 66), fill="#efcfa0", width=3)
    draw.rounded_rectangle((x - 340, y + 126, x + 340, y + 162), radius=12, fill=SOFT_GOLD, outline=GOLD, width=3)


def draw_counter(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    draw.polygon([(x - 450, y + 110), (x + 600, y + 56), (x + 730, y + 180), (x - 360, y + 238)], fill="#f1d99d", outline=GOLD)
    for i in range(9):
        xx = x - 320 + i * 110
        draw.line((xx, y + 104, xx + 94, y + 194), fill="#d6a357", width=2)
    draw.rectangle((x - 280, y - 8, x + 500, y + 62), fill=PAPER, outline=RED, width=4)
    for i in range(8):
        xx = x - 252 + i * 92
        draw.line((xx, y - 4, xx + 50, y + 58), fill=RED, width=2)


def draw_izakaya_table(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    draw.rounded_rectangle((x - 340, y + 82, x + 390, y + 160), radius=34, fill="#eed28e", outline=GOLD, width=4)
    for i in range(5):
        xx = x - 260 + i * 120
        draw.line((xx, y + 160, xx - 42, y + 254), fill=MUTED, width=5)
    for xx in [x - 188, x + 20, x + 226]:
        draw.rectangle((xx - 20, y - 20, xx + 20, y + 80), fill=PAPER, outline=RED, width=4)
        draw.ellipse((xx - 24, y - 28, xx + 24, y + 0), fill="#fff9e9", outline=RED, width=3)
        draw.rectangle((xx - 12, y + 22, xx + 12, y + 58), fill=GOLD)
    for xx in [x - 90, x + 112]:
        draw.line((xx, y + 16, xx + 72, y - 64), fill=INK, width=10)
        draw.line((xx + 20, y + 26, xx + 92, y - 54), fill=INK, width=10)


def draw_yatai_stall(draw: ImageDraw.ImageDraw, x: int, y: int, label: str) -> None:
    draw.polygon([(x - 460, y - 10), (x + 390, y - 80), (x + 500, y + 48), (x - 380, y + 112)], fill=RED, outline=DARK_RED)
    for xx in [x - 310, x - 110, x + 90, x + 290]:
        draw.line((xx, y - 26, xx + 70, y + 78), fill=PAPER, width=9)
    draw.rectangle((x - 330, y + 100, x + 330, y + 318), fill="#fff3d2", outline=RED, width=5)
    for xx in [x - 320, x + 320]:
        draw.line((xx, y + 100, xx, y + 350), fill=DARK_RED, width=12)
    draw_lantern(draw, x - 390, y + 168, label, 0.7)
    for i in range(6):
        xx = x - 250 + i * 88
        draw.rounded_rectangle((xx, y + 138, xx + 52, y + 204), radius=18, fill=PAPER, outline=RED, width=3)
        draw.line((xx + 26, y + 203, xx + 34, y + 246), fill=INK, width=4)


def draw_konbini(draw: ImageDraw.ImageDraw, x: int, y: int, r: Restaurant) -> None:
    draw.rectangle((x - 470, y - 70, x + 480, y + 330), fill="#fff8e8", outline=RED, width=5)
    stripe_colors = [RED, GOLD, DARK_RED] if r.variant != 1 else [GOLD, RED, "#4f8c75"]
    yy = y - 44
    for c in stripe_colors:
        draw.rectangle((x - 470, yy, x + 480, yy + 24), fill=c)
        yy += 24
    draw.rectangle((x - 112, y + 70, x + 112, y + 330), fill="#f7efd9", outline=RED, width=5)
    draw.line((x, y + 70, x, y + 330), fill=RED, width=3)
    for xx in [x - 352, x + 236]:
        draw.rectangle((xx, y + 78, xx + 136, y + 222), fill=PAPER, outline=RED, width=4)
        draw.line((xx + 16, y + 114, xx + 120, y + 114), fill="#e6c987", width=3)
        draw.line((xx + 16, y + 160, xx + 120, y + 160), fill="#e6c987", width=3)
    f = font(JP_BOLD, 52 if len(r.ja) < 8 else 42)
    centered_text(draw, (x, y + 12), r.ja, f, INK)
    draw.ellipse((x + 364, y + 236, x + 438, y + 310), fill=RED)
    centered_text(draw, (x + 401, y + 270), r.motif, font(JP_BOLD, 35), PAPER)


def draw_menu_strips(draw: ImageDraw.ImageDraw, labels: list[str], start=(845, 214)) -> None:
    f = font(JP_REG, 25)
    x0, y0 = start
    for i, label in enumerate(labels):
        x = x0 + i * 70
        draw.rounded_rectangle((x, y0, x + 46, y0 + 212), radius=4, fill=PAPER, outline=RED, width=2)
        vertical_text(draw, (x + 23, y0 + 14), label, f, RED, gap=-8)


def render(r: Restaurant) -> Image.Image:
    img = Image.new("RGBA", (W, H), CREAM)
    draw = ImageDraw.Draw(img)
    draw_paper(draw)
    glow(img, (260 + r.variant * 480, 230 + r.variant * 55), 220, (230, 55, 37, 42))
    draw_city_lines(draw, r.variant)
    draw_awning(draw, 222 + r.variant * 10, r.variant * 8)

    if r.category == "ramen":
        draw_lantern(draw, 176, 318, "ラーメン", 1.05)
        draw_bowl(draw, 1040, 544, 1.15)
        draw_menu_strips(draw, ["味噌", "醤油", "塩", "餃子"], (770, 210))
    elif r.category == "sushi":
        draw_lantern(draw, 198, 318, "寿司", 1.0)
        draw_sushi_set(draw, 1040, 520, 1.25)
        draw_counter(draw, 900, 405)
        draw_menu_strips(draw, ["鮪", "海老", "玉子", r.motif], (754, 190))
    elif r.category == "omakase":
        draw_counter(draw, 880, 420)
        draw_sushi_set(draw, 1045, 506, 0.98)
        draw.rounded_rectangle((1120, 184, 1244, 438), radius=4, fill=RED, outline=DARK_RED, width=3)
        vertical_text(draw, (1182, 216), r.ja + "  " + r.motif, font(JP_BOLD, 55), PAPER, gap=-8)
        draw_menu_strips(draw, ["旬", "酒", "膳"], (760, 198))
    elif r.category == "izakaya":
        draw_lantern(draw, 224, 332, "居酒屋", 1.02)
        draw_izakaya_table(draw, 1010, 470)
        draw_menu_strips(draw, ["生", "串", "酒", r.motif], (802, 194))
    elif r.category == "yatai":
        draw_yatai_stall(draw, 1015, 324, r.motif)
        draw_lantern(draw, 190, 332, "屋台", 0.96)
        draw_menu_strips(draw, ["焼", "蛸", "祭", r.motif], (766, 184))
    else:
        draw_konbini(draw, 1010, 344, r)
        draw_menu_strips(draw, ["弁当", "茶", "麺", r.motif], (770, 186))

    draw_title_block(draw, r)
    draw_category_label(draw, r)
    draw.text((103, 90), "nihongo / eating out", font=font(LATIN, 22), fill=MUTED)
    draw.text((103, 124), r.id, font=font(LATIN, 18), fill="#b2874d")

    rgb = Image.new("RGB", img.size, CREAM)
    rgb.paste(img, mask=img.getchannel("A"))
    return rgb


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for restaurant in RESTAURANTS:
        image = render(restaurant)
        out = OUT_DIR / f"{restaurant.id}.png"
        image.save(out, optimize=True)
        print(out)


if __name__ == "__main__":
    main()
