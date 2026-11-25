# =============================================================
# Kairo · Entrenar el modelo (para Google Colab con GPU T4, gratis)
#
# Uso (ver README.md, "Entrenar"):
#   %run entrenar.py examen        -> examen al modelo base, SIN entrenar
#   %run entrenar.py               -> entrena con kairo-ejemplos y sube a alonsofg29/Kairo
#   %run entrenar.py examen-kairo  -> el mismo examen al modelo YA entrenado
#   %run entrenar.py todo          -> TODO DE UNA VEZ: examen, entrenar, examen, comparar
#
# Necesita el secreto HF_TOKEN (la llave de la izquierda de Colab), el
# mismo que usaste para los ejemplos.
#
# Qué hace: LoRA. No cambia el modelo entero (no cabría en una GPU
# gratis): le añade una capa pequeña que aprende la forma de contestar
# de Kairo. Esa capa es lo que se sube a Hugging Face.
# =============================================================

import json
import sys

try:  # Unsloth quiere ir el primero para acelerar todo lo demás
    import unsloth  # noqa: F401
except Exception:
    pass
import urllib.request

from google.colab import userdata

# El modelo base. Gemma 4 E4B: pequeño para caber en la GPU gratis de
# Colab, y bueno en español. Se prueban en orden hasta que uno cargue.
BASES = ["unsloth/gemma-4-E4B-it", "google/gemma-4-E4B-it"]
DATASET = "alonsofg29/kairo-ejemplos"
DESTINO = "alonsofg29/Kairo"
REPO = "https://raw.githubusercontent.com/2011alonsofdez-creator/rateu/main/entrenamiento"
SISTEMA = (
    "Eres Kairo, el asistente que trabaja cuando tú no. "
    "Respondes en español de España, de tú, y vas al grano."
)
LARGO = 2048  # tokens por ejemplo: de sobra para las respuestas de Kairo

TOKEN = userdata.get("HF_TOKEN")


def pasadas(n):
    """Cuántas veces lee los ejemplos. Con pocos (menos de 150), tres: con
    dos apenas cambia nada. Con muchos, dos: con más se los aprende de
    memoria en vez de aprender la forma de contestar."""
    return 3 if n < 150 else 2


def precision():
    """La T4 gratis de Colab no sabe bf16, y Gemma 4 en fp16 se rompe:
    ahí se entrena en fp32 (más lento, pero funciona). Con una GPU buena,
    bf16."""
    try:
        from unsloth import is_bfloat16_supported

        bf16 = bool(is_bfloat16_supported())
    except Exception:
        bf16 = False
    return {"bf16": bf16, "fp16": False}


def cargar(nombre_o_lista):
    """Carga el modelo en 4 bits (para que quepa en la GPU gratis)."""
    from unsloth import FastModel

    nombres = nombre_o_lista if isinstance(nombre_o_lista, list) else [nombre_o_lista]
    ultimo = None
    for n in nombres:
        try:
            print(f"Cargando {n}…")
            modelo, tok = FastModel.from_pretrained(
                n, max_seq_length=LARGO, load_in_4bit=True, token=TOKEN
            )
            return modelo, tok
        except Exception as e:
            ultimo = e
            print(f"   · no he podido con {n}: {str(e)[:160]}")
    raise SystemExit(f"No se ha podido cargar ningún modelo. Último error: {ultimo}")


def mensajes(sistema, pregunta, respuesta=None):
    """Los mensajes con el sistema metido en la pregunta: algunos modelos
    no aceptan un mensaje de sistema aparte y fallan en silencio."""
    m = [{"role": "user", "content": f"{sistema}\n\n{pregunta}"}]
    if respuesta is not None:
        m.append({"role": "assistant", "content": respuesta})
    return m


def contestar(modelo, tok, pregunta, maximo=500):
    import torch

    texto = tok.apply_chat_template(
        mensajes(SISTEMA, pregunta), tokenize=False, add_generation_prompt=True
    )
    entrada = tok(text=texto, return_tensors="pt").to("cuda")
    with torch.no_grad():
        salida = modelo.generate(**entrada, max_new_tokens=maximo, do_sample=False)
    nuevo = salida[0][entrada["input_ids"].shape[1]:]
    return tok.decode(nuevo, skip_special_tokens=True).strip()


