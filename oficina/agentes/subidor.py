"""Agente 4 - El subidor: publica el short y apunta la hora exacta."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from ..nucleo.ajustes import AJUSTES
from ..nucleo.registro import apuntar_video, di, guardar_memoria, memoria
from ..nucleo.youtube import YouTube, enlace


def publicar(ruta: Path, guion: dict, idea: str | None = None) -> str:
    yt = YouTube()
    yt.verificar()
    etiquetas = list(guion.get("etiquetas", []))
    descripcion = guion.get("descripcion", "")
    if "#" not in descripcion:
        descripcion += "\n\n" + " ".join(f"#{e.replace(' ', '')}" for e in etiquetas[:4])

    video_id = yt.subir(
        ruta=ruta,
        titulo=guion["titulo"],
        descripcion=descripcion,
        etiquetas=etiquetas,
        privacidad=AJUSTES.get("publicacion.privacidad", "public"),
    )
    ahora = datetime.now(timezone.utc)
    apuntar_video(
        {
            "video_id": video_id,
            "titulo": guion["titulo"],
            "idea": idea,
            "subido_utc": ahora.isoformat(timespec="seconds"),
            "hora_utc": ahora.hour,
            "dia_semana": ahora.strftime("%A"),
            "escenas": len(guion.get("escenas", [])),
            "enlace": enlace(video_id),
        }
    )
    mem = memoria()
    mem["titulos_usados"] = (mem.get("titulos_usados") or []) + [guion["titulo"]]
    mem["titulos_usados"] = mem["titulos_usados"][-60:]
    guardar_memoria(mem)

    di("subidor", f"publicado: {enlace(video_id)}")
    return video_id
