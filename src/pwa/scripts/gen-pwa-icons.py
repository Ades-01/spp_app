# -*- coding: utf-8 -*-
"""PWA 图标生成器（SC 定制版）：深蓝 #1A5F9E 纯色背景 + 加粗白色 'SC' 居中。
规格：
  - 字体：Arial Bold（Windows: arialbd.ttf；回退 DejaVuSans-Bold）——跨平台无衬线体
  - 字号 = 图标尺寸 × 50%（maskable 用 42% 以留在 80% 安全区内）
  - 输出：icon-{48,72,96,144,152,167,180,192,512}x{...}.png + apple-touch-icon.png(180)
运行：python pwa/scripts/gen-pwa-icons.py（在 Web应用 目录下）
"""
import os
from PIL import Image, ImageDraw, ImageFont

BG = (26, 95, 158)        # #1A5F9E
FG = (255, 255, 255)      # 白
TEXT = 'SC'
FONT_CANDIDATES = [
    'C:/Windows/Fonts/arialbd.ttf',            # Arial Bold
    'C:/Windows/Fonts/Arialbd.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
]
SIZES = [48, 72, 96, 144, 152, 167, 180, 192, 512]

def load_font(px):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()            # 兜底位图字体（各平台均有）

def make_icon(size, ratio=0.5):
    img = Image.new('RGB', (size, size), BG)
    d = ImageDraw.Draw(img)
    font = load_font(max(8, round(size * ratio)))
    # 用 textbbox 精确测量并居中（含字体上下伸部，视觉居中而非基线居中）
    l, t, r, b = d.textbbox((0, 0), TEXT, font=font)
    w, h = r - l, b - t
    d.text(((size - w) / 2 - l, (size - h) / 2 - t), TEXT, font=font, fill=FG)
    return img

def main():
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out = os.path.join(base, 'icons')
    os.makedirs(out, exist_ok=True)
    print('输出目录: ' + out)
    for s in SIZES:
        p = os.path.join(out, 'icon-%dx%d.png' % (s, s))
        make_icon(s).save(p, 'PNG', optimize=True)
        print('  icon-%dx%d.png (%.1f KB)' % (s, s, os.path.getsize(p) / 1024))
    # 192/512 同时承担 maskable：字号缩至 42% 保证留在 80% 安全区
    for s in (192, 512):
        p = os.path.join(out, 'icon-%dx%d.png' % (s, s))
        make_icon(s, 0.42).save(p, 'PNG', optimize=True)
        print('  icon-%dx%d.png [maskable 42%%] (%.1f KB)' % (s, s, os.path.getsize(p) / 1024))
    # iOS 主屏图标（不透明、无透明通道）
    p = os.path.join(out, 'apple-touch-icon.png')
    make_icon(180).save(p, 'PNG', optimize=True)
    print('  apple-touch-icon.png (180x180, %.1f KB)' % (os.path.getsize(p) / 1024))

if __name__ == '__main__':
    main()
