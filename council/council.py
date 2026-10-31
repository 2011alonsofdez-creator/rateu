#!/usr/bin/env python3
"""
LLM Council — consejo de 6 IAs que deliberan hasta llegar a un acuerdo.

5 miembros votantes se llaman via OpenRouter (un modelo por fabricante).
El 6o miembro es Claude, que actua como SECRETARIO: no vota, coordina,
comprueba datos y redacta. Las partes del secretario las escribe Claude
en ficheros; este script orquesta, llama a las APIs y cuenta los votos.

Proceso:
  ronda1  Cada miembro responde por separado, sin ver a los demas.
  ronda2  Cada uno ve las respuestas de los demas de forma ANONIMA,
          critica, senala errores y vota punto por punto.
  ronda3  El secretario redacta una propuesta final y cada miembro
          firma / firma con reservas / no firma.

Uso tipico:
    python3 council/council.py doctor
    python3 council/council.py init --pregunta "..."
    python3 council/council.py ronda1
    # el secretario escribe puntos.json
    python3 council/council.py ronda2
    # el secretario escribe propuesta_final.md
    python3 council/council.py ronda3
    python3 council/council.py recuento

Sin dependencias externas: solo biblioteca estandar.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as _dt
import json
import os
import random
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.abspath(__file__))
DIR_RUNS = os.path.join(RAIZ, "runs")
CONFIG = os.path.join(RAIZ, "miembros.json")
API = "https://openrouter.ai/api/v1"
PUNTERO = os.path.join(DIR_RUNS, "ACTUAL")

# El secretario es miembro del consejo pero no vota.
SECRETARIO = {"id": "M6", "fabricante": "Anthropic", "modelo": "claude (secretario)"}

VOTOS_VALIDOS = {"DE_ACUERDO", "EN_DESACUERDO", "MATIZ", "ABSTENCION"}
FIRMAS_VALIDAS = {"FIRMO", "FIRMO_CON_RESERVAS", "NO_FIRMO"}


# --------------------------------------------------------------------------
# utilidades
# --------------------------------------------------------------------------

def log(msg: str) -> None:
    print(f"[{_dt.datetime.now():%H:%M:%S}] {msg}", flush=True)


def muere(msg: str, code: int = 1):
    print(f"\nERROR: {msg}\n", file=sys.stderr)
    sys.exit(code)


def cargar_config(ruta: str = "") -> dict:
    ruta = ruta or CONFIG
    if not os.path.exists(ruta):
        muere(f"no encuentro {ruta}")
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh)


def leer_clave(obligatoria: bool = True) -> str:
    """OPENROUTER_API_KEY desde el entorno o desde un .env local."""
    clave = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if clave:
        return clave
    for ruta in (
        os.path.join(os.path.dirname(RAIZ), ".env"),
        os.path.join(RAIZ, ".env"),
        os.path.expanduser("~/.env"),
    ):
        if not os.path.exists(ruta):
            continue
        with open(ruta, encoding="utf-8", errors="replace") as fh:
            for linea in fh:
                linea = linea.strip()
                if linea.startswith("#") or "=" not in linea:
                    continue
                k, _, v = linea.partition("=")
                if k.strip() == "OPENROUTER_API_KEY":
                    v = v.strip().strip("'\"")
                    if v:
                        return v
    if not obligatoria:
        return ""
    muere(
        "no hay OPENROUTER_API_KEY.\n"
        "  Definela como variable de entorno del entorno cloud, o pon\n"
        "  OPENROUTER_API_KEY=sk-or-...  en un fichero .env (ya esta en .gitignore)."
    )


def contexto_ssl() -> ssl.SSLContext:
    """Respeta el CA bundle del proxy del contenedor si existe."""
    bundle = "/root/.ccr/ca-bundle.crt"
    if os.path.exists(bundle):
        try:
            return ssl.create_default_context(cafile=bundle)
        except Exception:
            pass
    return ssl.create_default_context()


def http_json(url: str, payload: dict | None, clave: str | None, timeout: int) -> dict:
    datos = json.dumps(payload).encode() if payload is not None else None
    cab = {
        "Content-Type": "application/json",
        "User-Agent": "llm-council/1.0",
        "HTTP-Referer": "https://github.com/llm-council",
        "X-Title": "LLM Council",
    }
    if clave:
        cab["Authorization"] = f"Bearer {clave}"
    req = urllib.request.Request(url, data=datos, headers=cab)
    with urllib.request.urlopen(req, timeout=timeout, context=contexto_ssl()) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


# --------------------------------------------------------------------------
# llamada a un miembro
# --------------------------------------------------------------------------

def preguntar(modelo: str, sistema: str, usuario: str, clave: str, par: dict) -> dict:
    """Llama a un modelo via OpenRouter. Devuelve dict con texto/uso/error."""
    payload = {
        "model": modelo,
        "messages": [
            {"role": "system", "content": sistema},
            {"role": "user", "content": usuario},
        ],
        "temperature": par.get("temperature", 0.3),
        "max_tokens": par.get("max_tokens", 4000),
    }
    intentos = int(par.get("reintentos", 3))
    timeout = int(par.get("timeout_segundos", 300))
    ultimo = ""

    for intento in range(1, intentos + 1):
        try:
            r = http_json(f"{API}/chat/completions", payload, clave, timeout)
            if "error" in r and not r.get("choices"):
                ultimo = f"API: {json.dumps(r['error'], ensure_ascii=False)[:400]}"
                raise RuntimeError(ultimo)
            elecciones = r.get("choices") or []
            if not elecciones:
                ultimo = f"respuesta sin choices: {json.dumps(r)[:400]}"
                raise RuntimeError(ultimo)
            msg = elecciones[0].get("message") or {}
            texto = (msg.get("content") or "").strip()
            fin = elecciones[0].get("finish_reason") or elecciones[0].get("native_finish_reason")
            if not texto:
                razona = (msg.get("reasoning") or "")
                if fin == "length" or razona:
                    ultimo = (
                        f"sin texto: el modelo agoto max_tokens "
                        f"({par.get('max_tokens')}) razonando antes de responder"
                        f"{f'; {len(razona)} caracteres de razonamiento' if razona else ''}. "
                        "Sube max_tokens en la configuracion."
                    )
                else:
                    ultimo = f"respuesta vacia (finish_reason={fin})"
                raise RuntimeError(ultimo)
            if fin == "length":
                log(f"    aviso: {modelo} truncado por max_tokens; la respuesta puede quedar a medias")
            return {
                "ok": True,
                "texto": texto,
                "modelo_servido": r.get("model", modelo),
                "uso": r.get("usage") or {},
                "intentos": intento,
            }
        except urllib.error.HTTPError as e:
            cuerpo = e.read().decode("utf-8", "replace")[:400]
            ultimo = f"HTTP {e.code}: {cuerpo}"
            # 4xx que no sea rate-limit: no insistir
            if 400 <= e.code < 500 and e.code not in (408, 409, 429):
                break
        except Exception as e:  # red, timeout, TLS, parseo
            ultimo = f"{type(e).__name__}: {e}"
        if intento < intentos:
            espera = 2 ** intento
            log(f"    reintento {intento+1}/{intentos} de {modelo} en {espera}s ({ultimo[:90]})")
            time.sleep(espera)

    return {"ok": False, "texto": "", "error": ultimo, "intentos": intentos}


def en_paralelo(tareas: list[tuple], clave: str, par: dict) -> dict:
    """tareas = [(miembro_dict, sistema, usuario), ...] -> {id: resultado}"""
    salida: dict[str, dict] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tareas) or 1) as pool:
        futuros = {
            pool.submit(preguntar, m["modelo"], s, u, clave, par): m for m, s, u in tareas
        }
        for fut in concurrent.futures.as_completed(futuros):
            m = futuros[fut]
            try:
                res = fut.result()
            except Exception as e:
                res = {"ok": False, "texto": "", "error": f"{type(e).__name__}: {e}"}
            res["miembro"] = m
            salida[m["id"]] = res
            marca = "OK " if res.get("ok") else "FALLO"
            extra = "" if res.get("ok") else f" -> {res.get('error','')[:140]}"
            log(f"  {marca} {m['id']} {m['fabricante']} ({m['modelo']}){extra}")
    return salida


# --------------------------------------------------------------------------
# gestion del run (carpeta por deliberacion)
# --------------------------------------------------------------------------

def run_actual() -> str:
    if not os.path.exists(PUNTERO):
        muere("no hay deliberacion abierta. Lanza primero: council.py init --pregunta \"...\"")
    with open(PUNTERO, encoding="utf-8") as fh:
        ruta = fh.read().strip()
    if not os.path.isdir(ruta):
        muere(f"la carpeta del run no existe: {ruta}")
    return ruta


def cargar_estado(run: str) -> dict:
    with open(os.path.join(run, "estado.json"), encoding="utf-8") as fh:
        return json.load(fh)


def guardar_estado(run: str, estado: dict) -> None:
    with open(os.path.join(run, "estado.json"), "w", encoding="utf-8") as fh:
        json.dump(estado, fh, ensure_ascii=False, indent=2)


def escribir(ruta: str, texto: str) -> None:
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as fh:
        fh.write(texto)


def leer(ruta: str) -> str:
    with open(ruta, encoding="utf-8") as fh:
        return fh.read()


def volcar_ronda(carpeta: str, resultados: dict, estado: dict, sufijo: str = "") -> None:
    """Guarda cada respuesta como .md legible y un .json con los metadatos."""
    os.makedirs(carpeta, exist_ok=True)
    meta = {}
    for mid, r in sorted(resultados.items()):
        m = r["miembro"]
        alias = estado["alias"].get(mid, "?")
        nombre = f"{mid}-{m['fabricante'].lower()}{sufijo}"
        cab = (
            f"# {mid} — {m['fabricante']}\n\n"
            f"- Modelo: `{m['modelo']}`\n"
            f"- Alias anonimo en el debate: **Miembro {alias}**\n"
            f"- Estado: {'OK' if r.get('ok') else 'FALLO'}\n\n---\n\n"
        )
        cuerpo = r.get("texto") or f"_Sin respuesta._\n\nError: `{r.get('error','')}`"
        escribir(os.path.join(carpeta, nombre + ".md"), cab + cuerpo + "\n")
        meta[mid] = {
            "fabricante": m["fabricante"],
            "modelo": m["modelo"],
            "modelo_servido": r.get("modelo_servido"),
            "alias": alias,
            "ok": bool(r.get("ok")),
            "error": r.get("error"),
            "uso": r.get("uso", {}),
            "intentos": r.get("intentos"),
        }
    with open(os.path.join(carpeta, "_meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)


# --------------------------------------------------------------------------
# extraccion de JSON de las respuestas (votos y firmas)
# --------------------------------------------------------------------------

def extraer_json(texto: str) -> dict | None:
    """Saca el ultimo bloque JSON de una respuesta, tolerando ```json y ruido."""
    bloques = re.findall(r"```(?:json)?\s*(.*?)```", texto, re.S)
    candidatos = [b.strip() for b in bloques]
    # tambien el ultimo {...} suelto, por si no uso fences
    llaves = re.findall(r"\{.*\}", texto, re.S)
    candidatos += [c.strip() for c in llaves]
    for c in reversed(candidatos):
        try:
            d = json.loads(c)
            if isinstance(d, dict):
                return d
        except Exception:
            continue
    return None


# --------------------------------------------------------------------------
# prompts
# --------------------------------------------------------------------------

BASE = (
    "Eres miembro de un consejo de seis IAs de fabricantes distintos reunido para "
    "deliberar hasta alcanzar un acuerdo razonado. Un secretario humano-asistido "
    "(Claude) coordina, verifica datos y redacta: no vota.\n\n"
    "Reglas del consejo:\n"
    "- Escribe en espanol, claro y sin relleno.\n"
    "- Separa siempre lo que es hecho verificable de lo que es juicio o estimacion.\n"
    "- Cuantifica tu confianza cuando afirmes algo relevante.\n"
    "- Si no sabes algo, dilo. Una laguna reconocida vale mas que una invencion.\n"
    "- No halagues ni te disculpes. No hables de ti mismo ni de tu fabricante.\n"
)

SIS_R1 = BASE + (
    "\nESTAS EN LA RONDA 1. Respondes en solitario: no has visto ninguna otra "
    "respuesta y nadie ha visto la tuya."
)

SIS_R2 = BASE + (
    "\nESTAS EN LA RONDA 2. Vas a ver las respuestas de los demas miembros de forma "
    "ANONIMA (Miembro A, B, C...). Tu propia respuesta no esta entre ellas. "
    "Critica con rigor, senala errores concretos y vota punto por punto. "
    "Es legitimo y deseable cambiar de opinion si otro argumento es mejor."
)

SIS_R3 = BASE + (
    "\nESTAS EN LA RONDA 3. El secretario ha redactado una propuesta final a partir "
    "de la deliberacion. Decides si la firmas. No reescribas la propuesta: "
    "juzgala. Firmar no significa que sea tu redaccion preferida, significa que "
    "la asumes como posicion del consejo."
)


def prompt_r1(pregunta: str) -> str:
    return (
        f"PREGUNTA SOMETIDA AL CONSEJO:\n\n{pregunta}\n\n"
        "---\n\nResponde con esta estructura:\n\n"
        "## Respuesta breve\n"
        "Tu posicion en 3-5 frases.\n\n"
        "## Razonamiento\n"
        "El argumento, paso a paso.\n\n"
        "## Afirmaciones verificables\n"
        "Lista numerada de los hechos concretos en los que te apoyas (datos, cifras, "
        "fechas, mecanismos). Marca cada uno con tu confianza: [alta] [media] [baja]. "
        "El secretario los va a comprobar.\n\n"
        "## Supuestos y condiciones\n"
        "De que depende que tu respuesta sea correcta.\n\n"
        "## Donde puedo estar equivocado\n"
        "Los puntos mas debiles de tu propia posicion, honestamente.\n"
    )


def prompt_r2(pregunta: str, dossier: str, puntos: list[dict], alias_propio: str) -> str:
    lineas = "\n".join(f'  - "{p["id"]}": {p["texto"]}' for p in puntos)
    esquema = ",\n".join(
        f'    "{p["id"]}": {{"voto": "DE_ACUERDO|EN_DESACUERDO|MATIZ|ABSTENCION", '
        f'"motivo": "una frase"}}' for p in puntos
    )
    return (
        f"PREGUNTA SOMETIDA AL CONSEJO:\n\n{pregunta}\n\n"
        f"Tu eres el Miembro {alias_propio}. Tu respuesta NO aparece abajo.\n\n"
        f"=== RESPUESTAS ANONIMAS DE LOS DEMAS MIEMBROS ===\n\n{dossier}\n"
        f"=== FIN DE LAS RESPUESTAS ===\n\n"
        f"PUNTOS A VOTAR (extraidos por el secretario):\n{lineas}\n\n"
        "---\n\nResponde con esta estructura:\n\n"
        "## Critica\n"
        "Por cada miembro relevante (Miembro A, B, ...): que acierta y que falla. "
        "Se concreto.\n\n"
        "## Errores detectados\n"
        "Afirmaciones que consideras falsas o enganosas, con el miembro que las hizo "
        "y por que estan mal. Si no ves ninguna, dilo.\n\n"
        "## Mejor argumento ajeno\n"
        "El argumento de otro miembro que mas fuerza tiene, aunque te incomode.\n\n"
        "## Cambio de posicion\n"
        "En que has cambiado de opinion respecto a tu respuesta de la ronda 1, si en algo.\n\n"
        "## Votacion\n"
        "Un bloque JSON y nada mas dentro del bloque. MATIZ = de acuerdo con una "
        "condicion o correccion que debes explicar en el motivo.\n\n"
        "```json\n{\n"
        '  "votos": {\n' + esquema + "\n  },\n"
        '  "punto_irrenunciable": "el punto que, si cae, te impide firmar el acuerdo"\n'
        "}\n```\n"
    )


