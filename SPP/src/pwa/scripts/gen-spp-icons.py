# -*- coding: utf-8 -*-
"""从项目根目录 SPP.jpg 生成 Web/PWA 与 Android 共用的品牌资源。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'SPP.jpg'
WEB = ROOT / 'Web应用'
ANDROID_RES = ROOT / '安卓移动端' / 'android' / 'app' / 'src' / 'main' / 'res'


def fit_square(source: Image.Image, size: int) -> Image.Image:
    image = source.convert('RGB')
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (size, size), '#ffffff')
    canvas.paste(image, ((size - image.width) // 2, (size - image.height) // 2))
    return canvas


def save_png(image: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fit_square(image, size).save(path, 'PNG', optimize=True)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f'未找到品牌源图：{SOURCE}')
    source = Image.open(SOURCE)

    # PWA、登录页、主界面统一使用完整 SPP 图形。
    for size in (48, 72, 96, 144, 152, 167, 180, 192, 512):
        save_png(source, WEB / 'pwa' / 'icons' / f'icon-{size}x{size}.png', size)
    save_png(source, WEB / 'pwa' / 'icons' / 'apple-touch-icon.png', 180)
    fit_square(source, 512).save(WEB / 'pwa' / 'icons' / 'spp-brand.jpg', 'JPEG', quality=95, optimize=True)

    # Capacitor/Android 传统密度图标，保留白底避免启动器裁切时出现黑底。
    density_sizes = {'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192}
    for folder, size in density_sizes.items():
        for name in ('ic_launcher.png', 'ic_launcher_round.png'):
            save_png(source, ANDROID_RES / folder / name, size)

    # 自适应图标前景：覆盖各密度现有 PNG，避免与旧 XML 同名造成资源冲突。
    for folder, size in density_sizes.items():
        save_png(source, ANDROID_RES / folder / 'ic_launcher_foreground.png', size)
    xml_foreground = ANDROID_RES / 'drawable-v24' / 'ic_launcher_foreground.xml'
    if xml_foreground.exists():
        xml_foreground.unlink()
    (ANDROID_RES / 'values' / 'ic_launcher_background.xml').write_text(
        '<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n', encoding='utf-8'
    )

    # 启动画面使用横竖屏浅色底 + 居中品牌图，避免默认白屏与应用图标不一致。
    for folder in ('drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi', 'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi'):
        size = 640 if 'mdpi' in folder else 960 if 'hdpi' in folder else 1280 if 'xhdpi' in folder else 1600 if 'xxhdpi' in folder else 1920
        canvas = Image.new('RGB', (size, size * 2 // 3), '#F8FAFC')
        logo = fit_square(source, max(160, size // 3))
        logo.thumbnail((size // 2, size // 2), Image.Resampling.LANCZOS)
        canvas.paste(logo, ((size - logo.width) // 2, (canvas.height - logo.height) // 2))
        canvas.save(ANDROID_RES / folder / 'splash.png', 'PNG', optimize=True)

    print('已从 SPP.jpg 统一生成 Web/PWA/Android 品牌图标与启动画面')


if __name__ == '__main__':
    main()
