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
#   %run generar_ejemplos.py revisar -> descarga revisar.csv para revisarlas
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
try:
    from google.colab import userdata  # en Colab: la llave de "Secretos"
except ImportError:
    userdata = None  # fuera de Colab (GitHub): variables de entorno


def secreto(nombre):
    """Lee una clave de los Secretos de Colab o, fuera de Colab, del entorno."""
    if userdata is not None:
        try:
            return userdata.get(nombre)
        except Exception:
            return None
    return os.environ.get(nombre) or None

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


def rehacer():
    """Quita de kairo.jsonl las respuestas de las preguntas de rehacer.txt,
    para que se vuelvan a generar (por ejemplo, si cambió el prompt)."""
    if not os.path.exists(SALIDA):
        return
    try:
        lista = {l.strip() for l in bajar("rehacer.txt").splitlines()
                 if l.strip() and not l.strip().startswith("#")}
    except Exception:
        return
    filas = open(SALIDA, encoding="utf-8").read().splitlines()
    quedan = [f for f in filas if f.strip() and json.loads(f)["messages"][1]["content"] not in lista]
    if len(quedan) != len(filas):
        with open(SALIDA, "w", encoding="utf-8") as f:
            f.write("\n".join(quedan) + ("\n" if quedan else ""))
        print(f"Quitadas {len(filas) - len(quedan)} respuestas para rehacerlas.")


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
            # Los Flash primero; los "lite" al final, para cuando los
            # otros estén todos sin cuota y no quedarse parado.
            MODELOS = nombres[:8]
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
            if "timed out" in msg.lower() or "timeout" in msg.lower() or "deadline" in msg.lower():
                print(f"   · {modelo} no contesta, pruebo otro")
                modelo_i += 1
            elif "404" in msg or "NOT_FOUND" in msg:
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


def token_hf():
    return secreto("HF_TOKEN")


def subir(callado=False):
    """Sube kairo.jsonl a tu dataset privado. Se llama cada 5 ejemplos y al
    final: si Colab se desconecta (y borra sus archivos), lo hecho ya está
    a salvo en Hugging Face."""
    token = token_hf()
    if not token:
        if not callado:
            print("\nNo hay HF_TOKEN en los Secretos: no se sube. El archivo está en kairo.jsonl.")
        return
    from huggingface_hub import HfApi

    try:
        api = HfApi(token=token)
        api.create_repo(DATASET, repo_type="dataset", private=True, exist_ok=True)
        api.upload_file(
            path_or_fileobj=SALIDA,
            path_in_repo="data/train.jsonl",
            repo_id=DATASET,
            repo_type="dataset",
        )
        if not callado:
            print(f"\nSubido a https://huggingface.co/datasets/{DATASET}")
    except Exception as e:
        print(f"   · no se ha podido subir ahora ({str(e)[:100]}); se reintenta luego")


def recuperar():
    """Si en este Colab no está kairo.jsonl (se desconectó y lo borró), lo
    baja de Hugging Face para seguir por donde iba."""
    if os.path.exists(SALIDA):
        return
    token = token_hf()
    if not token:
        return
    try:
        from huggingface_hub import hf_hub_download

        ruta = hf_hub_download(
            DATASET, "data/train.jsonl", repo_type="dataset", token=token
        )
        with open(ruta, encoding="utf-8") as origen, open(SALIDA, "w", encoding="utf-8") as destino:
            destino.write(origen.read())
        print("Recuperado de Hugging Face lo que ya estaba hecho.")
    except Exception:
        pass  # todavía no hay nada subido: se empieza de cero


def revisar():
    """Crea revisar.csv (pregunta, respuesta, columna "quitar") y lo descarga."""
    import pandas as pd
    from google.colab import files

    recuperar()
    if not os.path.exists(SALIDA):
        print("Todavía no hay ejemplos. Primero: %run generar_ejemplos.py")
        return
    filas = [json.loads(l)["messages"] for l in open(SALIDA, encoding="utf-8")]
    tabla = pd.DataFrame(
        {
            "pregunta": [f[1]["content"] for f in filas],
            "respuesta": [f[2]["content"] for f in filas],
            "quitar": "",
        }
    )
    tabla.to_csv("revisar.csv", index=False)
    files.download("revisar.csv")
    print(f"{len(tabla)} ejemplos en revisar.csv")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "revisar":
        return revisar()
    prueba = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    sistema = bajar("prompt_kairo.txt")
    todas = preguntas()
    cliente = genai.Client(
        api_key=secreto("GEMINI_API_KEY"),
        # 90 s como mucho por respuesta. Sin esto, con Gemini saturado una
        # sola pregunta se quedó colgada 50 minutos esperando.
        http_options=types.HttpOptions(api_version="v1beta", timeout=90_000),
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

    recuperar()
    rehacer()
    hechas = ya_hechas()
    pendientes = [p for p in todas if p not in hechas]
    print(f"{len(todas)} preguntas · {len(hechas)} ya hechas · faltan {len(pendientes)}")
    print(f"Tardará unos {round(len(pendientes) * (PAUSA + 4) / 60)} minutos.\n")

    buenas = descartadas = seguidas_malas = 0
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
                seguidas_malas = 0
                if buenas % 5 == 0:
                    subir(callado=True)
            else:
                descartadas += 1
                seguidas_malas += 1
                print(f"   · descartada: {p}")
                # Cinco seguidas sin respuesta: no es la pregunta, es que la
                # clave se ha quedado sin cuota por hoy. Se guarda y se para.
                if seguidas_malas >= 5:
                    print("\nCinco seguidas sin respuesta: la cuota de hoy está agotada.")
                    print("Lo hecho queda guardado. Vuelve a lanzarlo mañana y sigue por aquí.")
                    break
            if i % 10 == 0:
                print(f"{i}/{len(pendientes)} · buenas {buenas} · descartadas {descartadas}")
            time.sleep(PAUSA)

    print(f"\nHecho: {buenas} buenas, {descartadas} descartadas.")
    subir()


main()
