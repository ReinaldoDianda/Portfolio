# -*- coding: utf-8 -*-
"""Icono del instalador de los programas propios (estilo grafito + acento): una
flecha hacia una bandeja. Dibuja a 1024 px y reduce con antialias (sin dientes de
sierra). Salida: instalador.ico junto a este archivo.  python icono_instalador.py"""
import os
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
TILE = (42, 45, 52, 255)       # #2A2D34 grafito
TRACK = (61, 68, 80, 255)      # #3D4450
TEAL = (79, 209, 197, 255)     # #4FD1C5
N = 1024


def dibujar():
    im = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = N * 0.03
    d.rounded_rectangle([m, m, N - m, N - m], radius=N * 0.22, fill=TILE)
    w = N * 0.085
    # bandeja
    y = N * 0.74
    d.line([(N * 0.24, N * 0.58), (N * 0.24, y), (N * 0.76, y), (N * 0.76, N * 0.58)],
           fill=TRACK, width=int(w), joint="curve")
    for x, yy in ((N * 0.24, N * 0.58), (N * 0.76, N * 0.58)):
        d.ellipse([x - w / 2, yy - w / 2, x + w / 2, yy + w / 2], fill=TRACK)
    # flecha
    cx = N / 2
    d.line([(cx, N * 0.20), (cx, N * 0.58)], fill=TEAL, width=int(w))
    d.ellipse([cx - w / 2, N * 0.20 - w / 2, cx + w / 2, N * 0.20 + w / 2], fill=TEAL)
    d.polygon([(cx - N * 0.17, N * 0.45), (cx + N * 0.17, N * 0.45), (cx, N * 0.64)], fill=TEAL)
    return im


if __name__ == "__main__":
    im = dibujar()
    tam = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256]
    base = im.resize((256, 256), Image.LANCZOS)
    base.save(os.path.join(AQUI, "instalador.ico"), sizes=[(t, t) for t in tam], bitmap_format="bmp")
    print("instalador.ico")
