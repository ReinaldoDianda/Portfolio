# Grafito — herramientas para Windows

Un solo instalador, **`Grafito.exe`**, que deja listas en cualquier PC con Windows 10 u 11 estas herramientas, sin
que haga falta instalar Python ni nada antes:

| Herramienta | Qué hace | Dónde queda |
|---|---|---|
| **Claudio** | Widget flotante con el uso de la suscripción de Claude (ventana de 5 horas y semanal), como `/usage` de Claude Code. Si no hay sesión, abre Claude Code para iniciarla | `C:\Claudio` |
| **Subtito** | Arrastras audios (mp3, wav, m4a, ogg…) y deja al lado un `.srt` en español. Transcribe en la PC con faster-whisper; usa un glosario para acertar nombres propios | `C:\Subtito` |
| **Claude Code** (con Git) | El instalador oficial de Claude Code, y Git para Windows si falta (lo usa la app de escritorio de Claude). Deja `claude` en el PATH | `%USERPROFILE%\.local\bin` |

Estilo propio «grafito + un acento» (verde azulado), gráficos con bordes suaves (Pillow a 4x) y ventanas que se ven
nítidas en pantallas escaladas.

## Usar el instalador

1. Doble clic en `Grafito.exe`.
2. Dejar marcado lo que se quiere (lo que ya está dice «ya instalado: se actualiza»).
3. **Instalar**. Si hace falta Git, Windows pide permiso de administrador una sola vez: **Sí**.
4. La barra y el botón («Instalando… 2 de 3») dicen en qué paso va. Al final: **Listo** y accesos en el Escritorio y
   el menú Inicio.

Volver a instalar conserva la configuración de Claudio y de Subtito (y su glosario). La primera vez que Subtito
transcribe baja el modelo de voz (~1,6 GB).

## Armar Grafito.exe desde este código

Requisitos: Windows 10/11, **Python 3.10 o más nuevo** en el PATH (probado con 3.14) e internet.

1. Doble clic en **`CONSTRUIR.bat`**.
2. Espera: instala las librerías de `requirements.txt`, compila Claudio, Subtito y el motor de Subtito con
   PyInstaller (con sus iconos), baja el instalador oficial de Git para Windows y comprueba su firma, y lo junta todo
   en el lanzador.
3. Queda **`salida\Grafito.exe`** (unos 250 MB: lleva el motor de transcripción completo).

Compila en `C:\GrafitoBuild` (ruta corta: PyInstaller falla con rutas de más de 260 caracteres). Opciones:
`construir.ps1 -Git <Git-x.y.z-64-bit.exe>` usa un instalador de Git ya bajado; `-SinPip` no toca las librerías.

## Contenido

| Carpeta o archivo | Qué es |
|---|---|
| `claudio\claudio.py` | Claudio (Tkinter). Lee la sesión de Claude Code de la PC; no guarda ningún token |
| `subtito\subtito.py`, `subtito\subtito_engine.py` | Subtito: la ventana y el motor (faster-whisper) que corre aparte |
| `subtito\glosario.txt` | Glosario de ejemplo: cámbialo por tus nombres y términos |
| `*\marca_grafito.py` | Los gráficos con bordes suaves (logos, barras, botones) |
| `instalador\instalar.ps1` | La ventana de Grafito (PowerShell + WinForms): casillas, progreso, registro |
| `instalador\admin.ps1` | Lo único que corre como administrador: Git para Windows |
| `instalador\lanzador.cs` + `lanzador.manifest` | El `Grafito.exe`: trae todo adentro, lo saca a una carpeta temporal y abre la ventana |
| `construir.ps1`, `CONSTRUIR.bat`, `requirements.txt` | Arman `Grafito.exe` desde cero |

## Pruebas del instalador (sin tocar la PC)

```
powershell -ExecutionPolicy Bypass -File instalador\instalar.ps1 -SinVentana -SinAdmin -SinClaude -Solo claudio,subtito -DirClaudio C:\Prueba\Claudio -DirSubtito C:\Prueba\Subtito -Escritorio C:\Prueba\Escritorio -MenuInicio C:\Prueba\Inicio
```

(`-Captura foto.png` guarda una foto de la ventana; con `-Demo`, a mitad de instalar.)

Nota: Claudio usa endpoints no documentados de la API de Anthropic para leer el uso; puede dejar de funcionar si
cambian.
