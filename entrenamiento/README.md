# Entrenar el modelo de Kairo

Aquí está todo lo que hace falta para crear los ejemplos con los que se
entrena el modelo de Kairo (`alonsofg29/Kairo` en Hugging Face).

| Archivo | Qué es |
|---|---|
| `preguntas.txt` | Las preguntas (unas 220). Puedes añadir las tuyas, una por línea. |
| `prompt_kairo.txt` | Cómo contesta Kairo. Sale de `kairo/src/lib/ia/prompt.ts`. |
| `generar_ejemplos.py` | El programa: pregunta a Gemini y guarda las respuestas como ejemplos. |

## Paso 1 · Las dos claves, en los Secretos de Colab

Nunca se pegan en el código ni se pasan a nadie.

1. Abre https://colab.research.google.com → **Nuevo cuaderno**.
2. A la izquierda, pulsa la **llave** (Secretos) → **Añadir nuevo secreto**:
   - Nombre `GEMINI_API_KEY`, valor: una clave de Google AI Studio
     (https://aistudio.google.com/apikey). Mejor una que no use Kairo,
     para no gastarle la cuota.
   - Nombre `HF_TOKEN`, valor: un token de Hugging Face de tipo **Write**
     (huggingface.co → tu foto → Settings → Access Tokens).
3. Activa el interruptor **Acceso al cuaderno** de los dos.

## Paso 2 · Probar con 5 preguntas

Pega esto en una celda y pulsa ▶:

```
!pip -q install -U google-genai huggingface_hub
!wget -q -O generar_ejemplos.py https://raw.githubusercontent.com/2011alonsofdez-creator/rateu/main/entrenamiento/generar_ejemplos.py
%run generar_ejemplos.py 5
```

Te enseña 5 respuestas. Léelas: ¿contesta como Kairo? Si algo no te gusta,
dímelo y se cambia el prompt antes de hacer las 220.

## Paso 3 · Hacerlas todas (unos 40 minutos)

En una celda nueva:

```
%run generar_ejemplos.py
```

Si se corta (Colab se duerme, se acaba la cuota…), vuelve a pulsar ▶: sigue
por donde iba. Al acabar lo sube solo a
`huggingface.co/datasets/alonsofg29/kairo-ejemplos`.

## Paso 4 · Revisarlas

En esa página de Hugging Face sale una tabla con todas. Lee una buena parte:
si una respuesta está mal o tiene un dato inventado, apúntala y se quita.
**Los ejemplos malos enseñan cosas malas.** Es la parte más importante.