def prompt_r3(pregunta: str, propuesta: str) -> str:
    return (
        f"PREGUNTA SOMETIDA AL CONSEJO:\n\n{pregunta}\n\n"
        f"=== PROPUESTA FINAL DEL SECRETARIO ===\n\n{propuesta}\n\n"
        f"=== FIN DE LA PROPUESTA ===\n\n"
        "---\n\nResponde con esta estructura:\n\n"
        "## Valoracion\n"
        "Refleja la propuesta la deliberacion con fidelidad? Que recoge mal, omite o "
        "exagera?\n\n"
        "## Reservas\n"
        "Si firmas con reservas, enumeralas de forma que puedan anexarse al acuerdo. "
        "Si no tienes ninguna, escribe 'ninguna'.\n\n"
        "## Firma\n"
        "Un bloque JSON y nada mas dentro del bloque.\n\n"
        "```json\n{\n"
        '  "firma": "FIRMO|FIRMO_CON_RESERVAS|NO_FIRMO",\n'
        '  "motivo": "dos o tres frases",\n'
        '  "reservas": ["...", "..."],\n'
        '  "cambio_minimo_para_firmar": "solo si NO_FIRMO: el cambio minimo que te haria firmar"\n'
        "}\n```\n"
    )


# --------------------------------------------------------------------------
# comandos
# --------------------------------------------------------------------------

