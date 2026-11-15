"""Agente 3 - El buscador de nichos: mira que se mueve y propone ideas."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from ..nucleo.ajustes import AJUSTES
from ..nucleo.cerebro import pensar_json
from ..nucleo.registro import di, guardar_memoria, informe, memoria, orden
from ..nucleo.youtube import YouTube

SISTEMA_CONSULTAS = """Eres analista de nichos de YouTube Shorts. Propones busquedas
concretas que sirvan para medir que subtemas de un nicho estan funcionando ahora."""

SISTEMA_IDEAS = """Eres analista de nichos de YouTube Shorts. Lees datos reales de
videos cortos recientes y deduces que angulos estan tirando.

Criterios de "rentable" en este orden:
1. Vistas por video altas en canales pequenos (indica que el tema tira solo, sin
   depender de la marca del canal).
2. Tema repetible: se pueden hacer 30 videos distintos, no uno.
3. Publico adulto con interes de compra (eso sube el RPM), pero sin tocar temas
   prohibidos.
4. Produccion posible con voz en off e imagenes generadas, sin rodar nada.

No inventes cifras de RPM ni de ingresos: habla en terminos relativos y justifica
cada idea con los datos que te han dado."""


def _consultas(cantidad: int = 6) -> list[str]:
    datos = pensar_json(
        SISTEMA_CONSULTAS,
        f"""Nicho: {AJUSTES.get('nicho.principal')}
Subtemas conocidos: {', '.join(AJUSTES.get('nicho.subtemas', []) or []) or 'ninguno'}
Idioma: {AJUSTES.get('canal.idioma')}, pais: {AJUSTES.get('canal.pais')}

Dame {cantidad} busquedas de YouTube (texto plano, como las escribiria un usuario)
para medir que angulos del nicho estan funcionando en shorts ahora mismo.
JSON: {{"consultas": ["...", "..."]}}""",
        max_tokens=1500,
    )
    return [str(c) for c in (datos.get("consultas") or [])][:cantidad]


def _medir(yt: YouTube, consultas: list[str]) -> list[dict]:
    muestras: list[dict] = []
    for consulta in consultas:
        try:
            resultados = yt.buscar(consulta, maximo=15, dias=45)
        except Exception as exc:  # noqa: BLE001
            di("nichos", f"la busqueda '{consulta}' ha fallado: {exc}")
            continue
        ids = [r["id"]["videoId"] for r in resultados if r.get("id", {}).get("videoId")]
        for video in yt.detalles_videos(ids):
            est = video.get("statistics", {})
            muestras.append(
                {
                    "consulta": consulta,
                    "titulo": video["snippet"]["title"],
                    "canal": video["snippet"]["channelTitle"],
                    "publicado": video["snippet"]["publishedAt"],
                    "vistas": int(est.get("viewCount", 0)),
                    "likes": int(est.get("likeCount", 0)),
                    "comentarios": int(est.get("commentCount", 0)),
                }
            )
    muestras.sort(key=lambda m: m["vistas"], reverse=True)
    return muestras[:60]


def buscar(cantidad_ideas: int = 8) -> dict:
    yt = YouTube()
    consultas = _consultas()
    di("nichos", f"midiendo {len(consultas)} busquedas en YouTube")
    muestras = _medir(yt, consultas)
    if not muestras:
        raise RuntimeError("YouTube no ha devuelto nada; revisa la cuota de la API")

    resumen = "\n".join(
        f"- [{m['vistas']:>9,} vistas] {m['titulo']} ({m['canal']}, {m['publicado'][:10]})"
        for m in muestras
    )
    analisis = pensar_json(
        SISTEMA_IDEAS,
        f"""Nicho del canal: {AJUSTES.get('nicho.principal')}
Temas prohibidos: {', '.join(AJUSTES.get('nicho.prohibido', []) or [])}

{('ORDEN DEL JEFE: ' + orden('nichos')) if orden('nichos') else ''}

Shorts recientes del nicho (datos reales de la API de YouTube):
{resumen}

Devuelve:
{{
  "subnichos": [
    {{"nombre": "...", "por_que": "...", "senal_en_los_datos": "...", "competencia": "baja|media|alta", "puntuacion": 1-10}}
  ],
  "ideas": [
    {{"idea": "frase concreta para un short", "subnicho": "...", "gancho": "primera frase del video", "puntuacion": 1-10}}
  ],
  "evitar": ["angulos saturados o que no cumplen las normas"]
}}
Dame {cantidad_ideas} ideas ordenadas de mejor a peor.""",
        max_tokens=6000,
    )

    ideas = [i for i in (analisis.get("ideas") or []) if i.get("idea")]
    mem = memoria()
    mem["ideas_pendientes"] = [i["idea"] for i in ideas] + mem.get("ideas_pendientes", [])
    mem["ideas_pendientes"] = list(dict.fromkeys(mem["ideas_pendientes"]))[:40]
    guardar_memoria(mem)

    lineas = [
        f"# Nichos del {datetime.now(timezone.utc):%Y-%m-%d}",
        "",
        f"Nicho: **{AJUSTES.get('nicho.principal')}**  |  muestras analizadas: {len(muestras)}",
        "",
        "## Subnichos",
        "",
        "| Subnicho | Puntos | Competencia | Por que |",
        "| --- | --- | --- | --- |",
    ]
    for s in analisis.get("subnichos", []):
        lineas.append(
            f"| {s.get('nombre','')} | {s.get('puntuacion','')} | "
            f"{s.get('competencia','')} | {s.get('por_que','')} |"
        )
    lineas += ["", "## Ideas en cola", ""]
    for i in ideas:
        lineas.append(f"- **{i['idea']}** ({i.get('puntuacion','?')}/10) - gancho: {i.get('gancho','')}")
    lineas += ["", "## Evitar", ""] + [f"- {e}" for e in analisis.get("evitar", [])]
    informe("nichos", "\n".join(lineas))

    di("nichos", f"{len(ideas)} ideas nuevas en la cola")
    return analisis


def siguiente_idea() -> str | None:
    mem = memoria()
    cola = mem.get("ideas_pendientes") or []
    if not cola:
        return None
    idea = cola.pop(0)
    mem["ideas_pendientes"] = cola
    guardar_memoria(mem)
    return idea


if __name__ == "__main__":
    print(json.dumps(buscar(), ensure_ascii=False, indent=2))
