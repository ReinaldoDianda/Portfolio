#!/usr/bin/env python3
"""
Generador de códigos QR en lote para la Colección de Arenas.

Lee data/muestras.csv y crea un PNG por muestra en tools/qr/,
cada uno apuntando a la URL permanente de su ficha:

    BASE + "#/m/" + id      ->  https://tudominio.com/#/m/EC-2026-0001

USO
----
1) Instala la dependencia (una sola vez):
       pip install "qrcode[pil]"
2) Edita BASE con tu dominio real.
3) Ejecuta desde la raíz del proyecto:
       python tools/generar_qr.py

Imprime los QR en etiquetas de poliéster y pégalos en cada frasco
(además de la etiqueta interna de Tyvek con el ID escrito a lápiz).
"""

import csv
import os
import sys

# >>> EDITA ESTO con tu dominio (incluye la barra final) <<<
BASE = "https://tudominio.com/"

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "muestras.csv")
OUT_DIR  = os.path.join(os.path.dirname(__file__), "qr")


def main():
    try:
        import qrcode
    except ImportError:
        sys.exit('Falta la librería. Instálala con:  pip install "qrcode[pil]"')

    if not os.path.exists(CSV_PATH):
        sys.exit("No encuentro data/muestras.csv. Ejecuta el script desde la raíz del proyecto.")

    os.makedirs(OUT_DIR, exist_ok=True)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        for r in reader:
            sid = (r.get("id") or "").strip()
            if not sid:
                continue
            url = BASE.rstrip("/") + "/#/m/" + sid
            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=2,
            )
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#221b12", back_color="white")
            path = os.path.join(OUT_DIR, "qr_%s.png" % sid)
            img.save(path)
            print("  QR ->", sid, "  (", url, ")")
            count += 1

    print("\nListo: %d códigos generados en %s" % (count, OUT_DIR))
    if BASE.startswith("https://tudominio"):
        print("AVISO: aún no editaste BASE. Cambia 'tudominio.com' por tu dominio real.")


if __name__ == "__main__":
    main()
