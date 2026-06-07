# Colección de Arenas y Materiales Geológicos

Sitio estático para catalogar y publicar una colección de arenas, sedimentos, suelos, cenizas volcánicas y sales naturales. Pensado para alojarse gratis en **GitHub Pages** y mantenerse editando un único archivo de datos.

El modelo conceptual imita al **IGSN** (identificador único y permanente por muestra + página propia con sus metadatos). Tu sistema de **QR → ficha web** es una versión casera de eso.

---

## Estructura

```
.
├── index.html            ← el sitio completo (catálogo + mapa + ficha + guía de recolección)
├── data/
│   └── muestras.csv       ← LA FUENTE ÚNICA DE VERDAD. Editas esto y el sitio se actualiza.
├── assets/                ← medios de cada muestra, una carpeta por ID
│   └── EC-2026-0001/         (foto.jpg, pano.jpg, macro.jpg, micro.jpg, video.mp4, …)
├── tools/
│   └── generar_qr.py      ← genera un QR por muestra (uso opcional)
└── README.md
```

---

## Publicar en GitHub Pages (gratis)

1. Crea un repositorio nuevo (p. ej. `coleccion-arenas`) y sube estos archivos a la raíz.
2. En el repo: **Settings → Pages**.
3. En *Build and deployment*, fuente **Deploy from a branch**, rama **main** y carpeta **/(root)**. Guarda.
4. A los pocos minutos tu sitio estará en `https://<tu-usuario>.github.io/coleccion-arenas/`.

### Dominio propio (opcional)
Ya tienes dominios. En **Settings → Pages → Custom domain** pon, por ejemplo, `arenas.tudominio.com`, y crea en tu proveedor un registro **CNAME** apuntando a `<tu-usuario>.github.io`. GitHub creará el archivo `CNAME` por ti.

> **Importante:** el sitio debe servirse por HTTP(S) (GitHub Pages ya lo hace). Si abres `index.html` directamente con doble clic (`file://`), el navegador no podrá leer el CSV y se mostrarán los **datos de ejemplo de respaldo**. Para probar en local, usa un servidor simple:
> ```
> python -m http.server 8000
> ```
> y entra a `http://localhost:8000`.

---

## Añadir una muestra nueva

1. Abre `data/muestras.csv` y **añade una fila** (respeta el orden de las columnas).
2. Crea la carpeta `assets/<ID>/` y coloca ahí los medios.
3. En la fila del CSV, escribe las rutas en las columnas `foto`, `pano`, `macro`, `micro`, `video`, por ejemplo: `assets/EC-2026-0002/foto.jpg`.
4. Sube los cambios (commit + push). El sitio se actualiza solo.

Si una muestra **no tiene foto todavía**, deja esas columnas vacías: la ficha mostrará un recuadro con el **color aproximado** (columna `color_hex`).

### Columnas del CSV
`id, nombre, tipo, recoleccion (propia|amigo), recolector, pais, provincia, localidad, lat, lon, datum, incertidumbre_m, altitud_m, ambiente, litologia, fecha, hora, masa_g, color_munsell, color_hex, granulometria, redondez, seleccion, composicion, tratamiento, profundidad, almacenamiento, licencia, foto, pano, macro, micro, video, notas`

Los campos obligatorios para que una muestra sea seria: **id, fecha, lat, lon, datum, altitud_m, pais, localidad, tipo, recolector**. El resto eleva el valor documental.

### Código único (regla)
Permanente, único, nunca reutilizado. Formato recomendado: **PAÍS-AÑO-CONSECUTIVO** (`EC-2026-0001`). El tipo y la localidad viven en el CSV, **no dentro del código**. Depósito inusual: usa sufijo `-A` (`EC-2026-0001-A`). Las muestras de amigos las numeras **tú** al recibirlas; la etiqueta de su bolsa es solo una marca temporal.

---

## Códigos QR

Cada ficha tiene una URL permanente con esta forma:

```
https://tudominio.com/#/m/EC-2026-0001
```

Para generar los QR en lote:

```
pip install "qrcode[pil]"        # una sola vez
# edita BASE dentro de tools/generar_qr.py con tu dominio real
python tools/generar_qr.py
```

Los PNG quedan en `tools/qr/`. Imprímelos en **etiquetas de poliéster** y pégalos en cada frasco, junto con una **etiqueta interna de Tyvek** con el ID escrito a lápiz (por si el QR deja de servir en 30 años).

> **Permanencia:** como las URLs usan el dominio + `#/m/<id>`, los QR ya impresos seguirán funcionando mientras conserves el dominio, aunque cambies de hosting. Si algún día migras a URLs «limpias» (`/m/<id>`), configura una redirección hacia `#/m/<id>` para no romper los QR antiguos.

---

## Notas técnicas

- **Sin paso de compilación.** El sitio lee el CSV en el navegador con **PapaParse** y dibuja el mapa con **Leaflet + OpenStreetMap** (ambos desde CDN). No necesitas Node ni generadores.
- **Respaldo de datos.** `index.html` incluye unos datos semilla por si el CSV no carga; así nunca se ve vacío.
- **Respaldo de archivos (regla 3-2-1):** 3 copias, 2 medios distintos, 1 fuera de casa. Conserva los originales con sus metadatos **EXIF** intactos.
- **Privacidad:** el repositorio es público si usas GitHub Pages gratis. No subas datos que no quieras hacer públicos.
```
