# Base de conocimiento de Kairo

Lo que Kairo tiene que saber y no está en el modelo: sus planes y precios, qué
puede y qué no, sus límites, preguntas frecuentes, cómo funcionan los créditos.

**Pero esta carpeta no viaja con la app, así que no llega al prompt.** Escribir
un hecho aquí no se lo enseña a Kairo: es la referencia de los agentes, y el
sitio donde se comprueba un dato antes de escribirlo en
`kairo/src/lib/ia/prompt.ts`, que es lo único que Kairo lee. Lo descubrió el
banco de pruebas el 23-10, después de tres días en que cuatro hechos de
privacidad escritos aquí no cambiaron ni una respuesta.

Un archivo por tema, en frases cortas y verificables —está pensado para que lo
lea una IA, no una persona—.

- **Nada inventado.** Lo no confirmado va marcado `(sin confirmar)`.
- Cada archivo empieza con su fecha de última revisión.
- Si un dato caduca (un precio, un límite), se anota cuándo revisarlo.
