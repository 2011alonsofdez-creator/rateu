"""Memoria compartida de la oficina y registro en pantalla."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .ajustes import AJUSTES, DATOS


def _memoria_ruta() -> Path:
    return AJUSTES.carpeta_datos / "memoria.json"


def _historial_ruta() -> Path:
    return AJUSTES.carpeta_datos / "historial.json"

_PLANTILLA_MEMORIA: dict[str, Any] = {
    "lecciones": [],          # lo que el analista aprende de la retencion
    "titulos_usados": [],     # para no repetirnos
    "ideas_pendientes": [],   # cola del buscador de nichos
    "mejores_horas": [],      # lo que calcula el agente de horarios
    "hora_en_uso": None,
}


def ahora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def hoy() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def di(agente: str, mensaje: str) -> None:
    canal = AJUSTES.slug
    print(
        f"[{datetime.now().strftime('%H:%M:%S')}] {canal:<11} {agente:<10} | {mensaje}",
        flush=True,
    )


def _cargar(ruta: Path, por_defecto: Any) -> Any:
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return por_defecto


def _guardar(ruta: Path, datos: Any) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")


def memoria() -> dict:
    datos = _cargar(_memoria_ruta(), {})
    for clave, valor in _PLANTILLA_MEMORIA.items():
        datos.setdefault(clave, json.loads(json.dumps(valor)))
    return datos


def guardar_memoria(datos: dict) -> None:
    _guardar(_memoria_ruta(), datos)


def historial() -> list[dict]:
    datos = _cargar(_historial_ruta(), [])
    return datos if isinstance(datos, list) else []


def guardar_historial(datos: list[dict]) -> None:
    _guardar(_historial_ruta(), datos)


def apuntar_video(entrada: dict) -> None:
    """Guarda un video publicado: id, titulo, hora de subida, idea, etc."""
    datos = historial()
    datos.append(entrada)
    guardar_historial(datos)


def actualizar_video(video_id: str, cambios: dict) -> None:
    datos = historial()
    for entrada in datos:
        if entrada.get("video_id") == video_id:
            entrada.update(cambios)
    guardar_historial(datos)


def ordenes() -> dict:
    """Instrucciones que el jefe (tu) deja a cada trabajador.

    Viven en datos/<canal>/ordenes.json, por ejemplo:
        {"guionista": "mas humor", "editor": "planos mas cerrados"}
    La oficina arcade escribe aqui.
    """
    datos = _cargar(AJUSTES.carpeta_datos / "ordenes.json", {})
    return datos if isinstance(datos, dict) else {}


def orden(agente: str) -> str:
    texto = str(ordenes().get(agente, "")).strip()
    return texto


def guardar_ordenes(datos: dict) -> None:
    _guardar(AJUSTES.carpeta_datos / "ordenes.json", datos)


def informe(nombre: str, texto: str) -> Path:
    ruta = AJUSTES.carpeta_informes / f"{hoy()}-{nombre}.md"
    ruta.write_text(texto, encoding="utf-8")
    di("oficina", f"informe guardado en {ruta.relative_to(DATOS.parent)}")
    return ruta


def morir(mensaje: str) -> None:
    print(f"ERROR: {mensaje}", file=sys.stderr, flush=True)
    raise SystemExit(1)
