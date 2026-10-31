# LLM Council

Un consejo de **6 IAs de fabricantes distintos** que delibera en 3 rondas hasta
llegar a un acuerdo (o hasta dejar el desacuerdo documentado, que también es un
resultado).

| Miembro | Fabricante | Rol |
|---|---|---|
| M1 | OpenAI | vota |
| M2 | Google (Gemini) | vota |
| M3 | xAI (Grok) | vota |
| M4 | DeepSeek | vota |
| M5 | Qwen | vota |
| M6 | Anthropic (Claude) | **secretario: coordina, verifica y redacta. NO vota** |

Los 5 votantes se llaman por la API de OpenRouter. El secretario es Claude
trabajando en esta sesión: sus aportaciones se escriben en ficheros y el script
las integra en el debate.

## Requisitos

1. **Clave**: `OPENROUTER_API_KEY` como variable de entorno del entorno cloud,
   o en un `.env` en la raíz del repo (ya está en `.gitignore`).
2. **Red**: el entorno debe permitir el dominio `openrouter.ai`.

Comprueba ambas cosas y que los IDs de modelo siguen existiendo:

```bash
python3 council/council.py doctor
```

### Dos configuraciones

- `council/miembros.json` — buques insignia de cada fabricante. Unos **0,50 $
  por deliberación** completa (15 llamadas).
- `council/miembros-economico.json` — gama baja, mismos cinco fabricantes, para
  probar el circuito por céntimos.

Para usar la económica, pásala en el `init`:

```bash
python3 council/council.py init --config council/miembros-economico.json --pregunta "..."
```

Si algún modelo ya no existe, `doctor` te lista las alternativas disponibles de
ese mismo fabricante para que las pongas en `council/miembros.json`.

## El proceso

### Ronda 1 — respuestas a ciegas

Los 5 miembros responden en paralelo sin ver nada de los demás. Cada uno separa
hechos verificables de juicios, marca su confianza y declara dónde puede estar
equivocado.

```bash
python3 council/council.py init --pregunta "¿...?"
python3 council/council.py ronda1
```

Luego el secretario:
- escribe su propia respuesta en `ronda1/M6-anthropic.md`;
- comprueba las afirmaciones verificables de los demás y anota el resultado en
  `ronda1/verificacion_secretario.md`;
- destila la deliberación en puntos votables en `puntos.json`:
  `{"puntos": [{"id": "P1", "texto": "..."}, ...]}`.

### Ronda 2 — debate anónimo y votación

Cada miembro recibe las respuestas de **los otros cinco** bajo alias (Miembro A,
B, C…), nunca la suya, y nunca con el nombre del fabricante. Critica, señala
errores concretos, nombra el mejor argumento ajeno, dice en qué ha cambiado de
opinión y vota punto por punto:

`DE_ACUERDO` · `EN_DESACUERDO` · `MATIZ` (de acuerdo bajo condición) · `ABSTENCION`

También declara su **línea roja**: el punto que, si cae, le impide firmar.

```bash
python3 council/council.py ronda2
```

**Si un miembro falla**, reintenta solo a ese en lugar de repetir (y repagar)
la ronda entera. Sus votos se fusionan con los ya emitidos:

```bash
python3 council/council.py ronda2 --solo M5
```

Funciona igual en la ronda 3. Admite varios: `--solo M3,M5`.

Si el fallo fue por falta de tokens, súbelos sobre la marcha. El `init` congela
los parámetros en `estado.json` para que la deliberación sea reproducible, así
que cambiar el fichero de configuración no afecta a una ya abierta:

```bash
python3 council/council.py ronda2 --solo M5 --max-tokens 12000
```

### Ronda 3 — firma

El secretario redacta `propuesta_final.md` a partir del debate. Cada miembro la
juzga sin reescribirla y responde: **firma**, **firma con reservas** (que se
anexan al acuerdo) o **no firma** (con el cambio mínimo que le haría firmar).

```bash
python3 council/council.py ronda3
python3 council/council.py recuento
```

## Comprobar que los seis están de verdad

```bash
python3 council/council.py lista
```

Pasa lista de la deliberación actual: quién es cada miembro, **qué modelo
respondió realmente** (el que OpenRouter dice que atendió, no el que pediste) y
en qué rondas participó. Avisa si el modelo servido no coincide con el
configurado, y cuenta cuántos fabricantes distintos han contestado.

Para una comprobación independiente de este código, contrasta con tu historial
real de llamadas en <https://openrouter.ai/activity>: ahí aparece cada llamada
con su modelo, sus tokens y su coste.

## Lo que queda guardado

```
council/runs/<fecha>-<pregunta>/
├── pregunta.md
├── estado.json              configuración y mapa de alias (solo el secretario)
├── puntos.json              puntos sometidos a votación
├── propuesta_final.md       redactada por el secretario
├── recuento.md              acuerdos, desacuerdos y votaciones (se regenera)
├── notas_secretario.md      incidencias; el recuento las incorpora al final
├── ronda1/  M1..M6.md · verificacion_secretario.md · _meta.json
├── ronda2/  M1..M5.md · votos.json · _meta.json
└── ronda3/  M1..M5.md · firmas.json · _meta.json
```

## Garantías de diseño

- **Anonimato real**: los alias se barajan en cada deliberación y el mapa vive
  solo en `estado.json`. Las cabeceras que identifican al autor se eliminan
  antes de montar el dossier. Hay una prueba que verifica que nadie se ve a sí
  mismo y que no se filtra ningún nombre de fabricante.
- **Fallos sin ruina**: si un miembro se cae o devuelve una votación ilegible,
  el consejo sigue; el recuento lo marca como `?` y lo registra en
  «Incidencias». Nunca se inventa un voto.
- **Recuento honesto**: si no votan los 5, el resultado no se llama «unánime»
  sino «acuerdo de los que votaron», con el número de ausencias.
- **Reintentos quirúrgicos**: `--solo M5` vuelve a llamar únicamente al miembro
  caído y fusiona su voto con los que ya estaban, sin repetir el gasto de los
  demás.
- **Modelos que razonan**: si un modelo agota su presupuesto de tokens pensando
  y no llega a escribir, el error lo dice y nombra la solución, en vez del
  inútil «respuesta vacía». Una respuesta truncada también se avisa.
- **Las notas no se pierden**: `recuento` se regenera entero cada vez, así que
  las incidencias van en `notas_secretario.md`, que nunca se sobrescribe y se
  incorpora al final del recuento.
- Sin dependencias externas: solo biblioteca estándar de Python.