def cmd_doctor(args) -> None:
    """Comprueba clave, red y que los IDs de modelo existan en OpenRouter."""
    cfg = cargar_config(getattr(args, "config", ""))
    print("\n== Comprobacion del consejo ==\n")

    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        print("  clave   : OK (variable de entorno)")
    elif leer_clave(obligatoria=False):
        print("  clave   : OK (fichero .env)")
    else:
        print("  clave   : FALTA  -> define OPENROUTER_API_KEY")

    try:
        datos = http_json(f"{API}/models", None, None, 60)
        disponibles = {m["id"]: m for m in datos.get("data", [])}
        print(f"  red     : OK (openrouter.ai alcanzable, {len(disponibles)} modelos)\n")
    except Exception as e:
        print(f"  red     : FALLO -> {type(e).__name__}: {e}")
        print("            El entorno cloud debe permitir el dominio openrouter.ai\n")
        return

    print("  Miembros configurados:\n")
    problemas = []
    for m in cfg["miembros"]:
        if m["modelo"] in disponibles:
            print(f"    OK    {m['id']} {m['fabricante']:<10} {m['modelo']}")
            continue
        pref = m["modelo"].split("/")[0]
        alt = [a for a in m.get("alternativas", []) if a in disponibles]
        otros = sorted(k for k in disponibles if k.startswith(pref + "/"))[:8]
        print(f"    NO EXISTE {m['id']} {m['fabricante']:<10} {m['modelo']}")
        if alt:
            print(f"          alternativa configurada valida: {alt[0]}")
        elif otros:
            print(f"          disponibles de {pref}: {', '.join(otros)}")
        problemas.append(m["id"])
    print()
    if problemas:
        print(f"  Corrige en {CONFIG} los miembros: {', '.join(problemas)}\n")
    else:
        print("  Consejo listo para deliberar.\n")


