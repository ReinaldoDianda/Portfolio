# -*- coding: utf-8 -*-
r"""
Subtito — Transcriptor de reuniones (v3.0: identidad propia, estilo grafito)
------------------------------------------------------------------------
Interfaz ligera (Tkinter) que transcribe audios a .srt en espanol usando
faster-whisper (large-v3-turbo) en CPU, priorizando el CONSUMO MINIMO:
  * Sin bucles de animacion: el logo es estatico.
  * La UI se actualiza solo cuando el motor reporta progreso.
  * Todo el trabajo pesado corre en un subproceso aparte (subtito_engine.py)
    en el Python del sistema, con el modelo cargado UNA vez en RAM.

Uso: arrastra audios a la ventana (o click en la zona punteada para elegir).
Genera SOLO el .srt junto a cada audio. Si el .srt ya existe, lo salta.

Requisitos en el equipo: Python 3 instalado. La primera vez instala solo
faster-whisper (y descarga el modelo, ~1.6 GB). El arrastrar-y-soltar usa
tkinterdnd2 (el .exe ya lo trae; en modo script se instala con pip).

Config persistente (posicion, tamano, pin, modelo) en subtito_config.json.
Iconos: subtito.ico / subtito.png, generados por la herramienta
marca_grafito.py (el .exe los trae).
"""

import os
import sys
import json
import glob
import time
import math
import zlib
import base64
import struct
import shutil
import threading
import subprocess
from datetime import datetime

try:
    import tkinter as tk
    from tkinter import font as tkfont
    from tkinter import filedialog
except Exception:
    tk = None

import marca_grafito as mg   # graficos con bordes suaves (Pillow)

try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    DND_OK = True
except Exception:
    DND_OK = False

# ----------------------------------------------------------------------------
# CONFIGURACION
# ----------------------------------------------------------------------------
CONFIG_NAME = "subtito_config.json"
ICON_PNG = "subtito.png"
APP_ID = "Grafito.Subtito"
ENGINE_NAME = "subtito_engine.py"

GLOSARIO_NAME = "glosario.txt"

# motor: "whisper" (faster-whisper, usa modelo/beam/batch) o "parakeet"
# (NVIDIA Parakeet TDT 0.6B v3 por onnx-asr). beam 5 = preciso, 1 = rapido.
# agc: normalizar volumen por ventanas (recupera voces lejos del microfono).
# chunk: ventana de whisper en segundos (30 = estandar).
DEFAULTS = {"motor": "whisper", "modelo": "large-v3-turbo", "batch": 8, "beam": 5,
            "agc": True, "chunk": 30}

PAQUETES = {"whisper": ["faster-whisper"], "parakeet": ["onnx-asr[cpu,hub]"],
            "canary": ["onnx-asr[cpu,hub]"]}

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".ogg", ".oga", ".wma", ".aac", ".flac",
             ".opus", ".mp4", ".mkv", ".avi", ".mov", ".webm", ".amr", ".3gp"}

# Colores (estilo grafito + un acento, mismos de Claudio)
BG      = "#1b1d22"
CARD    = "#24272e"
BAR_BG  = "#353941"
ACCENT  = "#4fd1c5"          # verde azulado: acento principal
GREEN   = ACCENT             # progreso y terminado
ORANGE  = ACCENT             # estado normal
RED     = "#f56565"
WHITE   = "#e8eaed"
GREY    = "#9aa0a6"
DIMTXT  = "#c9cdd2"
PILL_BG = "#353941"
HOVER   = "#2a2d34"
TILE    = "#2a2d34"          # fondo del logo

BASE_W = 300
MIN_SCALE, MAX_SCALE = 0.7, 2.0


def app_dir():
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def buscar_archivo(nombre):
    """Busca un archivo de apoyo junto al exe y, si no esta, en la carpeta de
    arriba (el exe vive en dist\\ y los fuentes en la raiz de Subtito)."""
    for d in (app_dir(), os.path.dirname(app_dir())):
        cand = os.path.join(d, nombre)
        if os.path.isfile(cand):
            return cand
    return None


def engine_path():
    # Un subtito_engine.py junto al .exe (o en la carpeta de arriba) manda
    # sobre el embebido: permite actualizar el motor sin recompilar la interfaz.
    externo = buscar_archivo(ENGINE_NAME)
    if externo:
        return externo
    if getattr(sys, "frozen", False):
        base = getattr(sys, "_MEIPASS", app_dir())
        cand = os.path.join(base, ENGINE_NAME)
        if os.path.isfile(cand):
            return cand
    return os.path.join(app_dir(), ENGINE_NAME)


