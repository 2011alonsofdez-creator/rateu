"""Agente 6 - El de los horarios: la primera semana explora, luego decide."""
from __future__ import annotations

import json
import statistics
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from ..nucleo.ajustes import AJUSTES
from ..nucleo.registro import (
    actualizar_video,
    di,
    guardar_memoria,
    historial,
    informe,
    memoria,
)
from ..nucleo.youtube import YouTube


def zona() -> ZoneInfo:
    try:
        return ZoneInfo(AJUSTES.get("canal.zona_horaria", "Europe/Madrid"))
    except Exception:  # noqa: BLE001
        return ZoneInfo("UTC")


def ahora_local() -> datetime:
    return datetime.now(zona())


def _hora_a_numero(texto: str) -> int:
    try:
        return int(str(texto).split(":")[0]) % 24
    except ValueError:
        return 19


def hora_prevista(momento: datetime | None = None) -> int:
    """Hora local a la que toca publicar hoy."""
    momento = momento or ahora_local()
    mem = memoria()
    aprendida = mem.get("hora_en_uso")
    if aprendida is not None:
        return int(aprendida) % 24
    pruebas = AJUSTES.get("publicacion.horas_a_probar") or [
        AJUSTES.get("publicacion.hora_fija", "19:00")
    ]
    return _hora_a_numero(pruebas[momento.weekday() % len(pruebas)])


def ya_publicado_hoy(momento: datetime | None = None) -> bool:
    momento = momento or ahora_local()
    for entrada in historial():
        subido = entrada.get("subido_utc")
        if not subido:
            continue
        local = datetime.fromisoformat(subido).astimezone(zona())
        if local.date() == momento.date():
            return True
    return False


def toca_publicar(momento: datetime | None = None) -> tuple[bool, str]:
    """GitHub Actions llega tarde a menudo, asi que hay ventana de rescate.

    Se publica desde la hora prevista hasta 2 horas despues. Si el reloj de
    GitHub se salta esa ventana entera, ese dia no sale video: mas vale eso que
    publicar a las 4 de la manana y ensuciar el aprendizaje de horas.
    """
    momento = momento or ahora_local()
    if ya_publicado_hoy(momento):
        return False, "hoy ya se ha publicado"
    objetivo = hora_prevista(momento)
    ventana = int(AJUSTES.get("publicacion.ventana_de_rescate_h", 2))
    if momento.hour < objetivo:
        return False, f"toca a las {objetivo:02d}:00 (ahora son las {momento.hour:02d}:00)"
    if momento.hour > objetivo + ventana:
        return False, (
            f"la ventana de las {objetivo:02d}:00 "
            f"(+{ventana}h) ya ha pasado; hoy no se publica"
        )
    retraso = momento.hour - objetivo
    return True, (
        f"es la hora ({objetivo:02d}:00)"
        if retraso == 0
        else f"rescate: tocaba a las {objetivo:02d}:00 y vamos {retraso}h tarde"
    )


def _rellenar_vistas(yt: YouTube) -> list[dict]:
    """Anade a cada video sus vistas de las primeras 48 horas."""
    listos = []
    limite = datetime.now(timezone.utc) - timedelta(hours=48)
    for entrada in historial():
        vid, subido = entrada.get("video_id"), entrada.get("subido_utc")
        if not vid or not subido:
            continue
        momento = datetime.fromisoformat(subido)
        if momento > limite:
            continue
        if entrada.get("vistas_48h") is None:
            try:
                filas = yt.vistas_por_dia(
                    vid,
                    desde=momento.strftime("%Y-%m-%d"),
                    hasta=(momento + timedelta(days=2)).strftime("%Y-%m-%d"),
                )
            except Exception as exc:  # noqa: BLE001
                di("horario", f"sin datos de {vid}: {exc}")
                continue
            entrada["vistas_48h"] = sum(v for _, v in filas)
            actualizar_video(vid, {"vistas_48h": entrada["vistas_48h"]})
        listos.append(entrada)
    return listos


def por_hora(entradas: list[dict]) -> dict[int, dict]:
    """Agrupa las vistas de 48h por hora local de publicacion."""
    cubos: dict[int, list[int]] = {}
    for entrada in entradas:
        vistas = entrada.get("vistas_48h")
        if vistas is None:
            continue
        local = datetime.fromisoformat(entrada["subido_utc"]).astimezone(zona())
        cubos.setdefault(local.hour, []).append(int(vistas))
    return {
        hora: {
            "videos": len(valores),
            "mediana": int(statistics.median(valores)),
            "media": int(statistics.fmean(valores)),
            "mejor": max(valores),
        }
        for hora, valores in sorted(cubos.items())
    }


def decidir() -> dict:
    yt = YouTube()
    entradas = _rellenar_vistas(yt)
    tabla = por_hora(entradas)
    minimo = int(AJUSTES.get("publicacion.minimo_videos_para_decidir", 7))
    dias = int(AJUSTES.get("publicacion.aprender_horas_desde_dia", 7))

    mem = memoria()
    orden = sorted(tabla.items(), key=lambda kv: kv[1]["mediana"], reverse=True)
    mem["mejores_horas"] = [
        {"hora": h, **datos} for h, datos in orden
    ]

    decision = None
    if len(entradas) >= minimo and len(tabla) >= 3:
        decision = orden[0][0]
        mem["hora_en_uso"] = decision
        di("horario", f"a partir de ahora se publica a las {decision:02d}:00 hora local")
    else:
        faltan = max(0, minimo - len(entradas))
        di(
            "horario",
            f"sigo explorando horas: faltan {faltan} videos con 48h de datos "
            f"(se decide a partir del dia {dias})",
        )
    guardar_memoria(mem)

    lineas = [
        f"# Mejores horas ({datetime.now(timezone.utc):%Y-%m-%d})",
        "",
        f"Zona horaria del canal: {AJUSTES.get('canal.zona_horaria')}  |  "
        f"videos con 48h de datos: {len(entradas)}",
        "",
        "| Hora local | Videos | Vistas 48h (mediana) | Media | Mejor |",
        "| --- | --- | --- | --- | --- |",
    ]
    for hora, datos in orden:
        lineas.append(
            f"| {hora:02d}:00 | {datos['videos']} | {datos['mediana']:,} | "
            f"{datos['media']:,} | {datos['mejor']:,} |"
        )
    lineas += [
        "",
        (
            f"**Decision:** publicar a las {decision:02d}:00."
            if decision is not None
            else "**Decision:** aun no hay datos suficientes; sigo rotando horas."
        ),
    ]
    informe("horarios", "\n".join(lineas))
    return {"tabla": tabla, "hora_elegida": decision, "videos": len(entradas)}


if __name__ == "__main__":
    print(json.dumps(decidir(), ensure_ascii=False, indent=2))
