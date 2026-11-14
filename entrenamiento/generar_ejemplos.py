# =============================================================
# Kairo · Generar los ejemplos de entrenamiento (para Google Colab)
#
# Le pasa cada pregunta de preguntas.txt a Gemini con el prompt de
# Kairo y guarda la respuesta como ejemplo en kairo.jsonl. Al final lo
# sube a tu dataset privado de Hugging Face.
#
# Uso en Colab (ver README.md):
#   %run generar_ejemplos.py 5    -> prueba: 5 preguntas, las enseña y no sube nada
#   %run generar_ejemplos.py      -> todas; si se corta, vuelve a lanzarlo y sigue
#
# Las claves NO van aquí: se leen de los "Secretos" de Colab (la llave
# de la izquierda): GEMINI_API_KEY y HF_TOKEN.
# =============================================================

import json
import os
import random
import sys
import time
import urllib.request

from google import genai
from google.genai import types
from google.colab import userdata

REPO = "https://raw.githubusercontent.com/2011alonsofdez-creator/rateu/main/entrenamiento"
DATASET = "alonsofg29/kairo-ejemplos"
SALIDA = "kairo.jsonl"

# El sistema que verá el modelo entrenado: corto a propósito. La forma de
# contestar la tiene que aprender de los ejemplos, no de un prompt largo.
SISTEMA_ENTRENO = (
    "Eres Kairo, el asistente que trabaja cuando tú no. "
    "Respondes en español de España, de tú, y vas al grano."
)

# Los modelos se eligen al arrancar, preguntándole a Google cuáles hay con
# tu clave (ver elegir_modelos). Estos solo se usan si esa pregunta falla.
MODELOS = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
PAUSA = 6.5  # segundos entre preguntas, para no pasar del límite gratis

# Señales de una respuesta que NO tiene la forma de Kairo.
MALAS = [
    "qué buena pregunta",
    "como modelo de lenguaje",
    "como ia, no",
    "soy gemini",
    "soy un modelo de google",
    "entrenado por google",
    "¿quieres que te explique algo más",
]


def bajar(nombre):
    if os.path.exists(nombre):
        return open(nombre, encoding="utf-8").read()
    with urllib.request.urlopen(f"{REPO}/{nombre}") as r:
        return r.read().decode("utf-8")


def preguntas():
    lineas = bajar("preguntas.txt").splitlines()
    return [l.strip() for l in lineas if l.strip() and not l.strip().startswith("#")]


def ya_hechas():
    if not os.path.exists(SALIDA):
        return set()
    hechas = set()
    for l in open(SALIDA, encoding="utf-8"):
        try:
            hechas.add(json.loads(l)["messages"][1]["content"])
        except Exception:
            pass
    return hechas


def es_buena(texto):
    if not texto or len(texto.strip()) < 2 or len(texto) > 7000:
        return False
    bajo = texto.lower()
    return not any(m in bajo for m in MALAS)


def elegir_modelos(cliente):
    """Los Flash que tu clave puede usar, del más nuevo al más viejo.
    Cada uno tiene su propia cuota gratis: si uno se agota, se pasa al otro."""
    global MODELOS
    try:
        nombres = []
        for m in cliente.models.list():
            nombre = m.name.split("/")[-1]
            acciones = getattr(m, "supported_actions", None) or []
            if acciones and "generateContent" not in acciones:
                continue
            raro = ("image", "tts", "audio", "live", "embedding", "thinking", "exp")
            if "flash" in nombre and not any(r in nombre for r in raro):
                nombres.append(nombre)

        def orden(n):
            cifras = "".join(c if c.isdigit() or c == "." else " " for c in n).split()
            version = float(cifras[0]) if cifras and cifras[0].count(".") <= 1 else 0
            return ("lite" in n, "preview" in n, -version, n)

        nombres = sorted(set(nombres), key=orden)
        if nombres:
            MODELOS = nombres[:5]
    except Exception as e:
        print(f"(no he podido pedir la lista de modelos: {str(e)[:120]})")
    print("Modelos que voy a usar:", ", ".join(MODELOS), "\n")


