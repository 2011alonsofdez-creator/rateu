"""Agente 2 - El editor: convierte el guion en un mp4 vertical listo para subir."""
from __future__ import annotations

import base64
import json
import math
import os
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Any

from ..nucleo.ajustes import AJUSTES
from ..nucleo.registro import di

SIMULADO = os.environ.get("OFICINA_SIMULADA") == "1"


# ---------- utilidades ----------
def _ejecutar(orden: list[str]) -> None:
    proceso = subprocess.run(orden, capture_output=True, text=True)
    if proceso.returncode != 0:
        raise RuntimeError(
            f"ffmpeg ha fallado:\n{' '.join(orden[:6])}...\n{proceso.stderr[-1200:]}"
        )


def _duracion(ruta: Path) -> float:
    salida = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(ruta),
        ],
        capture_output=True, text=True,
    )
    try:
        return float(salida.stdout.strip())
    except ValueError:
        return 0.0


def _cliente_openai():
    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("falta el paquete openai (pip install -r requirements.txt)") from exc
    if not AJUSTES.clave_openai:
        raise RuntimeError("falta OPENAI_API_KEY para la voz y las imagenes")
    return OpenAI()


# ---------- voz ----------
def _voz_edge(texto: str, destino: Path) -> None:
    """Voces de Microsoft Edge: gratis, sin clave, suenan bien en espanol."""
    voz = AJUSTES.get("video.voz_edge", "es-ES-AlvaroNeural")
    ritmo = AJUSTES.get("video.ritmo_edge", "+8%")
    proceso = subprocess.run(
        [
            sys.executable, "-m", "edge_tts",
            "--voice", voz,
            "--rate", ritmo,
            "--text", texto,
            "--write-media", str(destino),
        ],
        capture_output=True, text=True, timeout=180,
    )
    if proceso.returncode != 0 or not destino.exists() or destino.stat().st_size < 1000:
        raise RuntimeError(f"edge-tts ha fallado: {(proceso.stderr or '')[-300:]}")


def _voz_openai(texto: str, destino: Path) -> None:
    cliente = _cliente_openai()
    respuesta = cliente.audio.speech.create(
        model=AJUSTES.get("ia.modelo_voz", "gpt-4o-mini-tts"),
        voice=AJUSTES.get("video.voz", "onyx"),
        input=texto,
        instructions=(
            "Habla en espanol de Espana, tono cercano y con energia, ritmo rapido "
            "pero claro, como quien cuenta algo que acaba de descubrir."
        ),
        response_format="mp3",
    )
    destino.write_bytes(respuesta.read())


def _voz(texto: str, destino: Path) -> None:
    if SIMULADO:
        segundos = max(1.5, len(texto.split()) / 2.6)
        _ejecutar([
            "ffmpeg", "-y", "-f", "lavfi", "-i",
            f"sine=frequency=180:duration={segundos:.2f}",
            "-ac", "1", "-ar", "44100", str(destino),
        ])
        return
    proveedor = (AJUSTES.get("ia.voz_proveedor") or "edge").lower()
    intentos = ["edge", "openai"] if proveedor == "edge" else ["openai", "edge"]
    errores = []
    for intento in intentos:
        try:
            if intento == "edge":
                _voz_edge(texto, destino)
            elif AJUSTES.clave_openai:
                _voz_openai(texto, destino)
            else:
                continue
            return
        except Exception as exc:  # noqa: BLE001
            errores.append(f"{intento}: {exc}")
            di("editor", f"la voz por {intento} no ha salido, pruebo otra cosa")
    raise RuntimeError("no he podido generar la voz -> " + " | ".join(errores))


