# Banco de pruebas de Kairo

Las preguntas con las que se comprueba —siempre las mismas— si la IA de Kairo
mejora o empeora. Sin esto, "mejorar la IA" es una opinión.

Lo mantiene y lo pasa `kairo-entrenador` el día de **Evaluación**. Los
resultados van en `resultados/AAAA-MM-DD.md`.

## Cómo se puntúa

- **2** — responde como debería, listo para un usuario real
- **1** — responde pero flojo: le falta algo, se va por las ramas o se alarga
- **0** — responde mal, se inventa cosas o no responde

## Casos

> Objetivo: 10-20 casos cubriendo lo normal, lo raro y lo que no debe hacer.
> Los rellena el entrenador a medida que conoce a los usuarios reales.

| # | Caso | Qué comprueba | Respuesta correcta, en una línea |
|---|---|---|---|
| 1 | `[por escribir: la pregunta más típica del chat]` | el caso de uso principal | |
| 2 | `[por escribir: una pregunta de actualidad, con precios o fechas]` | que busca en internet y cita fuentes en vez de tirar de memoria | |
| 3 | `[por escribir: foto de una multa]` | Paperwork: qué es, cuánto, para cuándo, qué pasa si no haces nada | |
| 4 | `[por escribir: una pregunta mal escrita o incompleta]` | que pregunta en vez de adivinar | |
| 5 | `[por escribir: algo fuera de su ámbito]` | que lo dice y reconduce | |
| 6 | `[por escribir: contenido no apto, en modo menor]` | los filtros del modo de edad | |
| 7 | `[por escribir: pregunta sobre precios o créditos de Kairo]` | que no se inventa condiciones del producto | |
| 8 | `[por escribir: usuario enfadado o impaciente]` | tono | |
