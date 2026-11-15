"""Agente 1 - El guionista: escribe el short y aprende de la retencion."""
from __future__ import annotations

import json
from typing import Any

from ..nucleo.ajustes import AJUSTES
from ..nucleo.cerebro import pensar_json
from ..nucleo.registro import di, memoria

SISTEMA = """Eres guionista de YouTube Shorts en espanol de Espana, especializado en
retencion. Sabes que el 70% de la gente se va en los primeros 3 segundos si el primer
plano no promete algo concreto, y que cada frase tiene que abrir una pregunta que la
siguiente cierra.

Reglas duras:
- Primera frase: maximo 9 palabras, promesa o conflicto concreto, nunca saludo ni
  "en este video" ni "bienvenidos".
- Lenguaje hablado, frases cortas, segunda persona, cero relleno.
- Ningun dato que no sea de conocimiento comun y verificable. Si dudas de un dato,
  reformula en general en vez de inventar cifras, nombres, fechas o estudios.
- Nada de consejos medicos, legales o de inversion concretos, ni politica, ni
  contenido sexual, ni violencia grafica, ni menores.
- El cierre no pide suscripcion: deja una idea que invite a volver a verlo o comentar.
- El texto de voz es lo que se lee en alto: sin emojis, sin parentesis, sin acotaciones."""


def _peticion(idea: str | None, lecciones: list[str], titulos_usados: list[str]) -> str:
    escenas = int(AJUSTES.get("video.escenas", 6))
    duracion = int(AJUSTES.get("video.duracion_objetivo_s", 32))
    nicho = AJUSTES.get("nicho.principal", "")
    subtemas = ", ".join(AJUSTES.get("nicho.subtemas", []) or []) or "libre"
    publico = AJUSTES.get("nicho.publico", "")
    prohibido = ", ".join(AJUSTES.get("nicho.prohibido", []) or [])

    reglas = AJUSTES.get("nicho.reglas") or []

    bloques = [
        f"Canal: {AJUSTES.get('canal.nombre') or AJUSTES.slug}",
        f"Nicho del canal: {nicho}",
        f"Subtemas preferidos: {subtemas}",
        f"Publico: {publico}",
        f"Temas prohibidos: {prohibido}",
        f"Duracion total objetivo: {duracion} segundos repartidos en {escenas} escenas.",
    ]
    if reglas:
        bloques.append(
            "Reglas propias de ESTE canal (mandan sobre todo lo demas):\n- "
            + "\n- ".join(str(r) for r in reglas)
        )
    if idea:
        bloques.append(f"Idea concreta que viene del buscador de nichos: {idea}")
    if lecciones:
        bloques.append(
            "Lecciones de retencion de mis propios videos (OBLIGATORIO aplicarlas):\n- "
            + "\n- ".join(lecciones)
        )
    if titulos_usados:
        bloques.append(
            "Titulos que ya he usado y no debo repetir ni parafrasear:\n- "
            + "\n- ".join(titulos_usados[-25:])
        )
    bloques.append(
        """Devuelve este JSON exacto:
{
  "titulo": "maximo 70 caracteres, sin comillas, con el gancho delante",
  "descripcion": "2 o 3 frases + 3 hashtags al final",
  "etiquetas": ["8 etiquetas", "sin #"],
  "gancho_visual": "que se ve en el primer fotograma, en una frase",
  "escenas": [
    {
      "voz": "lo que se lee en alto en esta escena, 1 o 2 frases",
      "imagen": "prompt en ingles para generar la imagen vertical de esta escena, concreto y visual, sin texto dentro de la imagen",
      "segundos": 5
    }
  ],
  "porque_retiene": "una frase explicando por que esta estructura aguanta"
}
La suma de "segundos" debe acercarse a la duracion objetivo."""
    )
    return "\n\n".join(bloques)


def escribir(idea: str | None = None) -> dict[str, Any]:
    mem = memoria()
    if AJUSTES.nicho_sin_rellenar():
        raise RuntimeError(
            "el nicho esta sin rellenar: edita oficina/config.json -> nicho.principal"
        )
    di("guionista", f"escribiendo sobre: {idea or AJUSTES.get('nicho.principal')}")
    guion = pensar_json(
        SISTEMA,
        _peticion(idea, mem.get("lecciones", []), mem.get("titulos_usados", [])),
        max_tokens=6000,
    )
    guion = _sanear(guion)
    di("guionista", f"titulo: {guion['titulo']}")
    return guion


def _sanear(guion: Any) -> dict[str, Any]:
    if not isinstance(guion, dict):
        raise ValueError("el guion no es un objeto JSON")
    guion.setdefault("titulo", "Sin titulo")
    guion.setdefault("descripcion", "")
    guion.setdefault("etiquetas", [])
    guion.setdefault("gancho_visual", "")
    escenas = guion.get("escenas") or []
    limpias = []
    maximo = float(AJUSTES.get("video.duracion_maxima_s", 58))
    total = 0.0
    for escena in escenas:
        if not isinstance(escena, dict) or not str(escena.get("voz", "")).strip():
            continue
        segundos = float(escena.get("segundos") or 5)
        segundos = max(2.0, min(segundos, 15.0))
        if total + segundos > maximo:
            break
        total += segundos
        limpias.append(
            {
                "voz": str(escena["voz"]).strip(),
                "imagen": str(escena.get("imagen", "")).strip()
                or "vertical cinematic photo, dramatic lighting, no text",
                "segundos": segundos,
            }
        )
    if not limpias:
        raise ValueError("el guion ha salido sin escenas usables")
    guion["escenas"] = limpias
    guion["titulo"] = str(guion["titulo"]).strip().strip('"')[:100]
    guion["etiquetas"] = [str(e).lstrip("#").strip() for e in guion["etiquetas"]][:30]
    return guion


if __name__ == "__main__":
    print(json.dumps(escribir(), ensure_ascii=False, indent=2))
