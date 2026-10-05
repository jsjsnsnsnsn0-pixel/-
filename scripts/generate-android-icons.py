"""Generate launcher resources from the repository's original artwork (Pillow)."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
source=Path('resources/totichat-official-icon.jpg')
image=Image.open(source).convert('RGBA')
root=Path('resources/android-launcher')
for density,scale in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
 folder=root/f'mipmap-{density}';folder.mkdir(parents=True,exist_ok=True)
 size=round(48*scale)
 art=ImageOps.contain(image,(round(size*.66),round(size*.66)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(size,size),'#080808');canvas.alpha_composite(art,((size-art.width)//2,(size-art.height)//2));canvas.save(folder/'ic_launcher.png')
 mask=Image.new('L',(size,size),0);ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
 canvas.putalpha(mask);canvas.save(folder/'ic_launcher_round.png')
 # Entire square artwork fits inside the Android 66dp circular safe zone.
 size=round(108*scale);art=ImageOps.contain(image,(round(46*scale),round(46*scale)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(size,size),(0,0,0,0));canvas.alpha_composite(art,((size-art.width)//2,(size-art.height)//2));canvas.save(folder/'ic_launcher_foreground.png')
folder=root/'mipmap-anydpi-v26';folder.mkdir(parents=True,exist_ok=True)
for name in ['ic_launcher','ic_launcher_round']:
 (folder/f'{name}.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/toti_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n')
folder=root/'values';folder.mkdir(parents=True,exist_ok=True)
(folder/'toti_launcher_colors.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="toti_launcher_background">#080808</color></resources>\n')
print('Generated 15 density PNGs and 3 adaptive/color XML resources from',source)