def cmd_init(args) -> None:
    cfg = cargar_config(getattr(args, "config", ""))
    pregunta = args.pregunta
    if args.fichero:
        pregunta = leer(args.fichero).strip()
    if not pregunta or not pregunta.strip():
        muere("hace falta --pregunta \"...\" o --fichero ruta.md")
    pregunta = pregunta.strip()
    if "ESCRIBE AQUI TU PREGUNTA" in pregunta.upper().replace("Í", "I"):
        muere("esa es la plantilla, no una pregunta. Escribe la pregunta real.")

    sello = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    slug = re.sub(r"[^a-z0-9]+", "-", pregunta.lower())[:40].strip("-")
    run = os.path.join(DIR_RUNS, f"{sello}-{slug}")
    for sub in ("ronda1", "ronda2", "ronda3"):
        os.makedirs(os.path.join(run, sub), exist_ok=True)

    todos = cfg["miembros"] + [SECRETARIO]
    letras = list("ABCDEF")[: len(todos)]
    random.shuffle(letras)
    alias = {m["id"]: letras[i] for i, m in enumerate(todos)}

    estado = {
        "creado": _dt.datetime.now().isoformat(timespec="seconds"),
        "pregunta": pregunta,
        "miembros": cfg["miembros"],
        "secretario": SECRETARIO,
        "alias": alias,
        "parametros": cfg["parametros"],
        "config": os.path.relpath(args.config or CONFIG, os.path.dirname(RAIZ)),
        "rondas_completadas": [],
    }
    guardar_estado(run, estado)
    escribir(os.path.join(run, "pregunta.md"), f"# Pregunta al consejo\n\n{pregunta}\n")
    with open(PUNTERO, "w", encoding="utf-8") as fh:
        fh.write(run)

    print(f"\nDeliberacion abierta: {run}")
    print("Alias anonimos asignados (solo los ve el secretario):")
    for m in todos:
        print(f"  Miembro {alias[m['id']]} = {m['id']} {m['fabricante']}")
    print("\nSiguiente: council.py ronda1\n")


