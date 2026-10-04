#!/usr/bin/env python3
"""
Generate Static PWA App Icons (192x192 & 512x512) for RPDevs Games Suite
Creates crisp, brand-styled icons for the master portal and all 15 classic games.
"""

import os
import sys
from PIL import Image, ImageDraw

GAMES_ROOT = "/mnt/sharedroot/projects/games"

ACCENT_COLORS = {
    "lightsout": "#ff0055",
    "snake": "#8bac0f",
    "simon": "#00f0ff",
    "minesweeper": "#c0c0c0",
    "2048": "#edc22e",
    "dotsandboxes": "#3b82f6",
    "sokoban": "#e3a018",
    "connectfour": "#004b93",
    "breakout": "#00f0ff",
    "pong": "#00f0ff",
    "fallingblocks": "#00f0f0",
    "mazechaser": "#ffd700",
    "asteroids": "#00f0ff",
    "wordle": "#538d4e",
    "spaceinvaders": "#00ff66",
    "frogger": "#00ff66",
    "portal": "#a855f7"
}

TARGETS = [
    "lightsout", "snake", "simon", "minesweeper", "2048", "dotsandboxes",
    "sokoban", "connectfour", "breakout", "pong", "fallingblocks", "mazechaser",
    "asteroids", "wordle", "spaceinvaders", "frogger", "portal"
]


