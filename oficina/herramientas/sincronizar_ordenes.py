"""Mete en el repositorio las ordenes escritas en la oficina arcade.

Se le pasa por la entrada estandar el JSON de la coleccion "ordenes" del
artifact (una lista de {canal, agente, texto}) y reparte cada orden en
datos/<canal>/ordenes.json.

    python oficina/herramientas/sincronizar_ordenes.py < ordenes.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def main() -> int:
    crudo = json.load(sys.stdin)
    filas = crudo if isinstance(crudo, list) else crudo.get("documents", [])
    por_canal: dict[str, dict[str, str]] = {}
    for fila in filas:
        datos = fila.get("data", fila)
        canal, agente, texto = datos.get("canal"), datos.get("agente"), datos.get("texto")
        if canal and agente and texto:
            por_canal.setdefault(canal, {})[agente] = str(texto).strip()

    for canal in sorted(p.stem for p in (RAIZ / "canales").glob("*.json")):
        destino = RAIZ / "datos" / canal / "ordenes.json"
        destino.parent.mkdir(parents=True, exist_ok=True)
        ordenes = por_canal.get(canal, {})
        destino.write_text(
            json.dumps(ordenes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"{canal}: {len(ordenes)} ordenes -> {destino.relative_to(RAIZ.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