def cmd_ronda1(args) -> None:
    run = run_actual()
    estado = cargar_estado(run)
    clave = leer_clave()
    log(f"RONDA 1 — {len(estado['miembros'])} miembros responden en paralelo, a ciegas")

    tareas = [(m, SIS_R1, prompt_r1(estado["pregunta"])) for m in estado["miembros"]]
    res = en_paralelo(tareas, clave, estado["parametros"])
    volcar_ronda(os.path.join(run, "ronda1"), res, estado)

    vivos = sum(1 for r in res.values() if r.get("ok"))
    estado["rondas_completadas"] = sorted(set(estado["rondas_completadas"] + ["ronda1"]))
    guardar_estado(run, estado)

    alias_sec = estado["alias"][SECRETARIO["id"]]
    pendiente = os.path.join(run, "ronda1", f"M6-anthropic.md")
    log(f"Ronda 1 guardada en {run}/ronda1 ({vivos}/{len(res)} respuestas)")
    print(
        f"\nPENDIENTE DEL SECRETARIO (Claude, Miembro {alias_sec}):\n"
        f"  1. Escribe tu propia respuesta de ronda 1 en:\n     {pendiente}\n"
        f"  2. Verifica las afirmaciones de los demas y anota el resultado en:\n"
        f"     {run}/ronda1/verificacion_secretario.md\n"
        f"  3. Extrae los puntos a votar en:\n     {run}/puntos.json\n"
        f'     formato: {{"puntos": [{{"id": "P1", "texto": "..."}}, ...]}}\n'
        f"  Luego: council.py ronda2\n"
    )


