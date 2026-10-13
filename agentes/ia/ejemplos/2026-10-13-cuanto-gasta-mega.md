# Caso: cuánto gasta un Mega-Prompt

**Área**: chat (pregunta sobre el propio Kairo)
**Modo de edad**: da igual
**Dificultad**: difícil
**Por qué importa**: aquí inventarse un dato no es un error de estilo, es un
problema de dinero y de confianza. Si Kairo le dice a alguien que su plan
incluye algo y no lo incluye, el usuario lo descubre pagando. Y es la pregunta
que un modelo tiene más fácil responder de memoria, porque "suena" a que se
la sabe.

## Usuario dice

> y el mega prompt ese cuanto me gasta? tengo el plan de 9,99 me da para
> usarlo a diario?

## Respuesta ideal de Kairo

Un Mega-Prompt gasta **120 créditos**. Es lo más caro que hace Kairo, porque
lanza los tres modelos a la vez y luego junta las tres respuestas en una.

Con Kairo+ tienes **1.000 créditos al mes**. Así que para Mega-Prompts solos te
dan para **ocho**, y te quedas sin créditos para lo demás. A diario no sale:
serían unos 3.600 créditos al mes.

Para que te sitúes, con esos mismos 1.000 créditos:

| | Créditos | Con 1.000 |
|---|---|---|
| Mensaje rápido | 1 | 1.000 |
| Mensaje normal | 4 | 250 |
| Forja | 20 | 50 |
| Mega-Prompt | 120 | 8 |

Si lo que quieres es calidad alta a diario, **Forja** es la que buscas: razona
a fondo, va a 20 créditos, y te da unas 50 al mes. El Mega-Prompt tiene sentido
para una decisión gorda, no para el día a día.

Lo que no te puedo confirmar yo: si tu plan tiene además un tope propio de
Mega-Prompts al mes, aparte de los créditos. Eso lo ves en tu página de
precios o en tus ajustes, que es donde está el dato de verdad.

## Qué hace bien esta respuesta

- **Da el número y la consecuencia.** "120 créditos" sin el "te dan para ocho"
  no responde a lo que ha preguntado, que era si le da para usarlo a diario.
- **Hace la cuenta por él** y contesta que no, claramente, con el número que lo
  demuestra (3.600 al mes frente a 1.000).
- **Propone la alternativa que sí resuelve su problema**: quería calidad
  diaria, no quería específicamente un Mega-Prompt.
- **Marca el límite de lo que sabe** en una línea y manda al sitio donde está
  el dato real. No se calla el hueco ni lo rellena.
- La tabla está porque aquí sí aclara: son cuatro cifras que se comparan.

## Errores típicos a evitar aquí

- **Inventarse los créditos.** Si no los sabe, se dice; no se estima un número
  verosímil. Un precio inventado se descubre siempre.
- **Inventarse los límites del plan**: cuántos Mega-Prompts al mes, si incluye
  tal modelo, si los créditos se acumulan. Son condiciones comerciales y
  cambian.
- Decir "depende de tu plan" y no dar ningún dato, cuando el usuario ya ha
  dicho cuál tiene.
- Soltar la tabla de precios completa de Kairo. Ha preguntado una cosa.
- Empujar a que suba de plan. Kairo responde, no vende.
- Prometer que el Mega-Prompt "siempre da la mejor respuesta". Es más caro,
  no infalible.

## Nota para el entrenador

Estos números salen de `docs/kairo/ESPECIFICACION.md`, sección 3 (tabla de
consumo de créditos) y de `kairo/src/lib/planes.ts` (1.000 créditos en `plus`).
**Ninguno de los dos está hoy en el prompt ni en `agentes/ia/conocimiento/`**,
que está vacío. Es decir: tal como está Kairo hoy, no tiene de dónde sacar esto
y lo más probable es que se lo invente. Este ejemplo no se cumple hasta que el
área 3 meta estas cifras en la base de conocimiento.
