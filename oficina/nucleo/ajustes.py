"""Configuracion de la oficina: un canal a la vez.

config.json  -> valores por defecto compartidos
canales/*.json -> lo propio de cada canal (nicho, voz, id, categoria)
datos/<slug>/  -> memoria, historial e informes de ESE canal
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parent.parent
CANALES = RAIZ / "canales"
DATOS = RAIZ / "datos"


def _leer_json(ruta: Path, por_defecto: Any) -> Any:
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return por_defecto


def _fundir(base: dict, encima: dict) -> dict:
    """Mezcla recursiva: lo del canal manda sobre lo general."""
    salida = dict(base)
    for clave, valor in encima.items():
        if isinstance(valor, dict) and isinstance(salida.get(clave), dict):
            salida[clave] = _fundir(salida[clave], valor)
        else:
            salida[clave] = valor
    return salida


def canales_disponibles() -> list[str]:
    return sorted(p.stem for p in CANALES.glob("*.json"))


class Ajustes:
    def __init__(self) -> None:
        self.canal: str = ""
        self.datos: dict = {}
        self.usar(os.environ.get("OFICINA_CANAL") or (canales_disponibles() or [""])[0])

    # ---------- canal activo ----------
    def usar(self, canal: str) -> "Ajustes":
        base = _leer_json(RAIZ / "config.json", {})
        propio = _leer_json(CANALES / f"{canal}.json", {}) if canal else {}
        if canal and not propio:
            disponibles = ", ".join(canales_disponibles()) or "ninguno"
            raise SystemExit(
                f"no existe el canal '{canal}' en oficina/canales (hay: {disponibles})"
            )
        self.canal = canal
        self.datos = _fundir(base, propio)
        for carpeta in (self.carpeta_datos, self.carpeta_informes, self.carpeta_videos):
            carpeta.mkdir(parents=True, exist_ok=True)
        return self

    @property
    def slug(self) -> str:
        return self.get("canal.slug") or self.canal or "general"

    @property
    def carpeta_datos(self) -> Path:
        return DATOS / self.slug

    @property
    def carpeta_informes(self) -> Path:
        return self.carpeta_datos / "informes"

    @property
    def carpeta_videos(self) -> Path:
        return self.carpeta_datos / "videos"

    # ---------- lectura ----------
    def get(self, camino: str, por_defecto: Any = None) -> Any:
        actual: Any = self.datos
        for parte in camino.split("."):
            if not isinstance(actual, dict) or parte not in actual:
                return por_defecto
            actual = actual[parte]
        return actual

    # ---------- secretos ----------
    @property
    def clave_anthropic(self) -> str:
        return os.environ.get("ANTHROPIC_API_KEY", "")

    @property
    def clave_openai(self) -> str:
        return os.environ.get("OPENAI_API_KEY", "")

    @property
    def sufijo_secreto(self) -> str:
        return self.slug.upper().replace("-", "_")

    @property
    def oauth_youtube(self) -> dict:
        """Cada canal tiene su refresh token; el client id/secret pueden ser comunes."""
        sufijo = self.sufijo_secreto
        return {
            "client_id": os.environ.get(f"YT_CLIENT_ID_{sufijo}")
            or os.environ.get("YT_CLIENT_ID", ""),
            "client_secret": os.environ.get(f"YT_CLIENT_SECRET_{sufijo}")
            or os.environ.get("YT_CLIENT_SECRET", ""),
            "refresh_token": os.environ.get(f"YT_REFRESH_TOKEN_{sufijo}")
            or os.environ.get("YT_REFRESH_TOKEN", ""),
        }

    def faltan_secretos(self) -> list[str]:
        faltan = []
        if not self.clave_anthropic:
            faltan.append("ANTHROPIC_API_KEY")
        if not self.clave_openai:
            faltan.append("OPENAI_API_KEY")
        sufijo = self.sufijo_secreto
        nombres = {
            "client_id": f"YT_CLIENT_ID (o YT_CLIENT_ID_{sufijo})",
            "client_secret": f"YT_CLIENT_SECRET (o YT_CLIENT_SECRET_{sufijo})",
            "refresh_token": f"YT_REFRESH_TOKEN_{sufijo}",
        }
        for clave, valor in self.oauth_youtube.items():
            if not valor:
                faltan.append(nombres[clave])
        return faltan

    def nicho_sin_rellenar(self) -> bool:
        principal = (self.get("nicho.principal") or "").strip().lower()
        return not principal or principal.startswith("rellena")


AJUSTES = Ajustes()