def etiqueta_motor(cfg):
    """Texto corto para la interfaz: 'turbo · beam 5', 'large-v3 · beam 5', 'parakeet'."""
    motor = str(cfg.get("motor", DEFAULTS["motor"]))
    if motor != "whisper":
        return motor
    modelo = str(cfg.get("modelo", DEFAULTS["modelo"]))
    corto = "turbo" if "turbo" in modelo else modelo
    return "%s · beam %s" % (corto, cfg.get("beam", DEFAULTS["beam"]))


def load_config():
    cfg = dict(DEFAULTS)
    try:
        with open(os.path.join(app_dir(), CONFIG_NAME), "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            cfg.update(data)
    except Exception:
        pass
    return cfg


def save_config(cfg):
    try:
        with open(os.path.join(app_dir(), CONFIG_NAME), "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception:
        pass


def motor_exe():
    """[MOD 2026-09-25] Motor ya compilado (motor\\SubtitoMotor.exe junto al exe): trae
    faster-whisper adentro, asi la PC no necesita Python. Lo deja el instalador."""
    cand = os.path.join(app_dir(), "motor", "SubtitoMotor.exe")
    return cand if os.path.isfile(cand) else None


def find_python():
    """Python del sistema para correr el motor (como hacia el .bat)."""
    if not getattr(sys, "frozen", False):
        return sys.executable
    cands = []
    lad = os.environ.get("LocalAppData", "")
    if lad:
        cands += glob.glob(os.path.join(lad, "Programs", "Python",
                                        "Python3*", "python.exe"))
    pf = os.environ.get("ProgramFiles", r"C:\Program Files")
    cands += glob.glob(os.path.join(pf, "Python3*", "python.exe"))
    cands += glob.glob(r"C:\Python3*\python.exe")
    which = shutil.which("python")
    if which:
        cands.append(which)
    for c in cands:
        if c and os.path.isfile(c):
            return c
    return None


def fmt_mmss(secs):
    secs = int(secs)
    if secs >= 3600:
        return "%d:%02d:%02d" % (secs // 3600, (secs % 3600) // 60, secs % 60)
    return "%02d:%02d" % (secs // 60, secs % 60)


# Suavizado del progreso (no afecta la transcripcion, solo la barra/ETA):
#   RTF_SEED = estimacion inicial de segundos de proceso por segundo de audio,
#     mientras no hay ningun dato real (arranca la barra desde el segundo 1).
#   PROGRESS_LEAD = cuanto puede adelantarse la barra estimada por encima del
#     ultimo % real antes de esperar el siguiente bloque (evita que corra a 99%
#     y se quede clavada si la estimacion se queda corta).
RTF_SEED = 0.9
PROGRESS_LEAD = 18.0


def fmt_eta(secs):
    secs = max(0, int(secs))
    if secs < 8:
        return "falta poco"
    if secs < 90:
        return "falta ~%d s" % (int(round(secs / 5.0)) * 5)
    m = int(round(secs / 60.0))
    if m < 60:
        return "faltan ~%d min" % m
    return "faltan ~%dh %02dm" % (m // 60, m % 60)


# ----------------------------------------------------------------------------
# RECURSOS Y LOGO (recuadro de subtitulos en canvas)
# ----------------------------------------------------------------------------
def recurso(nombre):
    """Archivo incluido en el .exe (PyInstaller) o junto al .py."""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, nombre)


class Logo:
    """Estatico: se dibuja solo al crear o reescalar la ventana."""

    def __init__(self, parent, size, bg):
        self.size = size
        self.canvas = tk.Canvas(parent, width=size, height=size, bg=bg,
                                highlightthickness=0)
        self.draw()

    def resize(self, size):
        self.size = size
        self.canvas.config(width=size, height=size)
        self.draw()

    def draw(self, blink=False):
        mg.poner(self.canvas, mg.logo_subtitulos(self.size, ACCENT, TILE))


# ----------------------------------------------------------------------------
# APP
# ----------------------------------------------------------------------------
class Subtito:
    def __init__(self):
        self.cfg = load_config()
        self.scale = max(MIN_SCALE, min(MAX_SCALE, float(self.cfg.get("scale", 1.0))))
        self.topmost = bool(self.cfg.get("topmost", True))

        self.root = TkinterDnD.Tk() if DND_OK else tk.Tk()
        self.root.title("Subtito")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", self.topmost)
        self.root.configure(bg=BG)
        self.root.geometry("+%d+%d" % (int(self.cfg.get("x", 120)),
                                       int(self.cfg.get("y", 120))))
        try:
            self._icon_img = tk.PhotoImage(file=recurso(ICON_PNG))
            self.root.iconphoto(True, self._icon_img)
        except Exception:
            self._icon_img = None

        # Estado del motor / cola
        self.worker = None            # Popen
        self.worker_state = "off"     # off|setup|loading|ready|busy
        self.batch = []               # [{path, status, secs}]  status: pend|cur|done|skip|err
        self.cur_pct = 0
        self.cur_dur = 0.0
        self.cur_elapsed = 0.0
        # Estimador suave del progreso del archivo actual
        self.cur_t0 = 0.0          # reloj al empezar el archivo
        self.cur_pct_real = 0      # ultimo % REAL informado por el motor
        self.cur_disp_pct = 0.0    # % que se muestra (sube de a poco cada seg)
        self.est_total = 0.0       # estimacion de segundos totales de proceso
        self._tick_on = False
        self.last_srt = None
        self._drag = {"x": 0, "y": 0}
        self._grip = {"x": 0, "scale": 1.0}

        self.F = {
            "title": tkfont.Font(family="Segoe UI", size=13, weight="bold"),
            "pct":   tkfont.Font(family="Segoe UI", size=16, weight="bold"),
            "pill":  tkfont.Font(family="Segoe UI", size=8, weight="bold"),
            "small": tkfont.Font(family="Segoe UI", size=8),
            "file":  tkfont.Font(family="Segoe UI", size=9),
            "drop":  tkfont.Font(family="Segoe UI", size=9),
            "status": tkfont.Font(family="Consolas", size=9),
        }

        self._build_ui()
        self._build_menu()
        self._apply_scale()
        self._show_idle(True)

        if DND_OK:
            try:
                self.root.drop_target_register(DND_FILES)
                self.root.dnd_bind("<<Drop>>", self._on_drop)
            except Exception:
                pass

        self.root.after(200, self._windows_extras)
        self.root.protocol("WM_DELETE_WINDOW", self._close)

    # ---------------- UI ----------------
    def _build_ui(self):
        self.card = tk.Frame(self.root, bg=BG, padx=14, pady=12)
        self.card.pack()

        header = tk.Frame(self.card, bg=BG)
        header.pack(fill="x", pady=(0, 8))
        self.header = header
        self.logo = Logo(header, 44, BG)
        self.logo.canvas.pack(side="left")
        self.title_lbl = tk.Label(header, text=" Subtito", fg=WHITE, bg=BG,
                                  font=self.F["title"])
        self.title_lbl.pack(side="left")

        self.btn_close = tk.Canvas(header, width=20, height=20, bg=BG,
                                   highlightthickness=0, cursor="hand2")
        self.btn_close.pack(side="right", padx=(4, 0))
        self.btn_close.bind("<Button-1>", lambda e: self._close())
        self.btn_pin = tk.Canvas(header, width=20, height=20, bg=BG,
                                 highlightthickness=0, cursor="hand2")
        self.btn_pin.pack(side="right", padx=(4, 0))
        self.btn_pin.bind("<Button-1>", lambda e: self._toggle_topmost())
        for b in (self.btn_close, self.btn_pin):
            b.bind("<Enter>", lambda e, w=b: w.config(bg=HOVER))
            b.bind("<Leave>", lambda e, w=b: w.config(bg=BG))

        # Zona de arrastre (visible en reposo)
        self.drop = tk.Label(
            self.card, bg=BG, fg=GREY, font=self.F["drop"], bd=0,
            cursor="hand2", justify="center", pady=16,
            text=("Arrastra aqui tus audios\n(mp3, wav, m4a, ogg...)\n\n"
                  "solo .srt · %s · espanol" % etiqueta_motor(self.cfg)),
            highlightthickness=1, highlightbackground=PILL_BG)
        self.drop.bind("<Button-1>", lambda e: self._browse())

        # Tarjeta ACTUAL
        self.card_cur = tk.Frame(self.card, bg=CARD, padx=10, pady=8)
        self.cur_fname = tk.Label(self.card_cur, text="", fg=DIMTXT, bg=CARD,
                                  font=self.F["file"], anchor="w")
        self.cur_fname.pack(fill="x")
        top1 = tk.Frame(self.card_cur, bg=CARD)
        top1.pack(fill="x")
        self.cur_pct_lbl = tk.Label(top1, text="0%", fg=WHITE, bg=CARD,
                                    font=self.F["pct"])
        self.cur_pct_lbl.pack(side="left")
        tk.Label(top1, text="Actual", fg=WHITE, bg=PILL_BG,
                 font=self.F["pill"], padx=8, pady=2).pack(side="right")
        self.cur_bar = tk.Canvas(self.card_cur, height=8, bg=CARD,
                                 highlightthickness=0)
        self.cur_bar.pack(fill="x", pady=(6, 2))
        sub1 = tk.Frame(self.card_cur, bg=CARD)
        sub1.pack(fill="x")
        self.cur_eta = tk.Label(sub1, text="", fg=GREY, bg=CARD,
                                font=self.F["small"])
        self.cur_eta.pack(side="left")
        self.cur_len = tk.Label(sub1, text="", fg=GREY, bg=CARD,
                                font=self.F["small"])
        self.cur_len.pack(side="right")

        # Tarjeta TOTAL
        self.card_tot = tk.Frame(self.card, bg=CARD, padx=10, pady=8)
        top2 = tk.Frame(self.card_tot, bg=CARD)
        top2.pack(fill="x")
        self.tot_pct_lbl = tk.Label(top2, text="0%", fg=WHITE, bg=CARD,
                                    font=self.F["pct"])
        self.tot_pct_lbl.pack(side="left")
        tk.Label(top2, text="Total", fg=WHITE, bg=PILL_BG,
                 font=self.F["pill"], padx=8, pady=2).pack(side="right")
        self.tot_bar = tk.Canvas(self.card_tot, height=8, bg=CARD,
                                 highlightthickness=0)
        self.tot_bar.pack(fill="x", pady=(6, 2))
        sub2 = tk.Frame(self.card_tot, bg=CARD)
        sub2.pack(fill="x")
        self.tot_idx = tk.Label(sub2, text="", fg=GREY, bg=CARD,
                                font=self.F["small"])
        self.tot_idx.pack(side="left")
        self.tot_info = tk.Label(sub2, text="", fg=GREY, bg=CARD,
                                 font=self.F["small"])
        self.tot_info.pack(side="right")

        # Mini-cola (4 lineas)
        self.qframe = tk.Frame(self.card, bg=BG)
        self.qlines = []
        for _ in range(4):
            l = tk.Label(self.qframe, text="", fg=GREY, bg=BG,
                         font=self.F["small"], anchor="w")
            self.qlines.append(l)    # se muestran al tener texto (_refresh_queue)

        # Pie: estado + grip
        bottom = tk.Frame(self.card, bg=BG)
        bottom.pack(side="bottom", fill="x", pady=(8, 0))
        self.bottom = bottom
        self.status = tk.Label(bottom, text="Listo.", fg=ORANGE, bg=BG,
                               font=self.F["status"], justify="left",
                               anchor="w")
        self.status.pack(side="left", fill="x", expand=True)
        self.grip = tk.Canvas(bottom, width=14, height=14, bg=BG,
                              highlightthickness=0, cursor="sizing")
        self.grip.pack(side="right", anchor="se")
        self.grip.bind("<Button-1>", self._grip_press)
        self.grip.bind("<B1-Motion>", self._grip_drag)
        self.grip.bind("<ButtonRelease-1>", lambda e: self._save_cfg())

        for w in (self.card, header, self.title_lbl, self.logo.canvas,
                  bottom, self.status):
            w.bind("<Button-1>", self._start_move)
            w.bind("<B1-Motion>", self._on_move)
            w.bind("<ButtonRelease-1>", lambda e: self._save_cfg())
            w.bind("<Button-3>", self._show_menu)
        self.root.bind("<Control-MouseWheel>", self._ctrl_wheel)

    def _build_menu(self):
        self.menu = tk.Menu(self.root, tearoff=0)
        self._topmost_var = tk.BooleanVar(value=self.topmost)
        self.menu.add_checkbutton(label="Siempre encima (pin)",
                                  variable=self._topmost_var,
                                  command=self._toggle_topmost_menu)
        self.menu.add_command(label="Agregar audios...", command=self._browse)
        self.menu.add_command(label="Abrir carpeta del ultimo .srt",
                              command=self._open_last)
        self.menu.add_command(label="Tamano 100%",
                              command=lambda: self._set_scale(1.0, save=True))
        self.menu.add_separator()
        self.menu.add_command(label="Cerrar", command=self._close)

    def _show_menu(self, e):
        try:
            self.menu.tk_popup(e.x_root, e.y_root)
        finally:
            self.menu.grab_release()

    def _show_idle(self, idle):
        if idle:
            self.card_cur.pack_forget()
            self.card_tot.pack_forget()
            self.qframe.pack_forget()
            self.drop.pack(fill="x", pady=4, before=self.bottom)
        else:
            self.drop.pack_forget()
            self.card_cur.pack(fill="x", pady=4, before=self.bottom)
            self.card_tot.pack(fill="x", pady=4, before=self.bottom)
            self.qframe.pack(fill="x", pady=(2, 0), before=self.bottom)

    # ---------------- Escalado (identico a Claudio) ----------------
    def S(self, v):
        return max(1, int(round(v * self.scale)))

    def _apply_scale(self):
        self.F["title"].configure(size=self.S(13))
        self.F["pct"].configure(size=self.S(16))
        self.F["pill"].configure(size=self.S(8))
        self.F["small"].configure(size=self.S(8))
        self.F["file"].configure(size=self.S(9))
        self.F["drop"].configure(size=self.S(9))
        self.F["status"].configure(size=self.S(9))
        self.card.config(padx=self.S(14), pady=self.S(12))
        self.logo.resize(self.S(44))
        self.bar_w = self.S(BASE_W - 48)
        self.bar_h = self.S(8)
        for bar in (self.cur_bar, self.tot_bar):
            bar.config(width=self.bar_w, height=self.bar_h)
        self.drop.config(wraplength=self.S(BASE_W - 40))
        b = self.S(20)
        self.btn_close.config(width=b, height=b)
        self.btn_pin.config(width=b, height=b)
        g = self.S(14)
        self.grip.config(width=g, height=g)
        self._draw_pin()
        self._draw_close()
        self._draw_grip()
        self._redraw_bars()

    def _set_scale(self, value, save=False):
        self.scale = max(MIN_SCALE, min(MAX_SCALE, value))
        self._apply_scale()
        if save:
            self._save_cfg()

    def _grip_press(self, e):
        self._grip = {"x": e.x_root, "scale": self.scale}

    def _grip_drag(self, e):
        self._set_scale(self._grip["scale"] + (e.x_root - self._grip["x"]) / 260.0)

    def _ctrl_wheel(self, e):
        self._set_scale(self.scale + (0.08 if e.delta > 0 else -0.08), save=True)

    # ---------------- Dibujo (con bordes suaves, via marca_grafito) ----------------
    def _draw_bar(self, canvas, pct):
        mg.poner(canvas, mg.barra(self.bar_w, self.bar_h, pct, GREEN, BAR_BG))

    def _redraw_bars(self):
        self._draw_bar(self.cur_bar, self.cur_pct)
        self._draw_bar(self.tot_bar, self._total_pct())

    def _draw_pin(self):
        color = ACCENT if self.topmost else GREY
        mg.poner(self.btn_pin, mg.boton_pin(self.S(20), color, self.topmost, GREY))

    def _draw_close(self):
        mg.poner(self.btn_close, mg.boton_cerrar(self.S(20), GREY))

    def _draw_grip(self):
        mg.poner(self.grip, mg.agarre(self.S(14), GREY))

    # ---------------- Ventana ----------------
    def _start_move(self, e):
        self._drag = {"x": e.x_root - self.root.winfo_x(),
                      "y": e.y_root - self.root.winfo_y()}

    def _on_move(self, e):
        self.root.geometry("+%d+%d" % (e.x_root - self._drag["x"],
                                       e.y_root - self._drag["y"]))

    def _toggle_topmost(self):
        self.topmost = not self.topmost
        self._topmost_var.set(self.topmost)
        self.root.attributes("-topmost", self.topmost)
        self._draw_pin()
        self._save_cfg()

    def _toggle_topmost_menu(self):
        self.topmost = bool(self._topmost_var.get())
        self.root.attributes("-topmost", self.topmost)
        self._draw_pin()
        self._save_cfg()

    def _save_cfg(self):
        self.cfg.update({"x": self.root.winfo_x(), "y": self.root.winfo_y(),
                         "scale": round(self.scale, 3),
                         "topmost": self.topmost})
        save_config(self.cfg)

    def _close(self):
        self._save_cfg()
        try:
            if self.worker and self.worker.poll() is None:
                try:
                    self.worker.stdin.write('{"cmd":"quit"}\n')
                    self.worker.stdin.flush()
                except Exception:
                    pass
                self.worker.kill()
        except Exception:
            pass
        self.root.destroy()

    def _windows_extras(self):
        if sys.platform != "win32":
            return
        try:
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_ID)
        except Exception:
            pass
        try:
            import ctypes
            GWL_EXSTYLE = -20
            WS_EX_APPWINDOW = 0x00040000
            WS_EX_TOOLWINDOW = 0x00000080
            hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id())
            style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            ctypes.windll.user32.SetWindowLongW(
                hwnd, GWL_EXSTYLE,
                (style | WS_EX_APPWINDOW) & ~WS_EX_TOOLWINDOW)
            self.root.withdraw()
            self.root.after(20, self._re_show)
        except Exception:
            pass

    def _re_show(self):
        self.root.deiconify()
        self.root.attributes("-topmost", self.topmost)

    # ---------------- Archivos / cola ----------------
    def _browse(self):
        try:
            paths = filedialog.askopenfilenames(
                title="Elige audios para transcribir",
                filetypes=[("Audio/Video", "*.mp3 *.wav *.m4a *.ogg *.wma "
                            "*.aac *.flac *.opus *.mp4 *.mkv *.avi *.mov"),
                           ("Todos", "*.*")])
        except Exception:
            paths = ()
        if paths:
            self._add_files(paths)

    def _on_drop(self, e):
        try:
            paths = self.root.tk.splitlist(e.data)
        except Exception:
            paths = [e.data]
        self._add_files(paths)

    def _add_files(self, paths):
        added = 0
        known = {it["path"] for it in self.batch}
        for p in paths:
            p = p.strip("{}").strip()
            if not p or not os.path.isfile(p) or p in known:
                continue
            ext = os.path.splitext(p)[1].lower()
            if ext == ".srt":
                continue
            if AUDIO_EXT and ext not in AUDIO_EXT:
                # lo aceptamos igual: el motor decidira si puede leerlo
                pass
            self.batch.append({"path": p, "status": "pend", "secs": 0})
            known.add(p)
            added += 1
        if not added:
            return
        self._show_idle(False)
        self._refresh_totals()
        self._refresh_queue()
        self._ensure_worker()

    # ---------------- Motor (worker) ----------------
    def _ensure_worker(self):
        if self.worker_state in ("setup", "loading"):
            return
        if self.worker and self.worker.poll() is None and \
                self.worker_state in ("ready", "busy"):
            if self.worker_state == "ready":
                self._pump_next()
            return
        self.worker_state = "setup"
        self._set_status("Preparando el motor...", GREY)
        threading.Thread(target=self._setup_worker, daemon=True).start()

    def _setup_worker(self):
        flags = 0x08000000 if sys.platform == "win32" else 0  # CREATE_NO_WINDOW
        motor = str(self.cfg.get("motor", DEFAULTS["motor"]))
        # [MOD 2026-09-25] Con el motor compilado (lo deja el instalador) no hace falta
        # Python ni pip. Sin el, como antes: Python del sistema + subtito_engine.py.
        mexe = motor_exe()
        if mexe:
            cmd = [mexe]
        else:
            py = find_python()
            if not py:
                self._after_status("No encuentro Python.\nInstala: winget install "
                                   "Python.Python.3.13", RED)
                self.worker_state = "off"
                return
            eng = engine_path()
            if not os.path.isfile(eng):
                self._after_status("Falta subtito_engine.py", RED)
                self.worker_state = "off"
                return
            cmd = [py, "-u", eng]
        # dependencias (solo la primera vez, solo con el Python del sistema)
        for paq in ([] if mexe else PAQUETES.get(motor, PAQUETES["whisper"])):
            nombre = paq.split("[")[0]
            try:
                rc = subprocess.run([py, "-m", "pip", "show", nombre],
                                    capture_output=True, creationflags=flags).returncode
            except Exception:
                rc = 1
            if rc != 0:
                self._after_status("Instalando motor (primera vez,\npuede tardar unos minutos)...",
                                   ORANGE)
                try:
                    subprocess.run([py, "-m", "pip", "install",
                                    "--disable-pip-version-check", paq],
                                   capture_output=True, creationflags=flags)
                except Exception:
                    pass

        env = dict(os.environ)
        env["PYTHONIOENCODING"] = "utf-8"
        env["SUBTITO_MOTOR"] = motor
        env["SUBTITO_MODELO"] = str(self.cfg.get("modelo", DEFAULTS["modelo"]))
        env["SUBTITO_BATCH"] = str(self.cfg.get("batch", DEFAULTS["batch"]))
        env["SUBTITO_BEAM"] = str(self.cfg.get("beam", DEFAULTS["beam"]))
        env["SUBTITO_GLOSARIO"] = buscar_archivo(GLOSARIO_NAME) or ""
        env["SUBTITO_AGC"] = "1" if self.cfg.get("agc", DEFAULTS["agc"]) else "0"
        env["SUBTITO_CHUNK"] = str(self.cfg.get("chunk", DEFAULTS["chunk"]))
        try:
            # [MOD 2026-09-25] env=env: antes se armaba pero no se pasaba, y el motor
            # corria siempre con sus valores por defecto (sin el glosario de la app).
            self.worker = subprocess.Popen(
                cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL, text=True, encoding="utf-8",
                errors="replace", creationflags=flags, env=env)
        except Exception as e:
            self._after_status("No pude lanzar el motor:\n%s" % str(e)[:60], RED)
            self.worker_state = "off"
            return
        self.worker_state = "loading"
        threading.Thread(target=self._read_worker, daemon=True).start()

    def _read_worker(self):
        proc = self.worker
        try:
            for line in proc.stdout:
                line = line.strip()
                if not line:
                    continue
                try:
                    evt = json.loads(line)
                except Exception:
                    continue
                self.root.after(0, self._on_event, evt)
        except Exception:
            pass
        self.root.after(0, self._on_worker_exit, proc)

    def _on_worker_exit(self, proc):
        if proc is not self.worker:
            return
        if self.worker_state in ("ready", "busy", "loading"):
            self.worker_state = "off"
            pendientes = any(i["status"] in ("pend", "cur") for i in self.batch)
            if pendientes:
                for it in self.batch:
                    if it["status"] == "cur":
                        it["status"] = "err"
                self._set_status("El motor se cerro. Arrastra de\nnuevo para reintentar.", RED)
                self._refresh_queue()

    # ---------------- Eventos del motor ----------------
    def _on_event(self, evt):
        e = evt.get("event")
        if e == "model_loading":
            self._set_status("Cargando modelo %s...\n(1a vez: descarga el modelo)"
                             % etiqueta_motor(self.cfg).split(" ·")[0], ORANGE)
        elif e == "ready":
            self.worker_state = "ready"
            self._pump_next()
        elif e == "fatal":
            self.worker_state = "off"
            self._set_status(evt.get("msg", "Error del motor"), RED)
        elif e == "start":
            self.cur_dur = float(evt.get("duration") or 0)
            self.cur_t0 = time.time()
            # estimacion inicial mientras no hay dato real: dura ~ audio * RTF_SEED
            self.est_total = self.cur_dur * RTF_SEED if self.cur_dur else 0.0
            self.cur_len.config(text="audio %s" % fmt_mmss(self.cur_dur)
                                if self.cur_dur else "")
        elif e == "progress":
            p = int(evt.get("pct", 0))
            el = float(evt.get("elapsed", 0))
            self.cur_elapsed = el
            if p > 1:
                # corrige la estimacion con el ritmo REAL medido (media suave)
                medido = el / (p / 100.0)
                self.est_total = medido if self.est_total <= 0 else \
                    0.5 * self.est_total + 0.5 * medido
            if p > self.cur_pct_real:
                self.cur_pct_real = p
            # deja que el tic mueva la barra; solo adelanta si el real la supero
            if p > self.cur_disp_pct:
                self.cur_disp_pct = float(p)
                self.cur_pct = p
                self.cur_pct_lbl.config(text="%d%%" % p)
                self._refresh_totals()
        elif e == "done":
            secs = float(evt.get("secs", 0))
            self.last_srt = evt.get("srt")
            it = self._current_item()
            if it:
                it["status"] = "done"
                it["secs"] = secs
            self.cur_pct = 100
            self._pump_next()
        elif e == "error":
            it = self._current_item()
            if it:
                it["status"] = "err"
                it["msg"] = evt.get("msg", "")
            self._pump_next()

    def _start_tick(self):
        if not self._tick_on:
            self._tick_on = True
            self.root.after(1000, self._tick_progress)

    def _tick_progress(self):
        # Avanza la barra y el "falta X" cada segundo, estimando el punto entre
        # los datos reales del motor (que llegan de a bloques). No transcribe
        # nada: solo interpola. Cuando llega un dato real, se corrige.
        if self.worker_state == "busy" and self.cur_dur > 0 and self.est_total > 0:
            now_el = time.time() - self.cur_t0
            pred = 100.0 * now_el / self.est_total
            # no baja del ultimo real, no pasa 99% ni se aleja mas de LEAD del real
            techo = min(99.0, self.cur_pct_real + PROGRESS_LEAD)
            disp = min(max(pred, float(self.cur_pct_real)), techo)
            if disp > self.cur_disp_pct + 0.05:
                self.cur_disp_pct = disp
                self.cur_pct = int(disp)
                self.cur_pct_lbl.config(text="%d%%" % int(disp))
                self._refresh_totals()
            self.cur_eta.config(text=fmt_eta(self.est_total - now_el))
        if self._tick_on:
            self.root.after(1000, self._tick_progress)

    def _current_item(self):
        for it in self.batch:
            if it["status"] == "cur":
                return it
        return None

    def _pump_next(self):
        # busca el siguiente pendiente; salta los que ya tienen .srt
        for it in self.batch:
            if it["status"] != "pend":
                continue
            if os.path.isfile(os.path.splitext(it["path"])[0] + ".srt"):
                it["status"] = "skip"
                continue
            it["status"] = "cur"
            self.worker_state = "busy"
            self.cur_pct = 0
            self.cur_dur = 0.0
            # reinicia el estimador para este archivo y arranca el tic
            self.cur_t0 = time.time()
            self.cur_pct_real = 0
            self.cur_disp_pct = 0.0
            self.est_total = 0.0
            self._start_tick()
            self.cur_fname.config(text=os.path.basename(it["path"]))
            self.cur_pct_lbl.config(text="0%")
            self.cur_eta.config(text="analizando...")
            self.cur_len.config(text="")
            self._set_status("Transcribiendo · %s · CPU" % etiqueta_motor(self.cfg), ORANGE)
            self._refresh_totals()
            self._refresh_queue()
            try:
                self.worker.stdin.write(json.dumps(
                    {"cmd": "transcribe", "path": it["path"]},
                    ensure_ascii=False) + "\n")
                self.worker.stdin.flush()
            except Exception:
                it["status"] = "err"
                continue
            return
        # no quedan pendientes
        self.worker_state = "ready" if (self.worker and
                                        self.worker.poll() is None) else "off"
        self._finish_batch()

    def _finish_batch(self):
        done = sum(1 for i in self.batch if i["status"] == "done")
        skip = sum(1 for i in self.batch if i["status"] == "skip")
        err = sum(1 for i in self.batch if i["status"] == "err")
        if not self.batch:
            return
        self._tick_on = False      # detiene el tic de progreso
        self.cur_pct = 0
        parts = ["%d listos" % done]
        if skip:
            parts.append("%d ya tenian .srt" % skip)
        if err:
            parts.append("%d con error" % err)
        self._set_status("✱ Terminado: " + " · ".join(parts),
                         RED if err and not done else GREEN)
        self._refresh_totals(final=True)
        self._refresh_queue()
        # vuelve a mostrar la zona de arrastre; el proximo lote empieza limpio
        self.batch = []
        self.root.after(100, lambda: None)
        self._show_idle(True)

    # ---------------- Indicadores ----------------
    def _total_pct(self):
        n = len(self.batch)
        if not n:
            return 0
        comp = sum(1 for i in self.batch if i["status"] in ("done", "skip", "err"))
        return min(100, (comp + self.cur_pct / 100.0) / n * 100.0)

    def _refresh_totals(self, final=False):
        n = len(self.batch)
        comp = sum(1 for i in self.batch if i["status"] in ("done", "skip", "err"))
        pos = min(n, comp + 1) if not final else n
        tp = 100 if final else int(self._total_pct())
        self.tot_pct_lbl.config(text="%d%%" % tp)
        self.tot_idx.config(text="Archivo %d/%d" % (pos, n) if n else "")
        listos = sum(1 for i in self.batch if i["status"] in ("done", "skip"))
        cola = sum(1 for i in self.batch if i["status"] == "pend")
        self.tot_info.config(text="%d listo%s · %d en cola"
                             % (listos, "" if listos == 1 else "s", cola))
        self._redraw_bars()

    def _refresh_queue(self):
        # ultima terminada, actual, y siguientes; en 4 lineas
        done_items = [i for i in self.batch if i["status"] in ("done", "skip", "err")]
        cur = self._current_item()
        pend = [i for i in self.batch if i["status"] == "pend"]
        lines = []
        if done_items:
            it = done_items[-1]
            if it["status"] == "done":
                lines.append(("✓ %s (%s)" % (os.path.basename(it["path"]),
                                             fmt_mmss(it["secs"])), GREEN))
            elif it["status"] == "skip":
                lines.append(("✓ %s (ya tenia .srt)"
                              % os.path.basename(it["path"]), GREEN))
            else:
                lines.append(("✗ %s" % os.path.basename(it["path"]), RED))
        if cur:
            lines.append(("▶ %s" % os.path.basename(cur["path"]), WHITE))
        for it in pend[:2]:
            lines.append(("· %s" % os.path.basename(it["path"]), GREY))
        extra = len(pend) - 2
        if extra > 0:
            lines.append(("· +%d mas en cola" % extra, GREY))
        # 26-sep-2026: solo ocupan lugar las lineas con texto (antes las 4 quedaban
        # siempre, y con un solo audio dejaban un hueco feo sobre el estado).
        for i, lbl in enumerate(self.qlines):
            if i < len(lines):
                lbl.config(text=lines[i][0], fg=lines[i][1])
                if not lbl.winfo_manager():
                    lbl.pack(fill="x")
            else:
                lbl.config(text="")
                lbl.pack_forget()

    def _set_status(self, text, color=ORANGE):
        self.status.config(text=text, fg=color)

    def _after_status(self, text, color):
        self.root.after(0, self._set_status, text, color)

    def _open_last(self):
        try:
            if self.last_srt and os.path.isfile(self.last_srt):
                subprocess.Popen(["explorer", "/select,",
                                  os.path.normpath(self.last_srt)])
        except Exception:
            pass

    def run(self):
        self.root.mainloop()


# ----------------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------------
def main():
    if tk is None:
        sys.exit("tkinter no esta disponible en este Python.")
    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass
    Subtito().run()


if __name__ == "__main__":
    main()