# -*- coding: utf-8 -*-
r"""
Claudio — widget de uso de la suscripcion para Windows — v3.2
-----------------------------------------------------------------
CAMBIOS v3.2 (26-sep-2026):
  * Busca claude.exe por su ruta (~\.local\bin, PATH, npm) en lugar de confiar en el
    PATH: en una PC recien instalada 'claude' no se reconocia y la consola de inicio de
    sesion abria con error. Si Claude Code no esta, lo dice.
  * Ya no renueva el token por su cuenta cuando Claude Code esta instalado: se lo pide
    a Claude Code ("claude -p ok", oculto). Antes Claudio y Claude Code rotaban el mismo
    token de renovacion por separado y uno podia dejar al otro sin sesion.
-----------------------------------------------------------------
CAMBIOS v3.1 (22-sep-2026):
  * La sesion se renueva SOLA y oculta: si vence, corre "claude -p ok" en segundo
    plano (modo no interactivo: no muestra la pregunta de confianza de la carpeta)
    y vuelve a consultar. Como mucho una vez cada 10 minutos. La consola de inicio
    de sesion solo se abre si nunca se inicio sesion (eso exige el navegador).
-----------------------------------------------------------------
CAMBIOS v3.0 (21-sep-2026):
  * Identidad propia: estilo "grafito + un acento" (verde azulado). Se quito
    la mascota y el naranja de la marca Claude. El logo es un indicador cuyo
    arco muestra el mayor uso actual; se vuelve ambar desde 85 %.
  * Iconos: claudio.ico / claudio.png, generados por la herramienta
    marca_grafito.py (el .exe los trae).
  * Incluye lo que hacia Preclaudio.bat: si no hay sesion (sin credenciales,
    sesion vencida o 401) abre Claude Code en una consola para iniciar sesion,
    una vez por ejecucion. Tambien en el menu: "Iniciar sesion en Claude Code".
  * El ejecutable pasa a llamarse Claudio.exe.
-----------------------------------------------------------------
CAMBIOS v2.1 (respecto a v2):
  * FIX 429: si falla el refresh del token OAuth, se espera 10 min antes de
    reintentarlo (antes se reintentaba en CADA consulta y en cada clic del
    boton, lo que martillaba el endpoint y alargaba el rate limit todo el
    dia). Tras un 429 el widget espera 5/10/20/30 min (backoff, respetando
    Retry-After) en lugar de insistir cada 60 s.
  * Refresh manual con debounce (min. 10 s entre clics).
  * Instancia unica: si ya hay un ClaudeUsage abierto, el segundo se cierra.
  * CPU ~0% en reposo: se elimino el bucle de animacion de 30 fps. La
    mascota es estatica y solo parpadea (2 redibujos cada ~4 s); gira
    unicamente durante la consulta (~1 s por minuto); las barras se animan
    solo cuando el valor cambia y la animacion se detiene sola.
-----------------------------------------------
Muestra el uso de la suscripcion de Claude (ventana de 5h "Actual" y semanal)
en tiempo real, igual que /usage de Claude Code. Auto-refresca el token OAuth.

NOVEDADES v2:
  * Mascota animada con el logo de Claude (parpadea, flota, gira sus rayos;
    se emociona mientras consulta y se preocupa si el uso es alto).
  * La mascota tambien es el ICONO de la app (barra de tareas y .exe).
    -> El .bat genera claude_mascot.ico con:  python claude_usage_widget.py --make-icon
  * Boton de refresh manual (flechita circular) que gira mientras consulta.
  * Barras y porcentajes con animacion suave (easing) y color progresivo
    verde -> ambar -> rojo segun el uso.
  * Ventana reescalable: arrastra la esquina inferior derecha (o Ctrl+rueda).
  * "Siempre encima" configurable: boton de pin en el header o menu de
    click-derecho. El estado (posicion, tamano, pin) se guarda en
    claude_usage_config.json junto al ejecutable.
  * La actualizacion automatica cada 60 s YA existia en v1 y se mantiene.

DE DONDE SACA EL TOKEN (en este orden):
  1. MANUAL_TOKEN (abajo), si lo pegas ahi.
  2. %USERPROFILE%\.claude\.credentials.json (login interactivo de Claude
     Code) -> lee accessToken + refreshToken y REFRESCA solo al expirar.
  3. Un archivo "token.txt" al lado del programa.
  4. La variable de entorno CLAUDE_CODE_OAUTH_TOKEN.

IMPORTANTE: el token debe venir del LOGIN INTERACTIVO (corre "claude" y haz
login en el navegador). El de "claude setup-token" NO sirve (solo scope
user:inference; este endpoint exige user:profile -> 403).

Nota: usa endpoints no documentados (beta) de Anthropic. Puede romperse sin
aviso si Anthropic cambia el header de version o el client_id.
"""