def cmd_ronda2(args) -> None:
    run = run_actual()
    estado = cargar_estado(run)
    clave = leer_clave()
    d1 = os.path.join(run, "ronda1")

    ruta_puntos = os.path.join(run, "puntos.json")
    if not os.path.exists(ruta_puntos):
        muere(
            f"falta {ruta_puntos}.\n"
            "  El secretario debe extraer los puntos a votar de la ronda 1:\n"
            '  {"puntos": [{"id": "P1", "texto": "afirmacion concreta"}, ...]}'
        )
    puntos = json.load(open(ruta_puntos, encoding="utf-8"))["puntos"]
    if not puntos:
        muere("puntos.json no tiene ningun punto")

    # dossier anonimo: cada miembro ve a todos menos a si mismo
    textos: dict[str, str] = {}
    todos = estado["miembros"] + [estado["secretario"]]
    for m in todos:
        nombre = f"{m['id']}-{m['fabricante'].lower()}.md"
        ruta = os.path.join(d1, nombre)
        if not os.path.exists(ruta):
            log(f"  aviso: sin respuesta de ronda 1 para {m['id']} ({nombre}); queda fuera del dossier")
            continue
        cuerpo = leer(ruta)
        # quitar la cabecera que delata al autor
        cuerpo = cuerpo.split("\n---\n\n", 1)[-1].strip()
        if cuerpo and "_Sin respuesta._" not in cuerpo:
            textos[m["id"]] = cuerpo

    if len(textos) < 2:
        muere("hacen falta al menos 2 respuestas de ronda 1 para debatir")

    log(f"RONDA 2 — debate anonimo sobre {len(puntos)} puntos, {len(textos)} respuestas en el dossier")

    tareas = []
    for m in estado["miembros"]:
        trozos = []
        for otro_id, cuerpo in sorted(textos.items(), key=lambda kv: estado["alias"][kv[0]]):
            if otro_id == m["id"]:
                continue  # nadie se ve a si mismo
            trozos.append(f"----- Miembro {estado['alias'][otro_id]} -----\n\n{cuerpo}\n")
        dossier = "\n".join(trozos)
        tareas.append((m, SIS_R2, prompt_r2(estado["pregunta"], dossier, puntos, estado["alias"][m["id"]])))

    res = en_paralelo(tareas, clave, estado["parametros"])
    carpeta = os.path.join(run, "ronda2")
    volcar_ronda(carpeta, res, estado)

    # extraer votos
    votos = {}
    for mid, r in res.items():
        if not r.get("ok"):
            votos[mid] = {"error": r.get("error")}
            continue
        d = extraer_json(r["texto"])
        if not d or "votos" not in d:
            votos[mid] = {"error": "no pude extraer el bloque JSON de votacion"}
            log(f"  aviso: {mid} no devolvio votacion parseable")
            continue
        limpio, raros = {}, []
        for pid, v in (d["votos"] or {}).items():
            if isinstance(v, str):
                v = {"voto": v, "motivo": ""}
            voto = str((v or {}).get("voto", "")).strip().upper().replace(" ", "_")
            if voto not in VOTOS_VALIDOS:
                raros.append(f"{pid}={voto or 'vacio'}")
                continue
            limpio[pid] = {"voto": voto, "motivo": (v.get("motivo") or "").strip()}
        votos[mid] = {
            "votos": limpio,
            "punto_irrenunciable": d.get("punto_irrenunciable", ""),
            "descartados": raros,
        }
    with open(os.path.join(carpeta, "votos.json"), "w", encoding="utf-8") as fh:
        json.dump({"puntos": puntos, "por_miembro": votos}, fh, ensure_ascii=False, indent=2)

    estado["rondas_completadas"] = sorted(set(estado["rondas_completadas"] + ["ronda2"]))
    guardar_estado(run, estado)

    log(f"Ronda 2 guardada en {carpeta} (votos en votos.json)")
    print(
        f"\nPENDIENTE DEL SECRETARIO:\n"
        f"  1. Lee las criticas y redacta la propuesta final en:\n"
        f"     {run}/propuesta_final.md\n"
        f"  2. Luego: council.py ronda3\n"
    )


def cmd_ronda3(args) -> None:
    run = run_actual()
    estado = cargar_estado(run)
    clave = leer_clave()
    ruta = args.propuesta or os.path.join(run, "propuesta_final.md")
    if not os.path.exists(ruta):
        muere(f"falta la propuesta final del secretario en {ruta}")
    propuesta = leer(ruta).strip()
    if len(propuesta) < 200:
        muere("la propuesta final parece vacia o truncada")

    log(f"RONDA 3 — firma de la propuesta final ({len(propuesta)} caracteres)")
    tareas = [(m, SIS_R3, prompt_r3(estado["pregunta"], propuesta)) for m in estado["miembros"]]
    res = en_paralelo(tareas, clave, estado["parametros"])
    carpeta = os.path.join(run, "ronda3")
    volcar_ronda(carpeta, res, estado)

    firmas = {}
    for mid, r in res.items():
        if not r.get("ok"):
            firmas[mid] = {"firma": "SIN_RESPUESTA", "error": r.get("error")}
            continue
        d = extraer_json(r["texto"]) or {}
        f = str(d.get("firma", "")).strip().upper().replace(" ", "_")
        if f not in FIRMAS_VALIDAS:
            log(f"  aviso: firma no parseable de {mid} ({f or 'vacia'})")
            f = "NO_PARSEABLE"
        reservas = d.get("reservas") or []
        if isinstance(reservas, str):
            reservas = [reservas]
        reservas = [str(x) for x in reservas if str(x).strip().lower() not in ("", "ninguna")]
        firmas[mid] = {
            "firma": f,
            "motivo": str(d.get("motivo", "")).strip(),
            "reservas": reservas,
            "cambio_minimo_para_firmar": str(d.get("cambio_minimo_para_firmar", "")).strip(),
        }
    with open(os.path.join(carpeta, "firmas.json"), "w", encoding="utf-8") as fh:
        json.dump(firmas, fh, ensure_ascii=False, indent=2)

    estado["rondas_completadas"] = sorted(set(estado["rondas_completadas"] + ["ronda3"]))
    guardar_estado(run, estado)
    log(f"Ronda 3 guardada en {carpeta} (firmas en firmas.json)")
    print("\nSiguiente: council.py recuento\n")