def preguntas_examen():
    with urllib.request.urlopen(f"{REPO}/examen.txt") as r:
        lineas = r.read().decode("utf-8").splitlines()
    preguntas = []
    for l in lineas:
        l = l.strip()
        if not l or l.startswith("#"):
            continue
        if l.startswith("→") and preguntas:
            preguntas[-1][1] = l[1:].strip()
        else:
            preguntas.append([l, ""])
    return preguntas


def examen(nombre):
    preguntas = preguntas_examen()
    modelo, tok = cargar(nombre)
    from unsloth import FastModel

    FastModel.for_inference(modelo)
    for i, (p, esperado) in enumerate(preguntas, 1):
        print("=" * 72)
        print(f"{i}. {p}\nDEBE: {esperado}\n")
        print(contestar(modelo, tok, p))
    print("=" * 72)
    print("Puntúa cada una: bien, regular o mal. Apúntalo para comparar.")


def entrenar():
    from datasets import Dataset
    from huggingface_hub import hf_hub_download
    from trl import SFTConfig, SFTTrainer
    from unsloth import FastModel

    ruta = hf_hub_download(DATASET, "data/train.jsonl", repo_type="dataset", token=TOKEN)
    filas = [json.loads(l) for l in open(ruta, encoding="utf-8") if l.strip()]
    print(f"{len(filas)} ejemplos")
    if len(filas) < 50:
        raise SystemExit("Hay menos de 50 ejemplos: genera más antes de entrenar.")

    modelo, tok = cargar(BASES)
    modelo = FastModel.get_peft_model(
        modelo,
        finetune_vision_layers=False,  # Kairo aprende a escribir, no a ver
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=16,
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        random_state=3407,
    )

    textos = []
    for f in filas:
        m = f["messages"]
        textos.append(
            tok.apply_chat_template(
                mensajes(SISTEMA, m[1]["content"], m[2]["content"]), tokenize=False
            )
        )
    datos = Dataset.from_list([{"text": t} for t in textos])

    ajustes = dict(
        dataset_text_field="text",
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=pasadas(len(filas)),
        learning_rate=2e-4,
        warmup_steps=5,
        logging_steps=5,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="salida",
        report_to="none",
        **precision(),
    )
    try:
        config = SFTConfig(max_length=LARGO, **ajustes)
    except TypeError:  # versiones viejas de trl lo llaman distinto
        config = SFTConfig(max_seq_length=LARGO, **ajustes)
    try:
        entrenador = SFTTrainer(model=modelo, processing_class=tok, train_dataset=datos, args=config)
    except TypeError:
        entrenador = SFTTrainer(model=modelo, tokenizer=tok, train_dataset=datos, args=config)

    print("Entrenando… (con unos 300 ejemplos, 20-40 minutos)")
    entrenador.train()

    print("\nPrueba rápida:")
    FastModel.for_inference(modelo)
    for p in ["hola", "q es un cowork", "me ha llegado una multa de 200 euros q hago"]:
        print(f"\n> {p}\n{contestar(modelo, tok, p, 300)}")

    print(f"\nSubiendo a https://huggingface.co/{DESTINO} (privado)…")
    modelo.push_to_hub(DESTINO, token=TOKEN, private=True)
    tok.push_to_hub(DESTINO, token=TOKEN, private=True)
    print("Hecho. Ahora: %run entrenar.py examen-kairo")


