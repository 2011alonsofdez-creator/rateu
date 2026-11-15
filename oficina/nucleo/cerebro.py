"""El cerebro que comparten los agentes.

Dos formas de pensar, por orden de preferencia:

1. CLAUDE CODE (lo que usa tu suscripcion, sin pagar API aparte). Hace falta
   el binario `claude` y un token largo en CLAUDE_CODE_OAUTH_TOKEN, que sale
   de ejecutar `claude setup-token` una vez en tu ordenador.
2. API de Anthropic con ANTHROPIC_API_KEY, si algun dia prefieres pagarla.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from typing import Any

from .ajustes import AJUSTES
from .registro import di


class SinCerebro(RuntimeError):
    """No hay forma de pensar: ni Claude Code ni clave de API."""


def _hay_claude_code() -> bool:
    return bool(shutil.which("claude")) and bool(
        os.environ.get("CLAUDE_CODE_OAUTH_TOKEN") or os.environ.get("CLAUDE_CODE_USE_SESSION")
    )


def como_pienso() -> str:
    if _hay_claude_code():
        return "claude-code"
    if AJUSTES.clave_anthropic:
        return "api"
    return "nada"


def _pensar_claude_code(sistema: str, peticion: str) -> str:
    orden = [
        "claude", "-p", peticion,
        "--system-prompt", sistema,
        "--model", AJUSTES.get("ia.modelo_texto_alias", "sonnet"),
        "--output-format", "text",
        "--restricted",          # sin Bash ni herramientas de codigo
        "--strict-mcp-config",   # sin conectores
        "--bare",                # sin hooks ni plugins
        "--no-session-persistence",
    ]
    proceso = subprocess.run(
        orden,
        capture_output=True,
        text=True,
        timeout=600,
        stdin=subprocess.DEVNULL,  # si no, se queda esperando entrada estandar
    )
    if proceso.returncode != 0:
        raise SinCerebro(
            "claude code ha fallado "
            f"({proceso.returncode}): {(proceso.stderr or proceso.stdout)[-400:]}"
        )
    salida = proceso.stdout.strip()
    if not salida:
        raise SinCerebro("claude code no ha devuelto nada")
    return salida


def _pensar_api(sistema: str, peticion: str, max_tokens: int, esfuerzo: str | None) -> str:
    try:
        import anthropic
    except ImportError as exc:  # pragma: no cover
        raise SinCerebro("falta el paquete anthropic") from exc
    cliente = anthropic.Anthropic()
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
    return "\n".join(
        b.text for b in respuesta.content if getattr(b, "type", "") == "text"
    ).strip()


def pensar(
    sistema: str,
    peticion: str,
    max_tokens: int = 8000,
    esfuerzo: str | None = None,
) -> str:
    modo = como_pienso()
    if modo == "claude-code":
        return _pensar_claude_code(sistema, peticion)
    if modo == "api":
        return _pensar_api(sistema, peticion, max_tokens, esfuerzo)
    raise SinCerebro(
        "no hay forma de pensar: falta CLAUDE_CODE_OAUTH_TOKEN (gratis con tu "
        "suscripcion, sale de `claude setup-token`) o ANTHROPIC_API_KEY"
    )


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