import os
import sys
import json
import glob
import time
import math
import zlib
import base64
import random
import struct
import threading
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone

try:
    import tkinter as tk
    from tkinter import font as tkfont
except Exception:
    tk = None
    tkfont = None

import marca_grafito as mg   # graficos con bordes suaves (Pillow)

# ----------------------------------------------------------------------------
# CONFIGURACION
# ----------------------------------------------------------------------------
USAGE_URL = "https://api.anthropic.com/api/oauth/usage"
TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
# client_id publico de Claude Code (identifica la app, no a ti):
OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
BETA_HEADER = "oauth-2025-04-20"
USER_AGENT = "claude-code/2.1.228 (external)"
POLL_SECONDS = 60            # actualizacion automatica (igual que v1)
REFRESH_MARGIN_MS = 120000   # refresca token si faltan <2 min para expirar

# v2.1 — proteccion contra rate limit (429):
REFRESH_FAIL_COOLDOWN = 600  # si falla el refresh del token, no reintentar por 10 min
BACKOFF_BASE = 300           # tras un 429, esperar 5 min (y duplicar)
BACKOFF_MAX = 1800           # tope de espera: 30 min
MANUAL_MIN_S = 10            # minimo entre refresh manuales
_REFRESH_WAIT = {"until": 0.0, "tok": None}
_TOKEN_STATE = {"expired": False}   # el token del archivo ya vencio y no refresca

MANUAL_TOKEN = ""

CONFIG_NAME = "claude_usage_config.json"
ICON_PNG = "claudio.png"
APP_ID = "Grafito.Claudio"

# Colores (estilo grafito + un acento, igual que Subtito)
BG      = "#1b1d22"
CARD    = "#24272e"
BAR_BG  = "#353941"
ACCENT  = "#4fd1c5"          # verde azulado: acento principal
GREEN   = ACCENT             # uso bajo
AMBER   = "#f6ad55"
RED     = "#f56565"
ORANGE  = AMBER              # avisos y errores
WHITE   = "#e8eaed"
GREY    = "#9aa0a6"
PILL_BG = "#353941"
HOVER   = "#2a2d34"
TILE    = "#2a2d34"          # fondo del logo
TRACK   = "#3d4450"          # pista apagada del indicador

BASE_W = 300                 # ancho logico de referencia (escala 1.0)
MIN_SCALE, MAX_SCALE = 0.7, 2.0


def app_dir():
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


# ----------------------------------------------------------------------------
# CONFIG PERSISTENTE (posicion, escala, pin)
# ----------------------------------------------------------------------------
def load_config():
    try:
        with open(os.path.join(app_dir(), CONFIG_NAME), "r", encoding="utf-8") as f:
            cfg = json.load(f)
        return cfg if isinstance(cfg, dict) else {}
    except Exception:
        return {}


def save_config(cfg):
    try:
        with open(os.path.join(app_dir(), CONFIG_NAME), "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception:
        pass


# ----------------------------------------------------------------------------
# CREDENCIALES (archivo de Claude Code, con auto-refresh) — igual que v1
# ----------------------------------------------------------------------------
def _credentials_path():
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(home, ".claude", ".credentials.json"),
        os.path.join(home, ".config", "claude", ".credentials.json"),
        os.path.join(os.environ.get("APPDATA", ""), "Claude", ".credentials.json"),
    ]
    candidates += glob.glob(os.path.join(home, ".claude", "*credential*"))
    for path in dict.fromkeys(candidates):
        if path and os.path.isfile(path):
            return path
    return None