def render_icon(target, size=512):
    img = Image.new('RGBA', (size, size), (16, 18, 26, 255))
    draw = ImageDraw.Draw(img)
    scale = size / 256.0
    color = ACCENT_COLORS.get(target, "#00f0ff")

    # Outer border
    draw.rounded_rectangle(
        [int(8 * scale), int(8 * scale), int((256 - 8) * scale), int((256 - 8) * scale)],
        radius=int(44 * scale),
        fill=(22, 25, 35),
        outline=color,
        width=int(8 * scale)
    )

    # Center badge
    draw.ellipse(
        [int(50 * scale), int(40 * scale), int((256 - 50) * scale), int((256 - 60) * scale)],
        fill=(30, 34, 48),
        outline=color,
        width=int(4 * scale)
    )

    def r(x1, y1, x2, y2, fill, outline=None, width=0):
        draw.rectangle(
            [int(x1 * scale), int(y1 * scale), int(x2 * scale), int(y2 * scale)],
            fill=fill,
            outline=outline,
            width=int(width * scale) if width else 0
        )

    def rr(x1, y1, x2, y2, radius, fill, outline=None, width=0):
        draw.rounded_rectangle(
            [int(x1 * scale), int(y1 * scale), int(x2 * scale), int(y2 * scale)],
            radius=int(radius * scale),
            fill=fill,
            outline=outline,
            width=int(width * scale) if width else 0
        )

    def poly(coords, fill, outline=None, width=0):
        scaled = [(int(x * scale), int(y * scale)) for x, y in coords]
        draw.polygon(scaled, fill=fill, outline=outline, width=int(width * scale) if width else 0)

    if target == 'lightsout':
        r(90, 70, 166, 146, fill='#ff0055')
    elif target == 'snake':
        for seg in [(80, 90), (105, 90), (130, 90), (130, 115), (155, 115)]:
            r(seg[0], seg[1], seg[0] + 18, seg[1] + 18, fill='#8bac0f')
    elif target == 'simon':
        box = [int(65 * scale), int(55 * scale), int((256 - 65) * scale), int((256 - 75) * scale)]
        draw.pieslice(box, 0, 90, fill='#00f0ff')
        draw.pieslice(box, 90, 180, fill='#ff0055')
        draw.pieslice(box, 180, 270, fill='#ffe600')
        draw.pieslice(box, 270, 360, fill='#00ff66')
    elif target == 'minesweeper':
        draw.ellipse([int(98 * scale), int(78 * scale), int(158 * scale), int(138 * scale)], fill='#333333')
        draw.line([int(128 * scale), int(64 * scale), int(128 * scale), int(152 * scale)], fill='#ff3333', width=int(6 * scale))
        draw.line([int(84 * scale), int(108 * scale), int(172 * scale), int(108 * scale)], fill='#ff3333', width=int(6 * scale))
    elif target == '2048':
        r(80, 70, 176, 146, fill='#edc22e')
    elif target == 'dotsandboxes':
        for x in [88, 128, 168]:
            for y in [78, 118, 158]:
                draw.ellipse([int((x - 6) * scale), int((y - 6) * scale), int((x + 6) * scale), int((y + 6) * scale)], fill='#60a5fa')
        draw.line([int(88 * scale), int(78 * scale), int(128 * scale), int(78 * scale)], fill='#3b82f6', width=int(6 * scale))
        draw.line([int(88 * scale), int(78 * scale), int(88 * scale), int(118 * scale)], fill='#3b82f6', width=int(6 * scale))
    elif target == 'sokoban':
        r(88, 76, 168, 156, fill='#b86e26', outline='#ffd166', width=4)
        draw.line([int(88 * scale), int(76 * scale), int(168 * scale), int(156 * scale)], fill='#754111', width=int(4 * scale))
        draw.line([int(88 * scale), int(156 * scale), int(168 * scale), int(76 * scale)], fill='#754111', width=int(4 * scale))
    elif target == 'connectfour':
        rr(78, 66, 178, 166, radius=14, fill='#004b93', outline='#002e5b', width=4)
        for cx, cy, ccolor in [(102, 96, '#e63946'), (154, 96, '#ffb703'), (102, 136, '#ffb703'), (154, 136, '#e63946')]:
            draw.ellipse([int((cx - 16) * scale), int((cy - 16) * scale), int((cx + 16) * scale), int((cy + 16) * scale)], fill=ccolor)
    elif target == 'breakout':
        for y, bcolor in [(70, '#ff0055'), (86, '#ff8800'), (102, '#00ff66'), (118, '#ffe600')]:
            for bx in [68, 102, 136, 170]:
                r(bx, y, bx + 28, y + 10, fill=bcolor)
        r(96, 150, 160, 158, fill='#00f0ff')
        r(124, 136, 132, 144, fill='#ffffff')
    elif target == 'pong':
        r(68, 80, 76, 144, fill='#00f0ff')
        r(180, 70, 188, 134, fill='#ff0055')
        for ny in range(40, 180, 16):
            draw.line([int(128 * scale), int(ny * scale), int(128 * scale), int((ny + 8) * scale)], fill='#4b5563', width=int(2 * scale))
        r(124, 104, 132, 112, fill='#ffffff')
    elif target == 'fallingblocks':
        blocks = [
            (90, 70, '#00f0f0'), (110, 70, '#00f0f0'), (130, 70, '#00f0f0'), (150, 70, '#00f0f0'),
            (90, 100, '#e63946'), (110, 100, '#e63946'), (110, 120, '#e63946'), (130, 120, '#e63946')
        ]
        for bx, by, c in blocks:
            r(bx, by, bx + 18, by + 18, fill=c, outline='#ffffff', width=1)
    elif target == 'mazechaser':
        draw.ellipse([int(80 * scale), int(70 * scale), int(144 * scale), int(134 * scale)], fill='#ffd700')
        draw.polygon([(int(112 * scale), int(102 * scale)), (int(144 * scale), int(86 * scale)), (int(144 * scale), int(118 * scale))], fill=(30, 34, 48))
        for dot_x in [160, 180]:
            draw.ellipse([int((dot_x - 4) * scale), int((102 - 4) * scale), int((dot_x + 4) * scale), int((dot_x + 4) * scale)], fill='#ffd700')
    elif target == 'asteroids':
        poly([(128, 60), (160, 150), (128, 135), (96, 150)], fill='#ffffff')
        poly([(60, 60), (80, 50), (95, 70), (85, 95), (65, 90), (55, 75)], fill=None, outline='#00f0ff', width=3)
    elif target == 'wordle':
        tiles = [
            (55, 55, 105, 105, '#538d4e'),
            (115, 55, 165, 105, '#b59f3b'),
            (175, 55, 225, 105, '#3a3a3c'),
            (55, 115, 105, 165, '#3a3a3c'),
            (115, 115, 165, 165, '#538d4e'),
            (175, 115, 225, 165, '#b59f3b'),
            (55, 175, 105, 225, '#538d4e'),
            (115, 175, 165, 225, '#538d4e'),
            (175, 175, 225, 225, '#538d4e')
        ]
        for x1, y1, x2, y2, c in tiles:
            r(x1, y1, x2, y2, fill=c)
    elif target == 'spaceinvaders':
        r(110, 60, 146, 75, fill='#00ff66')
        r(95, 75, 161, 105, fill='#00ff66')
        r(80, 105, 176, 125, fill='#00ff66')
        r(105, 90, 115, 105, fill='#161820')
        r(141, 90, 151, 105, fill='#161820')
        r(90, 125, 105, 145, fill='#00ff66')
        r(151, 125, 166, 145, fill='#00ff66')
    elif target == 'frogger':
        # Green Frog
        draw.ellipse([int(100 * scale), int(90 * scale), int(156 * scale), int(156 * scale)], fill='#00ff66')
        # Eyes
        draw.ellipse([int(94 * scale), int(76 * scale), int(114 * scale), int(96 * scale)], fill='#ffffff')
        draw.ellipse([int(142 * scale), int(76 * scale), int(162 * scale), int(96 * scale)], fill='#ffffff')
        draw.ellipse([int(100 * scale), int(80 * scale), int(110 * scale), int(90 * scale)], fill='#000000')
        draw.ellipse([int(146 * scale), int(80 * scale), int(156 * scale), int(90 * scale)], fill='#000000')
        # Legs
        r(74, 110, 96, 140, fill='#00ff66')
        r(160, 110, 182, 140, fill='#00ff66')
        r(68, 136, 96, 150, fill='#00ff66')
        r(160, 136, 188, 150, fill='#00ff66')
    else:  # Portal
        r(85, 75, 171, 141, fill='#a855f7')
        draw.ellipse([int(100 * scale), int(80 * scale), int(156 * scale), int(136 * scale)], fill='#ffd700')

    return img


def main():
    print("🎨 Generating PWA App Icons (192x192 & 512x512)...")
    for target in TARGETS:
        dest_dir = GAMES_ROOT if target == 'portal' else os.path.join(GAMES_ROOT, target)
        if not os.path.exists(dest_dir):
            continue

        img512 = render_icon(target, 512)
        img192 = img512.resize((192, 192), Image.Resampling.LANCZOS)

        p192 = os.path.join(dest_dir, "icon.png")
        p512 = os.path.join(dest_dir, "icon-512.png")

        img192.save(p192, 'PNG')
        img512.save(p512, 'PNG')
        print(f"  ✅ {target.ljust(14)} -> {p192} & icon-512.png")

    print("✨ All PWA icons generated successfully!")


if __name__ == '__main__':
    main()
