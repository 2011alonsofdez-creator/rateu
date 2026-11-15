"""El cerebro que comparten los agentes: Claude a traves del SDK oficial."""
from __future__ import annotations

import json
import re
from typing import Any

from .ajustes import AJUSTES
from .registro import di


class SinCerebro(RuntimeError):
    """No hay clave de API, asi que ningun agente puede pensar."""


def _cliente():
    try:
        import anthropic
    except ImportError as exc:  # pragma: no cover
        raise SinCerebro("falta el paquete anthropic (pip install -r requirements.txt)") from exc
    if not AJUSTES.clave_anthropic:
        raise SinCerebro("falta ANTHROPIC_API_KEY")
    return anthropic.Anthropic()


def pensar(
    sistema: str,
    peticion: str,
    max_tokens: int = 8000,
    esfuerzo: str | None = None,
) -> str:
    """Una pregunta, una respuesta en texto."""
    cliente = _cliente()
    respuesta = cliente.messages.create(
        model=AJUSTES.get("ia.modelo_texto", "claude-opus-5-5"),
        max_tokens=max_tokens,
        system=sistema,
        output_config={"effort": esfuerzo or AJUSTES.get("ia.esfuerzo", "medium")},
        messages=[{"role": "user", "content": peticion}],
    )
    if respuesta.stop_reason == "refusal":
        detalle = getattr(respuesta, "stop_details", None)
        motivo = getattr(detalle, "explanation", "") or getattr(detalle, "category", "")
        raise SinCerebro(f"el modelo ha rechazado la peticion: {motivo}")
    partes = [b.text for b in respuesta.content if getattr(b, "type", "") == "text"]
    return "\n".join(partes).strip()


def _extraer_json(texto: str) -> Any:
    limpio = texto.strip()
    limpio = re.sub(r"^```(?:json)?\s*", "", limpio)
    limpio = re.sub(r"\s*```$", "", limpio)
    try:
        return json.loads(limpio)
    except json.JSONDecodeError:
        pass
    for abre, cierra in (("{", "}"), ("[", "]")):
        i, j = limpio.find(abre), limpio.rfind(cierra)
        if i != -1 and j > i:
            try:
                return json.loads(limpio[i : j + 1])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"la respuesta no era JSON:\n{texto[:400]}")


def pensar_json(
    sistema: str,
    peticion: str,
    max_tokens: int = 8000,
    esfuerzo: str | None = None,
    intentos: int = 3,
) -> Any:
    """Lo mismo pero obligando a JSON, con reintentos si sale mal."""
    sistema_json = sistema.rstrip() + (
        "\n\nResponde UNICAMENTE con JSON valido, sin texto antes ni despues, "
        "sin bloques de codigo y sin comentarios."
    )
    ultimo = None
    for intento in range(1, intentos + 1):
        texto = pensar(sistema_json, peticion, max_tokens=max_tokens, esfuerzo=esfuerzo)
        try:
            return _extraer_json(texto)
        except ValueError as exc:
            ultimo = exc
            di("cerebro", f"JSON invalido (intento {intento}/{intentos}), repito")
    raise ValueError(str(ultimo))
