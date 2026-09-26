# -*- coding: utf-8 -*-
"""
marca_grafito — graficos con bordes suaves para Claudio y Subtito.

El canvas de Tkinter dibuja sin antialias (bordes en dientes de sierra). Aqui
cada grafico se dibuja con Pillow a 4x y se reduce con LANCZOS; el resultado
es una imagen con fondo transparente que se pone en el canvas con poner().
Este archivo es identico en Claudio y Subtito (cada programa lleva su copia
para no depender del otro).
"""
import math
from PIL import Image, ImageDraw, ImageTk

SS = 4  # sobremuestreo


def _rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def _lienzo(w, h):
    im = Image.new("RGBA", (max(1, w) * SS, max(1, h) * SS), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def _foto(im, w, h):
    return ImageTk.PhotoImage(im.resize((max(1, w), max(1, h)), Image.LANCZOS))


def poner(canvas, foto):
    """Reemplaza el contenido del canvas por la imagen (y guarda la referencia)."""
    canvas.delete("all")
    canvas.create_image(0, 0, anchor="nw", image=foto)
    canvas._foto = foto


def _punta(d, x, y, ancho, color):
    r = ancho / 2.0
    d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def _linea(d, x1, y1, x2, y2, color, ancho):
    d.line([(x1, y1), (x2, y2)], fill=color, width=max(1, int(ancho)))
    _punta(d, x1, y1, ancho, color)
    _punta(d, x2, y2, ancho, color)


def _arco(d, cx, cy, r, desde, hasta, color, ancho, puntas=True):
    """Grados en sentido horario desde las 3 (convencion de Pillow)."""
    h = ancho / 2.0
    d.arc([cx - r - h, cy - r - h, cx + r + h, cy + r + h], desde, hasta,
          fill=color, width=max(1, int(ancho)))
    if puntas:
        for g in (desde, hasta):
            a = math.radians(g)
            _punta(d, cx + r * math.cos(a), cy + r * math.sin(a), ancho, color)


def _baldosa(d, n, color):
    m = n * 0.03
    d.rounded_rectangle([m, m, n - m, n - m], radius=n * 0.22, fill=color)


# ---------------------------------------------------------------- logos
def logo_indicador(s, valor, acento, baldosa, pista):
    """Logo de Claudio: arco de 270 grados cuyo relleno es el uso (0..1)."""
    im, d = _lienzo(s, s)
    n = s * SS
    a, t, p = _rgb(acento), _rgb(baldosa), _rgb(pista)
    _baldosa(d, n, t)
    cx, cy, r, w = n / 2.0, n * 0.54, n * 0.30, n * 0.085
    _arco(d, cx, cy, r, 135, 405, p, w)
    v = max(0.0, min(1.0, valor))
    if v > 0.005:
        _arco(d, cx, cy, r, 135, 135 + 270 * v, a, w)
    ang = math.radians(135 + 270 * v)
    _linea(d, cx, cy, cx + r * 0.62 * math.cos(ang), cy + r * 0.62 * math.sin(ang),
           a, n * 0.06)
    _punta(d, cx, cy, n * 0.11, a)
    return _foto(im, s, s)


def logo_subtitulos(s, acento, baldosa):
    """Logo de Subtito: recuadro con dos renglones de subtitulos."""
    im, d = _lienzo(s, s)
    n = s * SS
    a = _rgb(acento)
    _baldosa(d, n, _rgb(baldosa))
    d.rounded_rectangle([n * 0.20, n * 0.27, n * 0.80, n * 0.73], radius=n * 0.09,
                        outline=a, width=max(1, int(n * 0.065)))
    for xa, xb, y in ((0.32, 0.52, 0.45), (0.60, 0.68, 0.45),
                      (0.32, 0.42, 0.58), (0.50, 0.68, 0.58)):
        _linea(d, n * xa, n * y, n * xb, n * y, a, n * 0.07)
    return _foto(im, s, s)


def pastilla(w, h, color, borde=None):
    """Fondo redondeado para botones y avisos (el texto se escribe encima)."""
    im, d = _lienzo(w, h)
    W, H = w * SS, h * SS
    ancho = SS * 1.5 if borde else 0
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=H / 2.0, fill=_rgb(color),
                        outline=_rgb(borde) if borde else None, width=int(ancho))
    return _foto(im, w, h)