def cmd_recuento(args) -> None:
    """Cuenta votos y firmas y escribe recuento.md. El resumen en prosa lo firma el secretario."""
    run = run_actual()
    estado = cargar_estado(run)
    nombre = {m["id"]: m["fabricante"] for m in estado["miembros"]}
    nombre[estado["secretario"]["id"]] = estado["secretario"]["fabricante"]

    L = ["# Recuento de la deliberacion\n", f"**Pregunta:** {estado['pregunta']}\n"]
    L.append("## Consejo\n")
    L.append("| Miembro | Fabricante | Modelo | Alias | Rol |")
    L.append("|---|---|---|---|---|")
    for m in estado["miembros"]:
        L.append(f"| {m['id']} | {m['fabricante']} | `{m['modelo']}` | {estado['alias'][m['id']]} | vota |")
    s = estado["secretario"]
    L.append(f"| {s['id']} | {s['fabricante']} | `{s['modelo']}` | {estado['alias'][s['id']]} | secretario, NO vota |")
    L.append("")

    # --- votos ronda 2 ---
    rv = os.path.join(run, "ronda2", "votos.json")
    consenso, disenso = [], []
    if os.path.exists(rv):
        d = json.load(open(rv, encoding="utf-8"))
        puntos, por = d["puntos"], d["por_miembro"]
        votantes = [m["id"] for m in estado["miembros"]]

        L.append("## Votacion punto por punto (ronda 2)\n")
        L.append("Leyenda: `++` de acuerdo · `--` en desacuerdo · `~` matiz · `.` abstencion · `?` sin voto\n")
        simb = {"DE_ACUERDO": "++", "EN_DESACUERDO": "--", "MATIZ": "~", "ABSTENCION": "."}
        L.append("| Punto | " + " | ".join(f"{v}<br>{nombre[v]}" for v in votantes) + " | Resultado |")
        L.append("|---" * (len(votantes) + 2) + "|")

        for p in puntos:
            fila, cuenta = [], {k: 0 for k in VOTOS_VALIDOS}
            for v in votantes:
                voto = ((por.get(v) or {}).get("votos") or {}).get(p["id"], {}).get("voto")
                if voto in cuenta:
                    cuenta[voto] += 1
                fila.append(simb.get(voto, "?"))
            emitidos = sum(cuenta.values())
            favor = cuenta["DE_ACUERDO"] + cuenta["MATIZ"]
            # si no votaron los 5, no se puede hablar de unanimidad del consejo
            faltan = len(votantes) - emitidos
            coletilla = f", {faltan} sin voto" if faltan else ""
            if emitidos == 0:
                veredicto = "sin votos"
            elif cuenta["DE_ACUERDO"] == emitidos:
                etiqueta = "**unanime**" if not faltan else "acuerdo de los votantes"
                veredicto = f"{etiqueta} ({cuenta['DE_ACUERDO']}/{emitidos}{coletilla})"
                consenso.append((p, cuenta, emitidos, not faltan))
            elif favor == emitidos and cuenta["MATIZ"]:
                veredicto = (
                    f"acuerdo con matices ({cuenta['DE_ACUERDO']}+{cuenta['MATIZ']}~"
                    f"/{emitidos}{coletilla})"
                )
                consenso.append((p, cuenta, emitidos, False))
            elif favor > emitidos / 2:
                veredicto = f"mayoria a favor ({favor}/{emitidos}{coletilla})"
                disenso.append((p, cuenta, emitidos))
            else:
                veredicto = f"**sin acuerdo** ({favor} a favor de {emitidos}{coletilla})"
                disenso.append((p, cuenta, emitidos))
            L.append(f"| {p['id']}. {p['texto']} | " + " | ".join(fila) + f" | {veredicto} |")
        L.append("")

        L.append("### Donde estan DE ACUERDO\n")
        if consenso:
            for p, c, n, unan in consenso:
                if unan:
                    etiq = "unanimidad de los 5"
                elif c["MATIZ"]:
                    etiq = f"acuerdo con {c['MATIZ']} matiz(es), {n} votos emitidos"
                else:
                    etiq = f"acuerdo de los {n} que votaron"
                L.append(f"- **{p['id']}** ({etiq}): {p['texto']}")
        else:
            L.append("- Ningun punto alcanzo acuerdo pleno.")
        L.append("")

        L.append("### Donde NO estan de acuerdo\n")
        if disenso:
            for p, c, n in disenso:
                L.append(
                    f"- **{p['id']}**: {p['texto']}  \n"
                    f"  a favor {c['DE_ACUERDO']}, matiz {c['MATIZ']}, "
                    f"en contra {c['EN_DESACUERDO']}, abstencion {c['ABSTENCION']} (de {n} votos)"
                )
                for v in votantes:
                    e = ((por.get(v) or {}).get("votos") or {}).get(p["id"], {})
                    if e.get("voto") in ("EN_DESACUERDO", "MATIZ") and e.get("motivo"):
                        L.append(f"  - {nombre[v]} ({e['voto']}): {e['motivo']}")
        else:
            L.append("- Sin puntos en disputa.")
        L.append("")

        irr = [(nombre[v], (por.get(v) or {}).get("punto_irrenunciable", "")) for v in votantes]
        irr = [(a, b) for a, b in irr if b]
        if irr:
            L.append("### Lineas rojas declaradas\n")
            L += [f"- **{a}**: {b}" for a, b in irr]
            L.append("")
        fallos = [(nombre[v], (por.get(v) or {}).get("error")) for v in votantes if (por.get(v) or {}).get("error")]
        if fallos:
            L.append("### Incidencias de la ronda 2\n")
            L += [f"- {a}: {b}" for a, b in fallos]
            L.append("")
    else:
        L.append("## Votacion\n\n_Ronda 2 no ejecutada._\n")

    # --- firmas ronda 3 ---
    rf = os.path.join(run, "ronda3", "firmas.json")
    if os.path.exists(rf):
        firmas = json.load(open(rf, encoding="utf-8"))
        L.append("## Firma de la propuesta final (ronda 3)\n")
        L.append("| Miembro | Fabricante | Firma | Motivo |")
        L.append("|---|---|---|---|")
        etiq = {
            "FIRMO": "FIRMA",
            "FIRMO_CON_RESERVAS": "FIRMA CON RESERVAS",
            "NO_FIRMO": "NO FIRMA",
            "SIN_RESPUESTA": "sin respuesta",
            "NO_PARSEABLE": "ilegible",
        }
        c = {}
        for m in estado["miembros"]:
            f = firmas.get(m["id"], {})
            v = f.get("firma", "SIN_RESPUESTA")
            c[v] = c.get(v, 0) + 1
            motivo = (f.get("motivo") or f.get("error") or "").replace("\n", " ")[:180]
            L.append(f"| {m['id']} | {m['fabricante']} | **{etiq.get(v, v)}** | {motivo} |")
        L.append("")
        n = len(estado["miembros"])
        plenas, conres, no = c.get("FIRMO", 0), c.get("FIRMO_CON_RESERVAS", 0), c.get("NO_FIRMO", 0)
        L.append(
            f"**Resultado:** {plenas} firma(s) plena(s), {conres} con reservas, "
            f"{no} negativa(s), de {n} miembros votantes "
            f"(el secretario no firma como votante).\n"
        )
        if plenas == n:
            L.append("> Acuerdo **unanime y sin reservas**.\n")
        elif plenas + conres == n:
            L.append("> Acuerdo **unanime con reservas anexadas**.\n")
        elif plenas + conres > n / 2:
            L.append("> Acuerdo **por mayoria**, con voto particular en contra.\n")
        else:
            L.append("> **No hay acuerdo.** La propuesta no reune mayoria.\n")

        res = [(m["fabricante"], firmas.get(m["id"], {}).get("reservas") or []) for m in estado["miembros"]]
        res = [(a, b) for a, b in res if b]
        if res:
            L.append("### Reservas anexadas\n")
            for a, b in res:
                L.append(f"**{a}:**")
                L += [f"- {x}" for x in b]
                L.append("")
        for m in estado["miembros"]:
            f = firmas.get(m["id"], {})
            if f.get("firma") == "NO_FIRMO" and f.get("cambio_minimo_para_firmar"):
                L.append(f"### Voto particular — {m['fabricante']}\n")
                L.append(f"Cambio minimo que le haria firmar: {f['cambio_minimo_para_firmar']}\n")
    else:
        L.append("## Firma\n\n_Ronda 3 no ejecutada._\n")

    texto = "\n".join(L)
    escribir(os.path.join(run, "recuento.md"), texto)
    print(texto)
    print(f"\n[guardado en {run}/recuento.md]")


def main() -> None:
    p = argparse.ArgumentParser(description="LLM Council: 6 IAs deliberan en 3 rondas.")
    sub = p.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("doctor", help="comprueba clave, red y IDs de modelo")
    d.add_argument("--config", default="", help="fichero de miembros alternativo")
    d.set_defaults(f=cmd_doctor)

    i = sub.add_parser("init", help="abre una deliberacion nueva")
    i.add_argument("--pregunta", default="")
    i.add_argument("--fichero", default="", help="fichero con la pregunta")
    i.add_argument("--config", default="", help="fichero de miembros alternativo")
    i.set_defaults(f=cmd_init)

    sub.add_parser("ronda1", help="respuestas independientes").set_defaults(f=cmd_ronda1)
    sub.add_parser("ronda2", help="debate anonimo y votacion").set_defaults(f=cmd_ronda2)

    r3 = sub.add_parser("ronda3", help="firma de la propuesta final")
    r3.add_argument("--propuesta", default="")
    r3.set_defaults(f=cmd_ronda3)

    sub.add_parser("recuento", help="cuenta votos y firmas").set_defaults(f=cmd_recuento)

    args = p.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