def _refresh(refresh_token):
    """Pide un accessToken nuevo con el refreshToken. Devuelve dict o None."""
    body = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": OAUTH_CLIENT_ID,
    }).encode("utf-8")
    req = urllib.request.Request(TOKEN_URL, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", USER_AGENT)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def _token_from_credentials():
    """Lee (y refresca si hace falta) el token del archivo de Claude Code."""
    path = _credentials_path()
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    oauth = data.get("claudeAiOauth")
    if not oauth or not oauth.get("accessToken"):
        return None

    now_ms = int(time.time() * 1000)
    expires_at = int(oauth.get("expiresAt", 0) or 0)
    refresh_tok = oauth.get("refreshToken")
    # v3.2: con Claude Code instalado, la renovacion la hace el (renovar_sesion_claude);
    # renovar aqui tambien rotaba el mismo token y podia dejar a uno de los dos sin sesion.
    if _claude_exe():
        refresh_tok = None

    # Si el archivo trae un refresh token DISTINTO al que fallo (p. ej.
    # acabas de reloguearte con 'claude'), se ignora el cooldown y se
    # reintenta de inmediato.
    if (refresh_tok and now_ms >= expires_at - REFRESH_MARGIN_MS
            and (time.time() >= _REFRESH_WAIT["until"]
                 or refresh_tok != _REFRESH_WAIT.get("tok"))):
        new = _refresh(refresh_tok)
        if new and new.get("access_token"):
            _REFRESH_WAIT["until"] = 0.0
            _REFRESH_WAIT["tok"] = None
            oauth["accessToken"] = new["access_token"]
            if new.get("refresh_token"):        # el refresh token puede rotar
                oauth["refreshToken"] = new["refresh_token"]
            if new.get("expires_in"):
                oauth["expiresAt"] = now_ms + int(new["expires_in"]) * 1000
            data["claudeAiOauth"] = oauth
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
            except Exception:
                pass  # si no puede escribir, usamos el token nuevo en memoria
        else:
            # Fallo el refresh: NO reintentar en cada consulta (eso martilla
            # el endpoint de tokens y provoca 429 en cadena). Se reintenta
            # en 10 min; mientras tanto usamos el accessToken guardado.
            _REFRESH_WAIT["until"] = time.time() + REFRESH_FAIL_COOLDOWN
            _REFRESH_WAIT["tok"] = refresh_tok

    # Si a estas alturas el token sigue vencido, marcarlo: consultar la API
    # con un token muerto solo genera 401/429 y alarga el bloqueo.
    _TOKEN_STATE["expired"] = int(oauth.get("expiresAt", 0) or 0) <= int(time.time() * 1000)

    return oauth["accessToken"]


def resolve_token():
    _TOKEN_STATE["expired"] = False
    if MANUAL_TOKEN.strip():
        return MANUAL_TOKEN.strip()

    tok = _token_from_credentials()
    if tok:
        return tok

    txt = os.path.join(app_dir(), "token.txt")
    if os.path.isfile(txt):
        try:
            with open(txt, "r", encoding="utf-8-sig") as f:
                val = f.read().strip()
            if val.lower().startswith("export") and "=" in val:
                val = val.split("=", 1)[1]
            val = val.strip().strip('"').strip("'").strip()
            if val:
                return val
        except Exception:
            pass

    env = os.environ.get("CLAUDE_CODE_OAUTH_TOKEN", "").strip()
    if env:
        return env
    return None


# ----------------------------------------------------------------------------
# LLAMADA AL ENDPOINT DE USO — igual que v1
# ----------------------------------------------------------------------------
def fetch_usage():
    token = resolve_token()
    if not token:
        return {"ok": False, "error": "No hay credenciales.\nCorre 'claude' y haz login\nen el navegador."}
    if _TOKEN_STATE.get("expired"):
        # Token muerto y el refresh no funciona: NO llamar a la API (solo
        # daria 401/429 y alargaria el bloqueo). Al reloguearte con
        # 'claude', el widget lo detecta solo al releer el archivo.
        return {"ok": False, "auth_dead": True,
                "error": "Sesion vencida y el refresh\nno responde. Corre 'claude',\nhaz login y listo."}

    req = urllib.request.Request(USAGE_URL, method="GET")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("anthropic-beta", BETA_HEADER)
    req.add_header("User-Agent", USER_AGENT)
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        session = {"utilization": 0, "resets_at": None}
        weekly = {"utilization": 0, "resets_at": None}
        for lim in (data.get("limits") or []):
            if lim.get("kind") == "session":
                session = {"utilization": lim.get("percent", 0),
                           "resets_at": lim.get("resets_at")}
            elif lim.get("kind") == "weekly_all":
                weekly = {"utilization": lim.get("percent", 0),
                          "resets_at": lim.get("resets_at")}

        if not (data.get("limits")):
            session = data.get("five_hour") or {}
            weekly = data.get("seven_day") or {}

        return {"ok": True, "five_hour": session, "seven_day": weekly}
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return {"ok": False, "error": "401: sesion expirada.\nCorre 'claude' y haz\nlogin de nuevo."}
        if e.code == 403:
            return {"ok": False, "error": "403: token sin scope.\nUsa login interactivo,\nno 'setup-token'."}
        if e.code == 429:
            retry = 0
            try:
                retry = int(e.headers.get("Retry-After") or 0)
            except Exception:
                retry = 0
            return {"ok": False, "rate_limited": True, "retry_after": retry,
                    "error": "429: limite de peticiones."}
        return {"ok": False, "error": "HTTP %s" % e.code}
    except Exception as e:
        return {"ok": False, "error": "Sin conexion:\n%s" % str(e)[:40]}


# ----------------------------------------------------------------------------
# FORMATO Y COLOR
# ----------------------------------------------------------------------------
def format_reset(iso_str):
    if not iso_str:
        return ""
    try:
        s = iso_str.replace("Z", "+00:00")
        target = datetime.fromisoformat(s)
        if target.tzinfo is None:
            target = target.replace(tzinfo=timezone.utc)
        secs = int((target - datetime.now(timezone.utc)).total_seconds())
        if secs <= 0:
            return "ahora"
        d, h, m = secs // 86400, (secs % 86400) // 3600, (secs % 3600) // 60
        if d > 0:
            return "%dd %dh" % (d, h)
        if h > 0:
            return "%dh %dm" % (h, m)
        return "%dm" % m
    except Exception:
        return ""


def pct(util):
    # el endpoint manda utilization YA en porcentaje (4.0 = 4%), no en fraccion
    try:
        return max(0, min(100, float(util)))
    except Exception:
        return 0.0


def _hex_to_rgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def _rgb_to_hex(rgb):
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(v)))) for v in rgb)