def tarjeta(w, h, color, borde=None, radio=10):
    """Fondo de tarjeta con esquinas redondeadas (borde opcional para alertas)."""
    im, d = _lienzo(w, h)
    W, H = w * SS, h * SS
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=radio * SS, fill=_rgb(color),
                        outline=_rgb(borde) if borde else None, width=int(SS * 2) if borde else 0)
    return _foto(im, w, h)


def boton_visto(s, color):
    """Tilde de 'visto'."""
    im, d = _lienzo(s, s)
    n, c = s * SS, _rgb(color)
    w = n * 0.12
    d.line([(n * 0.22, n * 0.52), (n * 0.42, n * 0.72), (n * 0.78, n * 0.30)], fill=c,
           width=int(w), joint="curve")
    _punta(d, n * 0.22, n * 0.52, w, c)
    _punta(d, n * 0.78, n * 0.30, w, c)
    return _foto(im, s, s)


# ---------------------------------------------------------------- barras
def barra(w, h, pct, color, pista):
    im, d = _lienzo(w, h)
    W, H = w * SS, h * SS
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=H / 2.0, fill=_rgb(pista))
    if pct > 0:
        fw = max(H, W * min(100.0, pct) / 100.0)
        d.rounded_rectangle([0, 0, fw - 1, H - 1], radius=H / 2.0, fill=_rgb(color))
    return _foto(im, w, h)


# ---------------------------------------------------------------- botones
def boton_cerrar(s, color):
    im, d = _lienzo(s, s)
    n, c = s * SS, _rgb(color)
    m, w = n * 0.32, n * 0.09
    _linea(d, m, m, n - m, n - m, c, w)
    _linea(d, n - m, m, m, n - m, c, w)
    return _foto(im, s, s)


def boton_actualizar(s, color, giro=0.0):
    im, d = _lienzo(s, s)
    n, c = s * SS, _rgb(color)
    cx = cy = n / 2.0
    r, w = n * 0.30, n * 0.10
    desde = (giro - 40) % 360
    _arco(d, cx, cy, r, desde, desde + 280, c, w, puntas=False)
    a = math.radians(desde + 280)                 # punta de flecha al final
    px, py = cx + r * math.cos(a), cy + r * math.sin(a)
    t = a + math.pi / 2                           # tangente (sentido horario)
    ah = n * 0.17
    d.polygon([(px + math.cos(t) * ah, py + math.sin(t) * ah),
               (px + math.cos(t + 2.4) * ah, py + math.sin(t + 2.4) * ah),
               (px + math.cos(t - 2.4) * ah, py + math.sin(t - 2.4) * ah)], fill=c)
    return _foto(im, s, s)


def boton_pin(s, color, activo, gris):
    im, d = _lienzo(s, s)
    n, c = s * SS, _rgb(color)
    cx, hr, hy = n / 2.0, n * 0.17, n * 0.34
    d.ellipse([cx - hr, hy - hr, cx + hr, hy + hr], fill=c)
    d.polygon([(cx - hr * 0.85, hy + hr * 0.5), (cx + hr * 0.85, hy + hr * 0.5),
               (cx, n * 0.68)], fill=c)
    _linea(d, cx, n * 0.64, cx, n * 0.86, c, n * 0.08)
    if not activo:
        _linea(d, n * 0.20, n * 0.20, n * 0.80, n * 0.80, _rgb(gris), n * 0.08)
    return _foto(im, s, s)


def agarre(s, color):
    im, d = _lienzo(s, s)
    n, c = s * SS, _rgb(color)
    for i in (0.35, 0.60, 0.85):
        _linea(d, n * i, n * 0.92, n * 0.92, n * i, c, n * 0.09)
    return _foto(im, s, s)