def contestar(cliente, sistema, pregunta, modelo_i):
    """Devuelve (texto, modelo_i). Si un modelo se queda sin cuota, pasa al otro."""
    for intento in range(6):
        modelo = MODELOS[modelo_i % len(MODELOS)]
        try:
            r = cliente.models.generate_content(
                model=modelo,
                contents=pregunta,
                config=types.GenerateContentConfig(
                    system_instruction=sistema,
                    temperature=0.7,
                ),
            )
            return (r.text or "").strip(), modelo_i
        except Exception as e:
            msg = str(e)
            if "404" in msg or "NOT_FOUND" in msg:
                # Ese modelo no existe con esta clave: al siguiente, sin esperar.
                print(f"   · {modelo} no está disponible, paso al siguiente")
                modelo_i += 1
            elif "503" in msg or "UNAVAILABLE" in msg:
                # Saturado un momento: al siguiente modelo, con un respiro corto.
                print(f"   · {modelo} saturado, pruebo otro")
                modelo_i += 1
                time.sleep(8)
            elif "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                modelo_i += 1
                espera = 20 if intento < 2 else 65
                print(f"   · {modelo} sin cuota, pruebo otro en {espera}s")
                time.sleep(espera)
            else:
                print(f"   · error: {msg[:150]}")
                time.sleep(5)
    return "", modelo_i


def subir():
    try:
        token = userdata.get("HF_TOKEN")
    except Exception:
        token = None
    if not token:
        print("\nNo hay HF_TOKEN en los Secretos: no se sube. El archivo está en kairo.jsonl.")
        return
    from huggingface_hub import HfApi

    api = HfApi(token=token)
    api.create_repo(DATASET, repo_type="dataset", private=True, exist_ok=True)
    api.upload_file(
        path_or_fileobj=SALIDA,
        path_in_repo="data/train.jsonl",
        repo_id=DATASET,
        repo_type="dataset",
    )
    print(f"\nSubido a https://huggingface.co/datasets/{DATASET}")


def main():
    prueba = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    sistema = bajar("prompt_kairo.txt")
    todas = preguntas()
    cliente = genai.Client(
        api_key=userdata.get("GEMINI_API_KEY"),
        http_options=types.HttpOptions(api_version="v1beta"),
    )
    elegir_modelos(cliente)

    if prueba:
        lista = random.sample(todas, min(prueba, len(todas)))
        print(f"PRUEBA con {len(lista)} preguntas (no se guarda ni se sube nada)\n")
        modelo_i = 0
        for p in lista:
            texto, modelo_i = contestar(cliente, sistema, p, modelo_i)
            marca = "OK" if es_buena(texto) else "DESCARTADA"
            print("=" * 70)
            print(f"PREGUNTA: {p}\n[{marca}]\n{texto}\n")
            time.sleep(PAUSA)
        return

    hechas = ya_hechas()
    pendientes = [p for p in todas if p not in hechas]
    print(f"{len(todas)} preguntas · {len(hechas)} ya hechas · faltan {len(pendientes)}")
    print(f"Tardará unos {round(len(pendientes) * (PAUSA + 4) / 60)} minutos.\n")

    buenas = descartadas = 0
    modelo_i = 0
    with open(SALIDA, "a", encoding="utf-8") as f:
        for i, p in enumerate(pendientes, 1):
            texto, modelo_i = contestar(cliente, sistema, p, modelo_i)
            if es_buena(texto):
                fila = {
                    "messages": [
                        {"role": "system", "content": SISTEMA_ENTRENO},
                        {"role": "user", "content": p},
                        {"role": "assistant", "content": texto},
                    ]
                }
                f.write(json.dumps(fila, ensure_ascii=False) + "\n")
                f.flush()
                buenas += 1
            else:
                descartadas += 1
                print(f"   · descartada: {p}")
            if i % 10 == 0:
                print(f"{i}/{len(pendientes)} · buenas {buenas} · descartadas {descartadas}")
            time.sleep(PAUSA)

    print(f"\nHecho: {buenas} buenas, {descartadas} descartadas.")
    subir()


main()
