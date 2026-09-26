# -*- coding: utf-8 -*-
"""
Subtito - motor de transcripcion (worker).
Corre en el Python del sistema. La interfaz (subtito.py / Subtito.exe) lo
lanza como subproceso y se comunican por lineas JSON (stdin: comandos,
stdout: eventos).

Comandos (stdin):   {"cmd":"transcribe","path":"C:\\...\\audio.mp3"}
                    {"cmd":"quit"}
Eventos (stdout):   model_loading / ready / start / progress / done /
                    error / fatal

Dos motores, elegidos por SUBTITO_MOTOR:
  whisper  -> faster-whisper (large-v3-turbo o large-v3), CPU int8.
  parakeet -> NVIDIA Parakeet TDT 0.6B v3 por onnx-asr (mas rapido en CPU).

Calidad:
  - Glosario (glosario.txt junto al exe, o junto al audio si existe uno ahi):
    frase de contexto + terminos, entregados al modelo como initial_prompt
    para que acierte nombres propios y jerga. Solo aplica a whisper.
  - beam_size configurable (5 = mas preciso, 1 = mas rapido).
  - Tiempos por palabra y corte en frases: subtitulos de <= 7 s y <= 84
    caracteres, cortados en puntuacion y silencios (antes salian bloques de 30 s).

El modelo se carga UNA sola vez y queda en RAM mientras la app este abierta.
Genera SOLO .srt (sin .txt), en espanol, junto al audio original.
"""

import sys
import os
import re
import json
import time
import warnings
import logging

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
warnings.filterwarnings("ignore")
logging.getLogger("faster_whisper").setLevel(logging.ERROR)

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

MOTOR = os.environ.get("SUBTITO_MOTOR", "whisper").strip().lower()
MODELO = os.environ.get("SUBTITO_MODELO", "large-v3-turbo")
IDIOMA = os.environ.get("SUBTITO_IDIOMA", "es")
BATCH = int(os.environ.get("SUBTITO_BATCH", "8"))
BEAM = int(os.environ.get("SUBTITO_BEAM", "5"))      # 5 = preciso; 1 = rapido
GLOSARIO = os.environ.get("SUBTITO_GLOSARIO", "")     # ruta al glosario.txt global
MAX_SEG_S = float(os.environ.get("SUBTITO_MAX_SEG", "7"))   # largo max. de un subtitulo
MAX_SEG_CHARS = int(os.environ.get("SUBTITO_MAX_CHARS", "84"))
AGC = os.environ.get("SUBTITO_AGC", "1") != "0"        # normalizar volumen por ventanas
CHUNK = int(os.environ.get("SUBTITO_CHUNK", "30"))     # ventana de whisper en segundos (30 = estandar)
PROMPT_TOKENS = 200   # cupo real del modelo: 224; se deja margen

MODELOS_PARAKEET = {"parakeet": "nemo-parakeet-tdt-0.6b-v3",
                    "canary": "nemo-canary-1b-v2"}


def emit(**kw):
    print(json.dumps(kw, ensure_ascii=False), flush=True)