def todo():
    """TODO DE UNA VEZ, para pulsar ▶ una sola vez: examen antes, entrenar,
    examen después, comparación y subida a Hugging Face."""
    from datasets import Dataset
    from huggingface_hub import hf_hub_download
    from trl import SFTConfig, SFTTrainer
    from unsloth import FastModel

    ruta = hf_hub_download(DATASET, "data/train.jsonl", repo_type="dataset", token=TOKEN)
    filas = [json.loads(l) for l in open(ruta, encoding="utf-8") if l.strip()]
    print(f"\n▶ {len(filas)} ejemplos para entrenar")
    if len(filas) < 50:
        raise SystemExit("Hay menos de 50 ejemplos: genera más antes de entrenar.")

    preguntas = preguntas_examen()
    modelo, tok = cargar(BASES)

    import os

    if os.path.exists("examen-antes.json"):
        print("\n▶ 1/4 · Examen ANTES: ya estaba hecho, lo reutilizo")
        antes = json.load(open("examen-antes.json", encoding="utf-8"))
    else:
        print("\n▶ 1/4 · Examen ANTES de entrenar (unos 10 minutos)…")
        FastModel.for_inference(modelo)
        antes = []
        for i, (p, _) in enumerate(preguntas, 1):
            antes.append(contestar(modelo, tok, p, 300))
            print(f"   {i}/{len(preguntas)}")
        json.dump(antes, open("examen-antes.json", "w", encoding="utf-8"), ensure_ascii=False)

    print("\n▶ 2/4 · Entrenando (20-40 minutos)…")
    FastModel.for_training(modelo)
    modelo = FastModel.get_peft_model(
        modelo, finetune_vision_layers=False, finetune_language_layers=True,
        finetune_attention_modules=True, finetune_mlp_modules=True,
        r=16, lora_alpha=16, lora_dropout=0, bias="none", random_state=3407,
    )
    textos = [
        tok.apply_chat_template(
            mensajes(SISTEMA, f["messages"][1]["content"], f["messages"][2]["content"]), tokenize=False
        )
        for f in filas
    ]
    datos = Dataset.from_list([{"text": t} for t in textos])
    ajustes = dict(
        dataset_text_field="text", per_device_train_batch_size=2, gradient_accumulation_steps=4,
        num_train_epochs=pasadas(len(filas)), learning_rate=2e-4, warmup_steps=5, logging_steps=5, optim="adamw_8bit",
        weight_decay=0.01, lr_scheduler_type="linear", seed=3407, output_dir="salida", report_to="none",
        **precision(),
    )
    try:
        config = SFTConfig(max_length=LARGO, **ajustes)
    except TypeError:
        config = SFTConfig(max_seq_length=LARGO, **ajustes)
    try:
        SFTTrainer(model=modelo, processing_class=tok, train_dataset=datos, args=config).train()
    except TypeError:
        SFTTrainer(model=modelo, tokenizer=tok, train_dataset=datos, args=config).train()

    print("\n▶ 3/4 · Examen DESPUÉS de entrenar (unos 10 minutos)…")
    FastModel.for_inference(modelo)
    despues = []
    for i, (p, _) in enumerate(preguntas, 1):
        despues.append(contestar(modelo, tok, p, 300))
        print(f"   {i}/{len(preguntas)}")

    print("\n▶ 4/4 · Subiendo a https://huggingface.co/" + DESTINO + " (privado)…")
    modelo.push_to_hub(DESTINO, token=TOKEN, private=True)
    tok.push_to_hub(DESTINO, token=TOKEN, private=True)
    resultado = [
        {"pregunta": p, "debe": e, "antes": a, "despues": d}
        for (p, e), a, d in zip(preguntas, antes, despues)
    ]
    with open("examen-resultado.json", "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=1)
    from huggingface_hub import HfApi
    HfApi(token=TOKEN).upload_file(
        path_or_fileobj="examen-resultado.json", path_in_repo="examen-resultado.json",
        repo_id=DESTINO, repo_type="model",
    )

    print("\n" + "=" * 72 + "\nRESULTADO: ANTES vs DESPUÉS\n" + "=" * 72)
    for i, r in enumerate(resultado, 1):
        print(f"\n{i}. {r['pregunta']}\nDEBE: {r['debe']}")
        print(f"\n--- ANTES ---\n{r['antes'][:600]}")
        print(f"\n--- DESPUÉS ---\n{r['despues'][:600]}")
        print("-" * 72)
    print("\n✅ TERMINADO. Copia todo lo de arriba (o haz capturas) y mándaselo a Claude.")


modo = sys.argv[1] if len(sys.argv) > 1 else "entrenar"
if modo == "examen":
    examen(BASES)
elif modo == "examen-kairo":
    examen(DESTINO)
elif modo == "todo":
    todo()
else:
    entrenar()