def lerp_color(c1, c2, t):
    a, b = _hex_to_rgb(c1), _hex_to_rgb(c2)
    return _rgb_to_hex(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))


def usage_color(p):
    """verde -> ambar -> rojo de forma continua segun el porcentaje."""
    if p < 50:
        return GREEN
    if p < 80:
        return lerp_color(GREEN, AMBER, (p - 50) / 30.0)
    return lerp_color(AMBER, RED, min(1.0, (p - 80) / 20.0))


# ----------------------------------------------------------------------------
# RECURSOS E INICIO DE SESION (lo que antes hacia Preclaudio.bat)
# ----------------------------------------------------------------------------
def recurso(nombre):
    """Archivo incluido en el .exe (PyInstaller) o junto al .py."""
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, nombre)


def _claude_exe():
    """Ruta de Claude Code, o None si no esta. v3.2: no depende del PATH (el instalador
    oficial no siempre lo agrega y una consola con 'claude' fallaba)."""
    import shutil
    home = os.path.expanduser("~")
    for c in (os.path.join(home, ".local", "bin", "claude.exe"),
              shutil.which("claude"),
              os.path.join(os.environ.get("APPDATA", ""), "npm", "claude.cmd")):
        if c and os.path.isfile(c):
            return c
    return None


def renovar_sesion_claude():
    """v3.1: renueva la sesion SIN intervencion: corre Claude Code en modo no interactivo
    (-p), oculto, que refresca el token y no muestra la pregunta de confianza de la carpeta.
    Gasta una consulta minima. Devuelve True si termino bien."""
    exe = _claude_exe()
    if not exe:
        return False
    try:
        import subprocess
        r = subprocess.run([exe, "-p", "ok"], cwd=os.path.expanduser("~"),
                           capture_output=True, timeout=120,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return r.returncode == 0
    except Exception:
        return False


def abrir_login_claude():
    """Inicio de sesion interactivo (solo si nunca se inicio: pide el navegador).
    v3.2: abre claude.exe por su ruta en una consola propia; False si no esta instalado."""
    exe = _claude_exe()
    if not exe:
        return False
    try:
        import subprocess
        cmd = ["cmd.exe", "/k", exe] if exe.lower().endswith(".cmd") else [exe]
        subprocess.Popen(cmd, cwd=os.path.expanduser("~"),
                         creationflags=getattr(subprocess, "CREATE_NEW_CONSOLE", 0))
        return True
    except Exception:
        return False


# ----------------------------------------------------------------------------
# LOGO (indicador en canvas): el arco muestra el mayor uso actual
# ----------------------------------------------------------------------------
class Logo:
    """Estatico en reposo; la aguja barre solo mientras se consulta la API."""

    def __init__(self, parent, size, bg):
        self.size = size
        self.bg = bg
        self.canvas = tk.Canvas(parent, width=size, height=size, bg=bg,
                                highlightthickness=0)
        self.value = 0.0            # 0..1, mayor uso actual
        self.sweep = None           # angulo de la aguja durante la consulta
        self.excited = False
        self.worried = False
        self.draw()

    def resize(self, size):
        self.size = size
        self.canvas.config(width=size, height=size)
        self.draw()

    def tick_busy(self):
        self.sweep = ((self.sweep or 0.0) + 0.08) % 1.0
        self.draw()

    def draw(self, blink=False):
        if not self.excited:
            self.sweep = None
        v = self.sweep if self.sweep is not None else self.value
        acc = AMBER if self.worried else ACCENT
        mg.poner(self.canvas, mg.logo_indicador(self.size, v, acc, TILE, TRACK))


# ----------------------------------------------------------------------------
# WIDGET PRINCIPAL
# ----------------------------------------------------------------------------
class UsageWidget:
    def __init__(self):
        self.cfg = load_config()
        self.scale = max(MIN_SCALE, min(MAX_SCALE, float(self.cfg.get("scale", 1.0))))
        self.topmost = bool(self.cfg.get("topmost", True))

        self.root = tk.Tk()
        self.root.title("Claudio")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", self.topmost)
        self.root.attributes("-alpha", 0.0)   # fade-in
        self.root.configure(bg=BG)
        x = int(self.cfg.get("x", 80))
        y = int(self.cfg.get("y", 80))
        self.root.geometry("+%d+%d" % (x, y))

        # Icono de la app para la barra de tareas (claudio.png, incluido en el .exe)
        try:
            self._icon_img = tk.PhotoImage(file=recurso(ICON_PNG))
            self.root.iconphoto(True, self._icon_img)
        except Exception:
            self._icon_img = None

        self._drag = {"x": 0, "y": 0}
        self._grip = {"x": 0, "scale": 1.0}
        self._fetching = False
        self._spin = 0.0
        self._wake = threading.Event()
        self._anim_on = False       # animacion de barras: solo mientras cambian
        self._busy_on = False       # giro del refresh: solo durante la consulta
        self._last_manual = 0.0     # debounce del refresh manual
        self._fail429 = 0           # 429 consecutivos (para backoff)
        self._login_abierto = False # ya se abrio Claude Code para iniciar sesion
        self._ultima_renovacion = 0.0  # v3.1: renovacion automatica, como mucho cada 10 min

        # Fuentes escalables
        self.F = {
            "title":  tkfont.Font(family="Segoe UI", size=13, weight="bold"),
            "pct":    tkfont.Font(family="Segoe UI", size=16, weight="bold"),
            "pill":   tkfont.Font(family="Segoe UI", size=8, weight="bold"),
            "small":  tkfont.Font(family="Segoe UI", size=8),
            "status": tkfont.Font(family="Consolas", size=9),
        }

        self._build_ui()
        self._build_menu()
        self._apply_scale()

        self.root.after(30, self._fade_in)
        self.root.after(200, self._windows_extras)
        self._start_polling()

    # ---------------- UI ----------------
    def _build_ui(self):
        self.card = tk.Frame(self.root, bg=BG, padx=14, pady=12)
        self.card.pack()

        header = tk.Frame(self.card, bg=BG)
        header.pack(fill="x", pady=(0, 8))
        self.header = header

        self.logo = Logo(header, 44, BG)
        self.logo.canvas.pack(side="left")

        self.title_lbl = tk.Label(header, text=" Claudio", fg=WHITE, bg=BG,
                                  font=self.F["title"])
        self.title_lbl.pack(side="left")

        # Botones del header (derecha): cerrar, refresh, pin
        self.btn_close = tk.Canvas(header, width=20, height=20, bg=BG,
                                   highlightthickness=0, cursor="hand2")
        self.btn_close.pack(side="right", padx=(4, 0))
        self.btn_close.bind("<Button-1>", lambda e: self._close())

        self.btn_refresh = tk.Canvas(header, width=20, height=20, bg=BG,
                                     highlightthickness=0, cursor="hand2")
        self.btn_refresh.pack(side="right", padx=(4, 0))
        self.btn_refresh.bind("<Button-1>", lambda e: self._manual_refresh())

        self.btn_pin = tk.Canvas(header, width=20, height=20, bg=BG,
                                 highlightthickness=0, cursor="hand2")
        self.btn_pin.pack(side="right", padx=(4, 0))
        self.btn_pin.bind("<Button-1>", lambda e: self._toggle_topmost())

        for b in (self.btn_close, self.btn_refresh, self.btn_pin):
            b.bind("<Enter>", lambda e, w=b: w.config(bg=HOVER))
            b.bind("<Leave>", lambda e, w=b: w.config(bg=BG))

        self.row_5h = self._make_row("Actual")
        self.row_7d = self._make_row("Semanal")

        bottom = tk.Frame(self.card, bg=BG)
        bottom.pack(fill="x", pady=(8, 0))
        self.bottom = bottom
        self.status = tk.Label(bottom, text="Cargando...", fg=GREY, bg=BG,
                               font=self.F["status"], justify="left")
        self.status.pack(side="left", anchor="w")

        # Grip de reescalado (esquina inferior derecha)
        self.grip = tk.Canvas(bottom, width=14, height=14, bg=BG,
                              highlightthickness=0, cursor="sizing")
        self.grip.pack(side="right", anchor="se")
        self.grip.bind("<Button-1>", self._grip_press)
        self.grip.bind("<B1-Motion>", self._grip_drag)
        self.grip.bind("<ButtonRelease-1>", lambda e: self._save_cfg())

        # Arrastre de ventana + menu contextual
        for w in (self.card, header, self.title_lbl, self.logo.canvas,
                  bottom, self.status):
            w.bind("<Button-1>", self._start_move)
            w.bind("<B1-Motion>", self._on_move)
            w.bind("<ButtonRelease-1>", lambda e: self._save_cfg())
            w.bind("<Button-3>", self._show_menu)

        # Ctrl+rueda = zoom
        self.root.bind("<Control-MouseWheel>", self._ctrl_wheel)

    def _make_row(self, label):
        frame = tk.Frame(self.card, bg=CARD, padx=10, pady=8)
        frame.pack(fill="x", pady=4)
        top = tk.Frame(frame, bg=CARD)
        top.pack(fill="x")
        pct_lbl = tk.Label(top, text="--%", fg=WHITE, bg=CARD,
                           font=self.F["pct"])
        pct_lbl.pack(side="left")
        pill = tk.Label(top, text=label, fg=WHITE, bg=PILL_BG,
                        font=self.F["pill"], padx=8, pady=2)
        pill.pack(side="right")
        canvas = tk.Canvas(frame, width=BASE_W - 48, height=8, bg=CARD,
                           highlightthickness=0)
        canvas.pack(fill="x", pady=(6, 2))
        reset_lbl = tk.Label(frame, text="", fg=GREY, bg=CARD,
                             font=self.F["small"])
        reset_lbl.pack(anchor="w")
        for w in (frame, top, pill, reset_lbl):
            w.bind("<Button-1>", self._start_move)
            w.bind("<B1-Motion>", self._on_move)
            w.bind("<ButtonRelease-1>", lambda e: self._save_cfg())
            w.bind("<Button-3>", self._show_menu)
        return {"frame": frame, "pct": pct_lbl, "canvas": canvas,
                "reset": reset_lbl, "cur": 0.0, "target": 0.0, "shown": -1}

    def _build_menu(self):
        self.menu = tk.Menu(self.root, tearoff=0)
        self._topmost_var = tk.BooleanVar(value=self.topmost)
        self.menu.add_checkbutton(label="Siempre encima (pin)",
                                  variable=self._topmost_var,
                                  command=self._toggle_topmost_menu)
        self.menu.add_command(label="Actualizar ahora",
                              command=self._manual_refresh)
        self.menu.add_command(label="Iniciar sesion en Claude Code",
                              command=abrir_login_claude)
        self.menu.add_command(label="Tamano 100%",
                              command=lambda: self._set_scale(1.0, save=True))
        self.menu.add_separator()
        self.menu.add_command(label="Cerrar", command=self._close)

    def _show_menu(self, e):
        try:
            self.menu.tk_popup(e.x_root, e.y_root)
        finally:
            self.menu.grab_release()

    # ---------------- Escalado ----------------
    def S(self, v):
        return max(1, int(round(v * self.scale)))

    def _apply_scale(self):
        s = self.scale
        self.F["title"].configure(size=self.S(13))
        self.F["pct"].configure(size=self.S(16))
        self.F["pill"].configure(size=self.S(8))
        self.F["small"].configure(size=self.S(8))
        self.F["status"].configure(size=self.S(9))

        self.card.config(padx=self.S(14), pady=self.S(12))
        self.logo.resize(self.S(44))

        self.bar_w = self.S(BASE_W - 48)
        self.bar_h = self.S(8)
        for row in (self.row_5h, self.row_7d):
            row["frame"].config(padx=self.S(10), pady=self.S(8))
            row["canvas"].config(width=self.bar_w, height=self.bar_h)
            row["shown"] = -1          # fuerza redibujo
            self._draw_bar(row)
            self._set_row_text(row)

        b = self.S(20)
        for w in (self.btn_close, self.btn_refresh, self.btn_pin):
            w.config(width=b, height=b)
        g = self.S(14)
        self.grip.config(width=g, height=g)

        self._draw_buttons()
        self._draw_grip()

    def _set_scale(self, value, save=False):
        self.scale = max(MIN_SCALE, min(MAX_SCALE, value))
        self._apply_scale()
        if save:
            self._save_cfg()

    def _grip_press(self, e):
        self._grip["x"] = e.x_root
        self._grip["scale"] = self.scale

    def _grip_drag(self, e):
        delta = (e.x_root - self._grip["x"]) / 260.0
        self._set_scale(self._grip["scale"] + delta)

    def _ctrl_wheel(self, e):
        step = 0.08 if e.delta > 0 else -0.08
        self._set_scale(self.scale + step, save=True)

    # ---------------- Dibujo (con bordes suaves, via marca_grafito) ----------------
    def _draw_bar(self, row):
        p = row["cur"]
        if abs(p - row["shown"]) < 0.15 and row["shown"] >= 0:
            return
        row["shown"] = p
        mg.poner(row["canvas"], mg.barra(self.bar_w, self.bar_h, p,
                                         usage_color(p), BAR_BG))

    def _set_row_text(self, row):
        row["pct"].config(text="%d%%" % round(row["cur"]),
                          fg=usage_color(row["cur"]) if row["cur"] >= 50 else WHITE)

    def _draw_buttons(self):
        self._draw_refresh_btn()
        self._draw_pin_btn()
        self._draw_close_btn()

    def _draw_refresh_btn(self):
        color = ACCENT if self._fetching else GREY
        mg.poner(self.btn_refresh, mg.boton_actualizar(self.S(20), color, -self._spin))

    def _draw_pin_btn(self):
        color = ACCENT if self.topmost else GREY
        mg.poner(self.btn_pin, mg.boton_pin(self.S(20), color, self.topmost, GREY))

    def _draw_close_btn(self):
        mg.poner(self.btn_close, mg.boton_cerrar(self.S(20), GREY))

    def _draw_grip(self):
        mg.poner(self.grip, mg.agarre(self.S(14), GREY))

    # ---------------- Animacion (v2.1: solo bajo demanda, 0% CPU en reposo) ----
    def _kick_anim(self):
        """Arranca la animacion de barras solo si hay algo que animar."""
        if not self._anim_on:
            self._anim_on = True
            self.root.after(33, self._animate_bars)

    def _animate_bars(self):
        active = False
        for row in (self.row_5h, self.row_7d):
            t, cur = row["target"], row["cur"]
            if abs(t - cur) > 0.05:
                row["cur"] = cur + (t - cur) * 0.14
                active = True
            elif cur != t:
                row["cur"] = t
            else:
                continue
            self._set_row_text(row)
            self._draw_bar(row)
        if active:
            self.root.after(33, self._animate_bars)
        else:
            self._anim_on = False   # se detiene sola: nada mas que animar

    def _busy_anim(self):
        """Giro del boton refresh + barrido del logo SOLO mientras dura la consulta."""
        if not self._fetching:
            self._busy_on = False
            self._draw_refresh_btn()
            self.logo.draw()
            return
        self._spin = (self._spin - 16) % 360
        self._draw_refresh_btn()
        self.logo.tick_busy()
        self.root.after(80, self._busy_anim)

    def _fade_in(self, a=0.0):
        a = min(0.97, a + 0.09)
        try:
            self.root.attributes("-alpha", a)
        except Exception:
            return
        if a < 0.97:
            self.root.after(22, self._fade_in, a)

    # ---------------- Movimiento / ventana ----------------
    def _start_move(self, e):
        self._drag["x"] = e.x_root - self.root.winfo_x()
        self._drag["y"] = e.y_root - self.root.winfo_y()

    def _on_move(self, e):
        self.root.geometry("+%d+%d" % (e.x_root - self._drag["x"],
                                       e.y_root - self._drag["y"]))

    def _toggle_topmost(self):
        self.topmost = not self.topmost
        self._topmost_var.set(self.topmost)
        self.root.attributes("-topmost", self.topmost)
        self._draw_pin_btn()
        self._save_cfg()

    def _toggle_topmost_menu(self):
        self.topmost = bool(self._topmost_var.get())
        self.root.attributes("-topmost", self.topmost)
        self._draw_pin_btn()
        self._save_cfg()

    def _save_cfg(self):
        self.cfg.update({
            "x": self.root.winfo_x(),
            "y": self.root.winfo_y(),
            "scale": round(self.scale, 3),
            "topmost": self.topmost,
        })
        save_config(self.cfg)

    def _close(self):
        self._save_cfg()
        self.root.destroy()

    def _windows_extras(self):
        """Icono/entrada propia en la barra de tareas pese a overrideredirect."""
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
            style = (style | WS_EX_APPWINDOW) & ~WS_EX_TOOLWINDOW
            ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)
            self.root.withdraw()
            self.root.after(20, self._re_show)
        except Exception:
            pass

    def _re_show(self):
        self.root.deiconify()
        self.root.attributes("-topmost", self.topmost)

    # ---------------- Datos ----------------
    def _start_polling(self):
        threading.Thread(target=self._poll_loop, daemon=True).start()

    def _poll_loop(self):
        while True:
            try:
                self.root.after(0, self._set_fetching, True)
                result = fetch_usage()
                # v2.1: backoff — si hay 429, esperar cada vez mas en lugar
                # de seguir martillando el endpoint (que alarga el bloqueo).
                if result.get("ok"):
                    self._fail429 = 0
                    wait = POLL_SECONDS
                elif result.get("rate_limited"):
                    self._fail429 += 1
                    wait = min(BACKOFF_MAX,
                               BACKOFF_BASE * (2 ** min(3, self._fail429 - 1)))
                    wait = max(wait, int(result.get("retry_after") or 0))
                    result["next_s"] = wait
                elif result.get("auth_dead"):
                    wait = POLL_SECONDS         # solo relee el archivo local:
                                                # detecta tu relogin en <1 min
                else:
                    wait = POLL_SECONDS * 2     # errores de red/sesion: 2 min
                self.root.after(0, self._apply, result)
            except Exception:
                break                      # ventana destruida
            self._wake.wait(wait)          # espera o refresh manual
            self._wake.clear()

    def _renovar(self):
        """Hilo: renueva la sesion en segundo plano y vuelve a consultar el uso."""
        ok = renovar_sesion_claude()
        try:
            if not ok:
                self.root.after(0, lambda: self.status.config(
                    text="No se pudo renovar la sesion.\nMenu: Iniciar sesion en Claude Code.", fg=ORANGE))
            self._wake.set()             # el widget relee las credenciales renovadas
        except Exception:
            pass

    def _manual_refresh(self):
        now = time.time()
        if self._fetching or now - self._last_manual < MANUAL_MIN_S:
            return                         # debounce: nada de spam al endpoint
        self._last_manual = now
        self._wake.set()

    def _set_fetching(self, value):
        self._fetching = value
        self.logo.excited = value
        if value:
            self.status.config(text="• Consultando...", fg=GREY)
            if not self._busy_on:
                self._busy_on = True
                self._busy_anim()
        else:
            self._draw_refresh_btn()

    def _apply(self, result):
        self._set_fetching(False)
        if not result.get("ok"):
            if result.get("rate_limited"):
                mins = max(1, int(round(result.get("next_s", BACKOFF_BASE) / 60.0)))
                txt = "429: limite de peticiones.\nReintento en ~%d min." % mins
                if self._fail429 >= 3:
                    txt += "\nSi sigue asi: corre 'claude'\ny haz login de nuevo."
                self.status.config(text=txt, fg=ORANGE)
            else:
                txt = result.get("error", "Error")
                sin_sesion = (result.get("auth_dead") or "credenciales" in txt
                              or txt.startswith("401"))
                sin_archivo = "credenciales" in txt      # nunca se inicio sesion
                if sin_sesion and not sin_archivo and time.time() - self._ultima_renovacion > 600:
                    # v3.1: renovar solo y en segundo plano (antes: Preclaudio / consola)
                    self._ultima_renovacion = time.time()
                    txt = "Renovando la sesion\nautomaticamente..."
                    threading.Thread(target=self._renovar, daemon=True).start()
                elif sin_archivo and not _claude_exe():
                    txt = "Claude Code no esta instalado.\nVolver a instalar con Grafito."
                elif sin_archivo and not self._login_abierto:
                    self._login_abierto = abrir_login_claude()
                    if self._login_abierto:
                        txt = "Sin sesion de Claude Code.\nSe abrio una ventana: inicia\nsesion ahi (una sola vez)."
                elif sin_archivo:
                    txt = "Sin sesion de Claude Code.\nClic derecho: Iniciar sesion\nen Claude Code."
                self.status.config(text=txt, fg=ORANGE)
            self.logo.worried = True
            self.logo.draw()
            return
        self.row_5h["target"] = pct(result.get("five_hour", {}).get("utilization"))
        self.row_7d["target"] = pct(result.get("seven_day", {}).get("utilization"))
        self.row_5h["reset"].config(
            text="Resets en " + format_reset(result.get("five_hour", {}).get("resets_at")))
        self.row_7d["reset"].config(
            text="Resets en " + format_reset(result.get("seven_day", {}).get("resets_at")))
        mayor = max(self.row_5h["target"], self.row_7d["target"])
        self.logo.value = mayor / 100.0
        self.logo.worried = mayor >= 85
        self.logo.draw()
        self._kick_anim()
        self.status.config(
            text="• Actualizado %s · auto %ds" % (
                datetime.now().strftime("%H:%M:%S"), POLL_SECONDS),
            fg=ACCENT)

    def run(self):
        self.root.mainloop()


# ----------------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------------
def main():
    if tk is None:
        sys.exit("tkinter no esta disponible en este Python.")

    if sys.platform == "win32":
        # v2.1: instancia unica — evita dos widgets consultando a la vez
        # (p. ej. el del autoarranque + uno abierto a mano), que duplica
        # peticiones y ayuda a provocar 429.
        try:
            import ctypes
            ctypes.windll.kernel32.CreateMutexW(None, False,
                                                "Grafito.Claudio.Mutex")
            if ctypes.windll.kernel32.GetLastError() == 183:  # ya existe
                return
        except Exception:
            pass
        # DPI awareness para que se vea nitido en pantallas escaladas
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass

    UsageWidget().run()


if __name__ == "__main__":
    main()