def ft(s):
    h = int(s // 3600); m = int((s % 3600) // 60)
    sec = int(s % 60); ms = int(round((s - int(s)) * 1000))
    if ms == 1000:
        sec += 1; ms = 0
    return "%02d:%02d:%02d,%03d" % (h, m, sec, ms)


# ---------------------------------------------------------------- audio
def decodificar(path, sr=16000):
    """Cualquier formato -> float32 mono 16 kHz (PyAV, el mismo decodificador
    que usa faster-whisper). Devuelve (muestras, duracion_seg)."""
    import numpy as np
    import av
    c = av.open(path)
    s = c.streams.audio[0]
    res = av.AudioResampler(format="fltp", layout="mono", rate=sr)
    bufs = []
    for fr in c.decode(s):
        for o in res.resample(fr):
            bufs.append(o.to_ndarray()[0])
    for o in res.resample(None):
        bufs.append(o.to_ndarray()[0])
    c.close()
    if not bufs:
        return np.zeros(0, dtype=np.float32), 0.0
    x = np.concatenate(bufs).astype(np.float32)
    return x, len(x) / float(sr)


def agc(y, sr=16000, objetivo_db=-20.0, ventana_s=1.0, max_gain_db=20.0):
    """Normalizacion de volumen por ventanas de 1 s: sube las partes flojas
    (gente lejos del microfono) hasta -20 dBFS, con tope de +20 dB, y suaviza
    la ganancia entre ventanas. Nunca baja el volumen. En reuniones grabadas
    con el telefono sobre la mesa recupera tramos que el modelo se saltaba."""
    import numpy as np
    if len(y) == 0:
        return y
    n = int(ventana_s * sr)
    gan = []
    for i in range(0, len(y), n):
        rms = np.sqrt(np.mean(y[i:i + n] ** 2)) + 1e-9
        gdb = min(max_gain_db, max(0.0, objetivo_db - 20 * np.log10(rms)))
        gan.append(10 ** (gdb / 20))
    gan = np.array(gan, dtype=np.float32)
    centros = np.arange(len(gan)) * n + n / 2
    g = np.interp(np.arange(len(y)), centros, gan).astype(np.float32)
    return np.clip(y * g, -1, 1).astype(np.float32)


# ---------------------------------------------------------------- glosario
def leer_glosario(path):
    """Primera linea util = frase de contexto; el resto, un termino por linea."""
    ctx, terms = "", []
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if not ctx:
                    ctx = line
                else:
                    terms.append(line)
    except Exception:
        pass
    return ctx, terms


def glosario_para(audio):
    """Si hay un glosario.txt junto al audio, manda ese; si no, el global."""
    local = os.path.join(os.path.dirname(os.path.abspath(audio)), "glosario.txt")
    if os.path.isfile(local):
        return local
    return GLOSARIO if GLOSARIO and os.path.isfile(GLOSARIO) else ""


def armar_prompt(ctx, terms, contar_tokens, max_tokens=PROMPT_TOKENS):
    """Contexto + terminos en orden hasta llenar el cupo de tokens del modelo."""
    if not ctx and not terms:
        return None
    prompt = ctx
    for t in terms:
        cand = (prompt + " " + t + ",") if prompt else (t + ",")
        if contar_tokens(cand) > max_tokens:
            break
        prompt = cand
    return prompt.rstrip(",") + "."


# ---------------------------------------------------------------- srt
def quitar_bucles(words, max_rep=2):
    """Colapsa alucinaciones del tipo "a la bebe, a la bebe, a la bebe, ..."
    sobre la lista de palabras (inicio, fin, texto), ANTES de partir en
    subtitulos, para que un bucle largo no sobreviva repartido en varios.
    Si una secuencia de 1 a 8 palabras se repite mas de max_rep veces
    seguidas, deja solo max_rep repeticiones. Un "no, no, no" real queda."""
    norm = [re.sub(r"[^\w]", "", w[2].lower()) for w in words]
    i, out = 0, []
    while i < len(words):
        colapsado = False
        for n in range(1, 9):
            pat = norm[i:i + n]
            if len(pat) < n or not all(pat):
                continue
            k = 1
            while norm[i + k * n:i + (k + 1) * n] == pat:
                k += 1
            if k > max_rep + 1 or (n >= 2 and k > max_rep):
                out.extend(words[i:i + n * max_rep])
                i += k * n
                colapsado = True
                break
        if not colapsado:
            out.append(words[i])
            i += 1
    return out


def partir_palabras(words, max_dur=MAX_SEG_S, max_chars=MAX_SEG_CHARS, gap=1.0):
    """words: lista de (inicio, fin, texto). Devuelve segmentos (inicio, fin,
    texto) de tamano de subtitulo: corta en puntuacion fuerte, en silencios
    y por largo maximo."""
    words = quitar_bucles(list(words))
    segs, cur = [], []

    def cerrar(hasta=None):
        """Cierra el grupo actual (entero, o hasta el indice dado inclusive)."""
        if not cur:
            return
        parte = cur if hasta is None else cur[:hasta + 1]
        segs.append((parte[0][0], parte[-1][1],
                     " ".join(w[2].strip() for w in parte).strip()))
        del cur[:len(parte)]

    def mejor_corte():
        """Al desbordar por largo: cortar en la ultima coma/punto del grupo o
        en la pausa mas grande de su segunda mitad, no en la palabra actual."""
        if len(cur) < 3:
            return None
        for i in range(len(cur) - 2, len(cur) // 3, -1):
            if re.search(r"[,;:.!?]$", cur[i][2].strip()):
                return i
        mejor, gmax = None, 0.25
        for i in range(len(cur) // 2, len(cur) - 1):
            g = cur[i + 1][0] - cur[i][1]
            if g > gmax:
                mejor, gmax = i, g
        # sin coma ni pausa: partir en dos mitades parejas, nunca dejar
        # una sola palabra colgando en el siguiente subtitulo
        return mejor if mejor is not None else (len(cur) * 3) // 5

    for w in words:
        if cur:
            dur = w[1] - cur[0][0]
            chars = sum(len(x[2]) + 1 for x in cur) + len(w[2])
            silencio = w[0] - cur[-1][1]
            if silencio > gap:
                cerrar()
            elif dur > max_dur or chars > max_chars:
                cerrar(mejor_corte())
        cur.append(w)
        if re.search(r"[.!?]$", w[2].strip()) and (w[1] - cur[0][0]) > 1.5:
            cerrar()
    while cur:
        cerrar(mejor_corte() if (cur[-1][1] - cur[0][0] > max_dur) else None)
    return [s for s in segs if s[2]]


# ---------------------------------------------------------------- motores
class MotorWhisper(object):
    def __init__(self):
        from faster_whisper import WhisperModel, BatchedInferencePipeline
        hilos = os.cpu_count() or 4
        self.model = WhisperModel(MODELO, device="cpu", compute_type="int8",
                                  cpu_threads=hilos)
        self.batched = BatchedInferencePipeline(model=self.model)
        self.hilos = hilos
        self._prompts = {}

    def descripcion(self):
        return dict(model=MODELO, modo="lotes", hilos=self.hilos, beam=BEAM,
                    agc=AGC, chunk=CHUNK)

    def _contar(self, txt):
        return len(self.model.hf_tokenizer.encode(txt).ids)

    def prompt_para(self, audio):
        ruta = glosario_para(audio)
        if not ruta:
            return None
        key = (ruta, os.path.getmtime(ruta))
        if key not in self._prompts:
            ctx, terms = leer_glosario(ruta)
            self._prompts = {key: armar_prompt(ctx, terms, self._contar)}
        return self._prompts[key]

    def transcribir(self, audio, x, dur, progreso):
        prompt = self.prompt_para(audio)
        if AGC:
            x = agc(x)
        segments, info = self.batched.transcribe(
            x, language=IDIOMA, vad_filter=True, beam_size=BEAM,
            batch_size=BATCH, initial_prompt=prompt, word_timestamps=True,
            chunk_length=CHUNK)
        words = []
        for s in segments:
            if s.words:
                for w in s.words:
                    words.append((w.start, w.end, w.word))
            else:
                words.append((s.start, s.end, s.text))
            progreso(s.end)
        return partir_palabras(words)


class MotorOnnx(object):
    """Parakeet TDT 0.6B v3 (o Canary 1B v2) via onnx-asr, con VAD Silero."""
    def __init__(self):
        import onnx_asr
        self.nombre = MODELOS_PARAKEET.get(MOTOR, MOTOR)
        self.model = onnx_asr.load_model(self.nombre)
        self.vad = onnx_asr.load_vad("silero")

    def descripcion(self):
        return dict(model=self.nombre, modo="onnx", hilos=os.cpu_count() or 4, beam=0)

    def transcribir(self, audio, x, dur, progreso):
        segs = []
        if AGC:
            x = agc(x)
        adapter = self.model.with_timestamps().with_vad(self.vad, max_speech_duration_s=20)
        res = adapter.recognize(x, sample_rate=16000, language=IDIOMA)
        for r in res:
            toks = getattr(r, "tokens", None)
            tss = getattr(r, "timestamps", None)
            if toks and tss and len(toks) == len(tss):
                words = []
                for tk, ts in zip(toks, tss):
                    t = tk.replace("\u2581", " ")
                    if t.startswith(" ") or not words:
                        words.append([r.start + ts, r.start + ts, t.strip()])
                    else:
                        words[-1][2] += t
                        words[-1][1] = r.start + ts
                for w in words:
                    w[1] = max(w[1], w[0] + 0.05)
                segs.extend(partir_palabras([tuple(w) for w in words]))
            else:
                segs.append((r.start, r.end, r.text.strip()))
            progreso(r.end)
        return segs


def main():
    emit(event="model_loading", model=MODELO if MOTOR == "whisper" else MOTOR)
    try:
        motor = MotorWhisper() if MOTOR == "whisper" else MotorOnnx()
    except Exception as e:
        emit(event="fatal", msg="No pude cargar el modelo: %s" % str(e)[:120])
        return 1

    emit(event="ready", **motor.descripcion())

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except Exception:
            continue
        if cmd.get("cmd") == "quit":
            break
        if cmd.get("cmd") != "transcribe":
            continue

        audio = cmd.get("path", "")
        t0 = time.time()
        try:
            x, dur = decodificar(audio)
            emit(event="start", path=audio, duration=dur)
            estado = {"ultimo": -1}

            def progreso(fin):
                if dur > 0:
                    p = min(100, int(fin / dur * 100))
                    if p > estado["ultimo"]:
                        estado["ultimo"] = p
                        emit(event="progress", pct=p,
                             elapsed=round(time.time() - t0, 1))

            segs = motor.transcribir(audio, x, dur, progreso)
            srt = os.path.splitext(audio)[0] + ".srt"
            with open(srt, "w", encoding="utf-8") as f:
                for i, (a, b, t) in enumerate(segs, 1):
                    f.write("%d\n%s --> %s\n%s\n\n" % (i, ft(a), ft(b), t))
            emit(event="done", path=audio, srt=srt,
                 secs=round(time.time() - t0, 1))
        except Exception as e:
            emit(event="error", path=audio, msg=str(e)[:150])
    return 0


if __name__ == "__main__":
    sys.exit(main())
