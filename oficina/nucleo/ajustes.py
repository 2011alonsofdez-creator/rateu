"""Configuracion de la oficina: config.json + variables de entorno."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "datos"
INFORMES = DATOS / "informes"
VIDEOS = DATOS / "videos"


def _leer_json(ruta: Path, por_defecto: Any) -> Any:
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return por_defecto


class Ajustes:
    def __init__(self, ruta: Path | None = None) -> None:
        self.ruta = ruta or (RAIZ / "config.json")
        self.datos: dict = _leer_json(self.ruta, {})
        for carpeta in (DATOS, INFORMES, VIDEOS):
            carpeta.mkdir(parents=True, exist_ok=True)

    def get(self, camino: str, por_defecto: Any = None) -> Any:
        actual: Any = self.datos
        for parte in camino.split("."):
            if not isinstance(actual, dict) or parte not in actual:
                return por_defecto
            actual = actual[parte]
        return actual

    # --- secretos ---
    @property
    def clave_anthropic(self) -> str:
        return os.environ.get("ANTHROPIC_API_KEY", "")

    @property
    def clave_openai(self) -> str:
        return os.environ.get("OPENAI_API_KEY", "")

    @property
    def oauth_youtube(self) -> dict:
        return {
            "client_id": os.environ.get("YT_CLIENT_ID", ""),
            "client_secret": os.environ.get("YT_CLIENT_SECRET", ""),
            "refresh_token": os.environ.get("YT_REFRESH_TOKEN", ""),
        }

    def faltan_secretos(self) -> list[str]:
        faltan = []
        if not self.clave_anthropic and not self.clave_openai:
            faltan.append("ANTHROPIC_API_KEY u OPENAI_API_KEY")
        if not self.clave_openai:
            faltan.append("OPENAI_API_KEY (voz e imagenes)")
        for nombre, valor in self.oauth_youtube.items():
            if not valor:
                faltan.append(f"YT_{nombre.upper()}")
        return faltan

    def nicho_sin_rellenar(self) -> bool:
        principal = (self.get("nicho.principal") or "").strip().lower()
        return not principal or principal.startswith("rellena")


AJUSTES = Ajustes()