# ---------- imagenes ----------
def _imagen_placeholder(prompt: str, destino: Path, indice: int) -> None:
    from PIL import Image, ImageDraw

    ancho = int(AJUSTES.get("video.ancho", 1080))
    alto = int(AJUSTES.get("video.alto", 1920))
    base = (18 + indice * 23) % 160, (40 + indice * 47) % 160, (90 + indice * 31) % 200
    img = Image.new("RGB", (ancho, alto), base)
    dibujo = ImageDraw.Draw(img)
    for y in range(alto):
        mezcla = y / alto
        dibujo.line(
            [(0, y), (ancho, y)],
            fill=(
                int(base[0] * (1 - mezcla) + 12 * mezcla),
                int(base[1] * (1 - mezcla) + 12 * mezcla),
                int(base[2] * (1 - mezcla) + 30 * mezcla),
            ),
        )
    texto = "\n".join(textwrap.wrap(prompt[:120], 24))
    dibujo.multiline_text((60, alto // 2 - 80), texto, fill=(235, 235, 235), spacing=12)
    img.save(destino)


def _imagen_gratis(prompt: str, destino: Path) -> None:
    """Pollinations: generacion de imagenes gratis y sin clave."""
    import urllib.parse

    import requests

    texto = urllib.parse.quote(
        f"{prompt}. Vertical 9:16, cinematic, high contrast, no text, no watermark"
    )
    url = (
        f"https://image.pollinations.ai/prompt/{texto}"
        "?width=1024&height=1536&nologo=true&model=flux"
    )
    respuesta = requests.get(url, timeout=180)
    respuesta.raise_for_status()
    if len(respuesta.content) < 5000:
        raise RuntimeError("la imagen ha venido vacia")
    destino.write_bytes(respuesta.content)


def _imagen(prompt: str, destino: Path, indice: int) -> None:
    if SIMULADO:
        _imagen_placeholder(prompt, destino, indice)
        return
    if (AJUSTES.get("ia.imagen_proveedor") or "gratis").lower() == "gratis":
        try:
            _imagen_gratis(prompt, destino)
            return
        except Exception as exc:  # noqa: BLE001
            di("editor", f"imagen {indice} gratis ha fallado ({exc})")
            if not AJUSTES.clave_openai:
                _imagen_placeholder(prompt, destino, indice)
                return
    try:
        cliente = _cliente_openai()
        respuesta = cliente.images.generate(
            model=AJUSTES.get("ia.modelo_imagen", "gpt-image-1"),
            prompt=(
                f"{prompt}. Vertical 9:16 composition, cinematic, high contrast, "
                "no text, no watermark, no letters."
            ),
            size="1024x1536",
            n=1,
        )
        datos = respuesta.data[0]
        crudo = getattr(datos, "b64_json", None)
        if crudo:
            destino.write_bytes(base64.b64decode(crudo))
        else:  # algunas respuestas llegan como URL
            import requests

            destino.write_bytes(requests.get(datos.url, timeout=120).content)
    except Exception as exc:  # noqa: BLE001 - un short sin una imagen no para la oficina
        di("editor", f"imagen {indice} ha fallado ({exc}); uso fondo de respaldo")
        _imagen_placeholder(prompt, destino, indice)


# ---------- subtitulos ----------
def _tiempo_ass(segundos: float) -> str:
    centesimas = int(round(segundos * 100))
    horas, resto = divmod(centesimas, 360000)
    minutos, resto = divmod(resto, 6000)
    seg, cent = divmod(resto, 100)
    return f"{horas:d}:{minutos:02d}:{seg:02d}.{cent:02d}"


def _agrupar(palabras: list[str], maximo_letras: int = 17) -> list[list[str]]:
    """Trozos cortos de 1 a 3 palabras que caben de sobra en pantalla."""
    grupos: list[list[str]] = []
    actual: list[str] = []
    for palabra in palabras:
        cabe = len(" ".join(actual + [palabra])) <= maximo_letras
        if actual and (not cabe or len(actual) >= 3):
            grupos.append(actual)
            actual = [palabra]
        else:
            actual.append(palabra)
    if actual:
        grupos.append(actual)
    return grupos


def _ass(escenas: list[dict], duraciones: list[float], destino: Path) -> None:
    """Subtitulos quemados, grandes y centrados, en coordenadas reales del video."""
    ancho = int(AJUSTES.get("video.ancho", 1080))
    alto = int(AJUSTES.get("video.alto", 1920))
    cuerpo = int(alto * 0.048)        # ~92 px en 1920
    borde = max(3, int(cuerpo * 0.09))
    margen = int(alto * 0.22)         # por encima de la barra de YouTube

    cabecera = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {ancho}
PlayResY: {alto}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Short,DejaVu Sans,{cuerpo},&H00FFFFFF,&H00FFFFFF,&H00101010,&H64000000,-1,0,0,0,100,100,0,0,1,{borde},0,2,80,80,{margen},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lineas = [cabecera]
    reloj = 0.0
    for escena, duracion in zip(escenas, duraciones):
        palabras = escena["voz"].split()
        if not palabras:
            reloj += duracion
            continue
        grupos = _agrupar(palabras)
        paso = duracion / len(grupos)
        for indice, grupo in enumerate(grupos):
            inicio = reloj + indice * paso
            fin = min(inicio + paso, reloj + duracion)
            texto = " ".join(grupo).upper().replace("{", "(").replace("}", ")")
            lineas.append(
                f"Dialogue: 0,{_tiempo_ass(inicio)},{_tiempo_ass(fin)},Short,,0,0,0,,{texto}"
            )
        reloj += duracion
    destino.write_text("\n".join(lineas) + "\n", encoding="utf-8")


# ---------- montaje ----------
def _clip(imagen: Path, segundos: float, destino: Path, indice: int) -> None:
    ancho = int(AJUSTES.get("video.ancho", 1080))
    alto = int(AJUSTES.get("video.alto", 1920))
    fps = int(AJUSTES.get("video.fps", 30))
    fotogramas = max(2, int(segundos * fps))
    zoom = "1.0+0.0012*on" if indice % 2 == 0 else "1.12-0.0012*on"
    filtro = (
        f"scale={ancho * 2}:{alto * 2}:force_original_aspect_ratio=increase,"
        f"crop={ancho * 2}:{alto * 2},"
        f"zoompan=z='{zoom}':d={fotogramas}:s={ancho}x{alto}:fps={fps},"
        f"format=yuv420p"
    )
    _ejecutar([
        "ffmpeg", "-y", "-loop", "1", "-i", str(imagen),
        "-vf", filtro, "-t", f"{segundos:.3f}", "-r", str(fps),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", str(destino),
    ])


def montar(guion: dict[str, Any], carpeta: Path | None = None) -> Path:
    """Devuelve la ruta del mp4 terminado."""
    if not shutil.which("ffmpeg"):
        raise RuntimeError("falta ffmpeg en el sistema")
    carpeta = carpeta or (AJUSTES.carpeta_videos / "montaje")
    if carpeta.exists():
        shutil.rmtree(carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)

    escenas = guion["escenas"]
    di("editor", f"{len(escenas)} escenas: voz, imagen y clip")

    duraciones: list[float] = []
    audios: list[Path] = []
    clips: list[Path] = []
    for indice, escena in enumerate(escenas):
        audio = carpeta / f"voz{indice}.mp3"
        _voz(escena["voz"], audio)
        duracion = _duracion(audio) or float(escena["segundos"])
        duracion += 0.25  # un respiro entre frases
        imagen = carpeta / f"img{indice}.png"
        _imagen(escena["imagen"], imagen, indice)
        clip = carpeta / f"clip{indice}.mp4"
        _clip(imagen, duracion, clip, indice)
        duraciones.append(duracion)
        audios.append(audio)
        clips.append(clip)

    lista_clips = carpeta / "clips.txt"
    lista_clips.write_text(
        "\n".join(f"file '{c.name}'" for c in clips) + "\n", encoding="utf-8"
    )
    lista_audio = carpeta / "audios.txt"
    lista_audio.write_text(
        "\n".join(f"file '{a.name}'" for a in audios) + "\n", encoding="utf-8"
    )

    video_mudo = carpeta / "mudo.mp4"
    _ejecutar([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lista_clips),
        "-c", "copy", str(video_mudo),
    ])
    voz_entera = carpeta / "voz.mp3"
    _ejecutar([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lista_audio),
        "-c:a", "libmp3lame", "-b:a", "192k", str(voz_entera),
    ])

    filtros = []
    if AJUSTES.get("video.subtitulos", True):
        subs = carpeta / "subs.ass"
        _ass(escenas, duraciones, subs)
        filtros.append(f"subtitles={subs.name}")

    final = AJUSTES.carpeta_videos / "short.mp4"
    orden = [
        "ffmpeg", "-y", "-i", video_mudo.name, "-i", voz_entera.name,
    ]
    if filtros:
        orden += ["-vf", ",".join(filtros)]
        orden += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"]
    else:
        orden += ["-c:v", "copy"]
    orden += [
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        "-movflags", "+faststart", str(final.resolve()),
    ]
    proceso = subprocess.run(orden, capture_output=True, text=True, cwd=carpeta)
    if proceso.returncode != 0:
        raise RuntimeError(f"montaje final fallido:\n{proceso.stderr[-1200:]}")

    di("editor", f"listo: {final} ({_duracion(final):.1f}s, {final.stat().st_size / 1e6:.1f} MB)")
    return final


