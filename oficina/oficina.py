"""El jefe de la oficina: coordina a los agentes.

Uso:
    python -m oficina.oficina dia --canal gta6
    python -m oficina.oficina dia --canal todos   # los dos canales seguidos
    python -m oficina.oficina nichos     # solo el buscador de nichos
    python -m oficina.oficina retencion  # solo el analista de retencion
    python -m oficina.oficina horas      # solo el agente de horarios
    python -m oficina.oficina estado     # que sabe la oficina ahora mismo
    python -m oficina.oficina prueba     # guion + montaje, sin subir nada
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from datetime import datetime, timezone

from .agentes import analista, editor, flow, guionista, horario, nichos, subidor
from .nucleo.ajustes import AJUSTES, canales_disponibles
from .nucleo.registro import di, historial, informe, memoria


def _cabecera() -> None:
    di("oficina", f"canal activo: {AJUSTES.get('canal.nombre') or AJUSTES.slug}")


def _avisar_de_lo_que_falta() -> None:
    faltan = AJUSTES.faltan_secretos()
    if faltan:
        di("oficina", "faltan secretos: " + ", ".join(sorted(set(faltan))))
    if AJUSTES.nicho_sin_rellenar():
        di("oficina", "ojo: nicho.principal esta sin rellenar en config.json")


def modo_de_hoy(momento) -> str:
    """alterno = un dia Flow, otro el montaje automatico de la oficina."""
    modo = (AJUSTES.get("video.modo") or "alterno").lower()
    if modo != "alterno":
        return modo
    return "flow" if momento.timetuple().tm_yday % 2 == 0 else "auto"


def turno_diario(forzar: bool = False, subir: bool = True) -> int:
    _cabecera()
    _avisar_de_lo_que_falta()
    momento = horario.ahora_local()
    toca, motivo = horario.toca_publicar(momento)
    if not toca and not forzar:
        di("oficina", f"hoy no toca ahora mismo: {motivo}")
        return 0
    di("oficina", f"empieza el turno ({motivo if toca else 'forzado'})")

    idea = nichos.siguiente_idea()
    if idea is None:
        di("oficina", "la cola de ideas esta vacia, llamo al buscador de nichos")
        try:
            nichos.buscar()
            idea = nichos.siguiente_idea()
        except Exception as exc:  # noqa: BLE001
            di("oficina", f"el buscador de nichos ha fallado ({exc}); sigo sin idea concreta")

    guion = guionista.escribir(idea)
    (AJUSTES.carpeta_videos / "guion.json").write_text(
        json.dumps(guion, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    modo = modo_de_hoy(momento)
    di("oficina", f"modo de hoy: {modo}")
    entrante = flow.recoger() if modo == "flow" else None

    if modo == "flow" and entrante is None:
        flow.pedido(guion)
        if (AJUSTES.get("video.si_no_hay_flow") or "auto").lower() != "auto":
            di("oficina", "no hay video de Flow en entrantes; hoy no se publica")
            return 0
        di("oficina", "no hay video de Flow todavia; monto el automatico para no saltarme el dia")

    ruta = (
        editor.montar_sobre(entrante, guion)
        if entrante is not None
        else editor.montar(guion)
    )

    if not subir:
        di("oficina", f"modo sin subir: el video esta en {ruta}")
        return 0

    video_id = subidor.publicar(ruta, guion, idea)
    if entrante is not None:
        flow.archivar(entrante)
    informe(
        "publicacion",
        f"""# Publicado el {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC

- **Titulo:** {guion['titulo']}
- **Idea:** {idea or '(libre)'}
- **Enlace:** https://www.youtube.com/shorts/{video_id}
- **Montaje:** {'Flow (' + entrante.name + ')' if entrante is not None else 'automatico de la oficina'}
- **Escenas:** {len(guion['escenas'])}
- **Por que deberia retener:** {guion.get('porque_retiene', '')}
""",
    )
    return 0


def estado() -> int:
    mem = memoria()
    print(f"== {AJUSTES.get('canal.nombre') or AJUSTES.slug} ==")
    videos = historial()
    print(f"Nicho: {AJUSTES.get('nicho.principal')}")
    print(f"Videos publicados por la oficina: {len(videos)}")
    print(f"Hora en uso: {mem.get('hora_en_uso') if mem.get('hora_en_uso') is not None else 'explorando'}")
    print(f"Hora prevista hoy: {horario.hora_prevista():02d}:00 ({AJUSTES.get('canal.zona_horaria')})")
    print(f"Ideas en cola: {len(mem.get('ideas_pendientes', []))}")
    print("Lecciones de retencion:")
    for leccion in mem.get("lecciones", []) or ["(todavia ninguna)"]:
        print(f"  - {leccion}")
    print("Mejores horas conocidas:")
    for fila in (mem.get("mejores_horas") or [])[:5]:
        print(f"  - {fila['hora']:02d}:00 -> mediana {fila['mediana']:,} vistas en 48h ({fila['videos']} videos)")
    faltan = AJUSTES.faltan_secretos()
    print("Secretos que faltan:", ", ".join(sorted(set(faltan))) if faltan else "ninguno")
    return 0


def _una_tarea(tarea: str, forzar: bool) -> int:
    if tarea == "dia":
        return turno_diario(forzar=forzar)
    if tarea == "prueba":
        return turno_diario(forzar=True, subir=False)
    if tarea == "nichos":
        nichos.buscar()
        return 0
    if tarea == "retencion":
        analista.analizar()
        return 0
    if tarea == "horas":
        horario.decidir()
        return 0
    return estado()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Oficina de YouTube Shorts")
    parser.add_argument(
        "tarea",
        choices=["dia", "nichos", "retencion", "horas", "estado", "prueba"],
    )
    parser.add_argument(
        "--canal",
        default=None,
        help=f"canal a trabajar ({', '.join(canales_disponibles())} o 'todos')",
    )
    parser.add_argument("--forzar", action="store_true", help="publica aunque no sea la hora")
    args = parser.parse_args(argv)

    canales = (
        canales_disponibles()
        if args.canal == "todos"
        else [args.canal or AJUSTES.canal]
    )

    peor = 0
    for canal in canales:
        AJUSTES.usar(canal)
        try:
            peor = max(peor, _una_tarea(args.tarea, args.forzar))
        except Exception as exc:  # noqa: BLE001 - que un canal caiga no tumba al otro
            di("oficina", f"se ha caido en '{canal}': {exc}")
            traceback.print_exc()
            peor = 1
    return peor


if __name__ == "__main__":
    sys.exit(main())
