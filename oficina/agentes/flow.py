"""Puente con Flow (Google Veo), que no tiene API publica.

Flow no deja que un programa genere videos por su cuenta, asi que el dia que
toca Flow la oficina hace las dos mitades que si puede hacer:

1. PEDIDO: deja un pack con el prompt exacto de cada plano, el texto de la voz
   y el titulo, en datos/<canal>/pedidos-flow/. Tu lo pegas en Flow.
2. RECOGIDA: tu exportas el video y lo sueltas en datos/<canal>/entrantes/.
   En el siguiente turno la oficina le pone voz y subtitulos y lo sube a su hora.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from ..nucleo.ajustes import AJUSTES
from ..nucleo.registro import di, orden

EXTENSIONES = (".mp4", ".mov", ".webm", ".m4v")


def carpeta_pedidos() -> Path:
    ruta = AJUSTES.carpeta_datos / "pedidos-flow"
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta


def carpeta_entrantes() -> Path:
    ruta = AJUSTES.carpeta_datos / "entrantes"
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta


def pedido(guion: dict) -> Path:
    """Escribe el pack para pegar en Flow."""
    sello = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H%M")
    destino = carpeta_pedidos() / f"{sello}.md"
    mandato = orden("flow")

    lineas = [
        f"# Pedido para Flow - {AJUSTES.get('canal.nombre') or AJUSTES.slug}",
        "",
        f"**Titulo:** {guion['titulo']}",
        "",
        f"**Descripcion:** {guion.get('descripcion', '')}",
        "",
        "Formato: vertical 9:16, sin texto dentro de la imagen (los subtitulos los pone"
        " la oficina), sin marcas de agua.",
        "",
    ]
    if mandato:
        lineas += [f"**Orden del jefe para este pedido:** {mandato}", ""]
    lineas += ["## Planos", ""]
    for indice, escena in enumerate(guion["escenas"], start=1):
        lineas += [
            f"### Plano {indice} ({escena['segundos']:.0f}s)",
            "",
            "```",
            f"{escena['imagen']}. Vertical 9:16, cinematic, no text, no watermark.",
            "```",
            "",
            f"Voz en off de este plano: *{escena['voz']}*",
            "",
        ]
    lineas += [
        "## Cuando lo tengas",
        "",
        f"Exporta el video y dejalo en `oficina/{carpeta_entrantes().relative_to(AJUSTES.carpeta_datos.parent.parent)}/`.",
        "En el siguiente turno la oficina le pone la voz y los subtitulos y lo sube a su hora.",
        "",
        "La duracion no tiene que ser exacta: si el video de Flow es mas corto que la voz,"
        " la oficina congela el ultimo fotograma; si es mas largo, lo recorta.",
    ]
    destino.write_text("\n".join(lineas), encoding="utf-8")
    di("flow", f"pedido listo en {destino.name}: pegalo en Flow cuando puedas")
    return destino


def recoger() -> Path | None:
    """El video mas reciente que hayas dejado en entrantes/."""
    candidatos = [
        p
        for p in carpeta_entrantes().iterdir()
        if p.is_file() and p.suffix.lower() in EXTENSIONES
    ]
    if not candidatos:
        return None
    elegido = max(candidatos, key=lambda p: p.stat().st_mtime)
    di("flow", f"he encontrado {elegido.name} en entrantes")
    return elegido


def archivar(video: Path) -> None:
    """Ya subido: lo aparta para no volver a subirlo manana."""
    usados = carpeta_entrantes() / "usados"
    usados.mkdir(exist_ok=True)
    video.rename(usados / video.name)