def montar_sobre(base: Path, guion: dict[str, Any], carpeta: Path | None = None) -> Path:
    """Igual que montar(), pero el video ya existe (por ejemplo, viene de Flow).

    Le pone la voz, los subtitulos y el formato 1080x1920. Si el video es mas
    corto que la voz, congela el ultimo fotograma; si es mas largo, lo recorta.
    """
    if not shutil.which("ffmpeg"):
        raise RuntimeError("falta ffmpeg en el sistema")
    carpeta = carpeta or (AJUSTES.carpeta_videos / "montaje")
    if carpeta.exists():
        shutil.rmtree(carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)

    escenas = guion["escenas"]
    di("editor", f"montando sobre {base.name} ({_duracion(base):.1f}s de video)")

    duraciones: list[float] = []
    audios: list[Path] = []
    for indice, escena in enumerate(escenas):
        audio = carpeta / f"voz{indice}.mp3"
        _voz(escena["voz"], audio)
        duraciones.append((_duracion(audio) or float(escena["segundos"])) + 0.25)
        audios.append(audio)

    lista_audio = carpeta / "audios.txt"
    lista_audio.write_text(
        "\n".join(f"file '{a.name}'" for a in audios) + "\n", encoding="utf-8"
    )
    voz_entera = carpeta / "voz.mp3"
    _ejecutar([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lista_audio),
        "-c:a", "libmp3lame", "-b:a", "192k", str(voz_entera),
    ])

    total = sum(duraciones)
    ancho = int(AJUSTES.get("video.ancho", 1080))
    alto = int(AJUSTES.get("video.alto", 1920))
    fps = int(AJUSTES.get("video.fps", 30))
    filtros = [
        f"scale={ancho}:{alto}:force_original_aspect_ratio=increase",
        f"crop={ancho}:{alto}",
        f"fps={fps}",
        f"tpad=stop_mode=clone:stop_duration={max(0.0, total - _duracion(base)):.3f}",
    ]
    if AJUSTES.get("video.subtitulos", True):
        subs = carpeta / "subs.ass"
        _ass(escenas, duraciones, subs)
        filtros.append(f"subtitles={subs.name}")

    final = AJUSTES.carpeta_videos / "short.mp4"
    proceso = subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(base.resolve()), "-i", voz_entera.name,
            "-vf", ",".join(filtros),
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", f"{total:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", str(final.resolve()),
        ],
        capture_output=True, text=True, cwd=carpeta,
    )
    if proceso.returncode != 0:
        raise RuntimeError(f"montaje sobre video externo fallido:\n{proceso.stderr[-1200:]}")

    di("editor", f"listo: {final} ({_duracion(final):.1f}s)")
    return final


if __name__ == "__main__":
    guion = json.loads(Path(os.environ.get("GUION", "guion.json")).read_text(encoding="utf-8"))
    montar(guion)
