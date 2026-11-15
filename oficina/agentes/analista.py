"""Agente 5 - El analista: lee la retencion y dice donde se va la gente."""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone

from ..nucleo.ajustes import AJUSTES
from ..nucleo.cerebro import pensar_json
from ..nucleo.registro import (
    actualizar_video,
    di,
    guardar_memoria,
    historial,
    informe,
    memoria,
)
from ..nucleo.youtube import YouTube, enlace

SISTEMA = """Eres analista de retencion de YouTube Shorts. Te dan la curva real de
retencion de videos de un canal y los segundos exactos donde la gente se va.

Tu trabajo es convertir eso en reglas de guion accionables para el proximo video.
Cada leccion debe ser una orden concreta que un guionista pueda aplicar ("el gancho
tiene que nombrar el objeto en las dos primeras palabras"), nunca un consejo generico
("haz el video mas interesante"). No inventes causas que los datos no respalden:
si solo sabes que se van en el segundo 8, di que ahi hay una transicion que falla."""


def duracion_iso(texto: str) -> float:
    """PT1M5S -> 65.0"""
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?", texto or "")
    if not m:
        return 0.0
    horas, minutos, segundos = (float(x) if x else 0.0 for x in m.groups())
    return horas * 3600 + minutos * 60 + segundos


def caidas(curva: list[tuple[float, float]], duracion: float, umbral: float) -> list[dict]:
    """Puntos donde la retencion se desploma entre dos muestras consecutivas."""
    salida = []
    for (r0, v0), (r1, v1) in zip(curva, curva[1:]):
        perdida = v0 - v1
        if perdida >= umbral:
            salida.append(
                {
                    "desde_s": round(r0 * duracion, 1),
                    "hasta_s": round(r1 * duracion, 1),
                    "perdida": round(perdida, 3),
                    "quedaba": round(v1, 3),
                }
            )
    return sorted(salida, key=lambda c: c["perdida"], reverse=True)[:5]


def retencion_en(curva: list[tuple[float, float]], duracion: float, segundo: float) -> float:
    if not curva or duracion <= 0:
        return 0.0
    objetivo = segundo / duracion
    mejor = min(curva, key=lambda p: abs(p[0] - objetivo))
    return round(mejor[1], 3)


def analizar(maximo_videos: int = 10) -> dict:
    yt = YouTube()
    umbral = float(AJUSTES.get("retencion.caida_grave", 0.08))
    minimo_3s = float(AJUSTES.get("retencion.retencion_minima_3s", 0.75))

    hace_dos_dias = datetime.now(timezone.utc) - timedelta(days=2)
    propios = {v.get("video_id") for v in historial() if v.get("video_id")}
    videos = [
        v
        for v in yt.videos_del_canal(maximo=maximo_videos * 3)
        if datetime.fromisoformat(v["snippet"]["publishedAt"].replace("Z", "+00:00"))
        < hace_dos_dias
    ][:maximo_videos]
    if not videos:
        di("analista", "aun no hay videos con dos dias de datos; no hay nada que analizar")
        return {}

    fichas = []
    for video in videos:
        vid = video["id"]
        duracion = duracion_iso(video["contentDetails"]["duration"])
        try:
            curva = yt.retencion(vid)
        except Exception as exc:  # noqa: BLE001
            di("analista", f"sin curva para {vid}: {exc}")
            continue
        if not curva:
            continue
        ficha = {
            "video_id": vid,
            "titulo": video["snippet"]["title"],
            "duracion_s": round(duracion, 1),
            "vistas": int(video.get("statistics", {}).get("viewCount", 0)),
            "retencion_3s": retencion_en(curva, duracion, 3),
            "retencion_media": round(sum(v for _, v in curva) / len(curva), 3),
            "caidas": caidas(curva, duracion, umbral),
            "propio_de_la_oficina": vid in propios,
        }
        fichas.append(ficha)
        actualizar_video(
            vid,
            {
                "retencion_3s": ficha["retencion_3s"],
                "retencion_media": ficha["retencion_media"],
                "vistas": ficha["vistas"],
            },
        )

    if not fichas:
        di("analista", "YouTube todavia no da curvas de retencion de estos videos")
        return {}

    di("analista", f"{len(fichas)} videos con curva de retencion")
    analisis = pensar_json(
        SISTEMA,
        f"""Canal sobre: {AJUSTES.get('nicho.principal')}
Retencion minima aceptable a los 3 segundos: {minimo_3s}

Datos reales (audienceWatchRatio de la API de YouTube Analytics):
{json.dumps(fichas, ensure_ascii=False, indent=1)}

Devuelve:
{{
  "diagnostico": "2 o 3 frases sobre que esta pasando en este canal",
  "mejor_video": {{"titulo": "...", "por_que_funciona": "..."}},
  "peor_video": {{"titulo": "...", "donde_falla": "segundo X, que pasa ahi"}},
  "lecciones": ["ordenes concretas para el guionista, maximo 8"],
  "experimento": "un cambio concreto a probar en el proximo video"
}}""",
        max_tokens=4000,
    )

    mem = memoria()
    tope = int(AJUSTES.get("retencion.lecciones_maximas", 12))
    lecciones = [str(l) for l in (analisis.get("lecciones") or [])]
    mem["lecciones"] = list(dict.fromkeys(lecciones + mem.get("lecciones", [])))[:tope]
    guardar_memoria(mem)

    lineas = [
        f"# Retencion del {datetime.now(timezone.utc):%Y-%m-%d}",
        "",
        analisis.get("diagnostico", ""),
        "",
        "| Video | Vistas | Ret. 3s | Ret. media | Caida mas grande |",
        "| --- | --- | --- | --- | --- |",
    ]
    for f in fichas:
        peor = f["caidas"][0] if f["caidas"] else None
        texto_caida = (
            f"-{peor['perdida']:.0%} entre {peor['desde_s']}s y {peor['hasta_s']}s"
            if peor
            else "sin caidas bruscas"
        )
        marca = "" if f["retencion_3s"] >= minimo_3s else " ⚠"
        lineas.append(
            f"| [{f['titulo'][:48]}]({enlace(f['video_id'])}) | {f['vistas']:,} | "
            f"{f['retencion_3s']:.0%}{marca} | {f['retencion_media']:.0%} | {texto_caida} |"
        )
    lineas += [
        "",
        "## Lecciones para el guionista",
        "",
        *[f"- {l}" for l in mem["lecciones"]],
        "",
        f"**Experimento de esta semana:** {analisis.get('experimento', '')}",
    ]
    informe("retencion", "\n".join(lineas))
    return analisis


if __name__ == "__main__":
    print(json.dumps(analizar(), ensure_ascii=False, indent=2))
