"""Genera las texturas del mercado como pequeños PNG (2x) en base64 para CSS."""
import base64, io, sys
from PIL import Image

def png(img):
    buf = io.BytesIO(); img.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def stripes(length, bands, vertical):
    """bands: lista de (inicio, fin, (r,g,b,a)) en px CSS; se dibuja a 2x."""
    L = length * 2
    img = Image.new('RGBA', (L, 2) if vertical else (2, L), (0, 0, 0, 0))
    px = img.load()
    for start, end, color in bands:
        for i in range(start * 2, end * 2):
            for j in range(2):
                if vertical: px[i, j] = color
                else: px[j, i] = color
    return png(img)

def grid(size, color):
    L = size * 2
    img = Image.new('RGBA', (L, L), (0, 0, 0, 0))
    px = img.load()
    for i in range(L):
        for k in range(2):
            px[i, k] = color
            px[k, i] = color
    return png(img)

W = lambda a: (255, 255, 255, round(a * 255))
K = lambda a: (0, 0, 0, round(a * 255))
tiles = {
    # Calamina: costillas verticales cada 30px
    'calamina': (stripes(30, [(0, 2, W(0.09)), (9, 11, K(0.12))], True), '30px 1px'),
    # Cortina enrollable: láminas horizontales cada 16px
    'cortina': (stripes(16, [(0, 1, W(0.05)), (13, 15, K(0.22))], False), '1px 16px'),
    # Cerámica: juntas cada 80px
    'ceramica': (grid(80, (34, 26, 27, round(0.045 * 255))), '80px 80px'),
    'ceramica-roja': (grid(80, (227, 27, 35, round(0.45 * 255))), '80px 80px'),
    # Pared de listones del salón de eventos
    'listones': (stripes(26, [(0, 3, W(0.05)), (3, 5, K(0.2))], True), '26px 1px'),
    # Cortina de la intro (láminas más grandes)
    'persiana': (stripes(24, [(0, 2, W(0.1)), (20, 23, K(0.28))], False), '1px 24px'),
}
out = ['/* Archivo generado por scripts: texturas como mosaicos PNG (rápidos de dibujar). */', ':root {']
for name, (uri, size) in tiles.items():
    out.append(f'  --tile-{name}: url("{uri}");')
    out.append(f'  --tile-{name}-size: {size};')
out.append('}')
open(sys.argv[1], 'w').write('\n'.join(out) + '\n')
print('ok', sum(len(u) for u, _ in tiles.values()), 'bytes')
