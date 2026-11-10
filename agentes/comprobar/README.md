# Comprobaciones automáticas de los agentes

Scripts que miran si lo que los agentes han escrito sigue siendo verdad. No
arreglan nada: avisan, con el archivo y la línea.

## `cifras.py`

```bash
python3 agentes/comprobar/cifras.py
```

Lee del **código** los números y los hechos del producto —lo que cuesta cada
nivel, lo que trae cada plan, el regalo de bienvenida, los topes de Co-Works y
Mentes, la galleta y el tope de la prueba sin cuenta— y comprueba que el
material de `agentes/` no diga otra cosa. Salida 0 si cuadra, 1 y la lista si no.

**Por qué existe.** Entre el 06 y el 10 de noviembre, **cuatro veces** un cambio
del dueño dejó falso algo nuestro:

| Cuándo | Qué quedó falso |
|---|---|
| 06-11 | la escala de créditos, en cuatro archivos de `agentes/ia/` |
| 06-11 | el caso 7 del banco de pruebas, que esperaba 120 y 1.000 |
| 07-11 | la política de cookies, que decía "no hay analítica" |
| 10-11 | *(evitado)* el tono de la prueba de la portada, que no tenía ninguno |

Las tres primeras se arreglaron a mano, y las tres veces la conclusión fue
"dejemos escrita una regla". La regla acabó escrita en **tres archivos
distintos**. Eso no es una regla: es la prueba de que se nos olvidó tres veces.
Esto es la regla hecha programa.

**Y funcionó en su primera ejecución**, que es lo que de verdad lo justifica:
encontró en `ejemplos/2026-11-03-limite-ayer-podia-usar-mega.md` un párrafo
entero con la escala vieja —*"un mensaje rápido, 1 crédito; uno normal, 4…"*—
**cuatro días después** del repaso a mano del 06-11, que se hizo con cuidado y
con 22 comprobaciones propias. A mano se nos escapó; al script, no.

### Quién lo pasa y cuándo

**El guardián, cada mañana**, dentro de su comprobación 9 (lo que lleva
demasiado tiempo pendiente): si falla, el desajuste va al backlog como 🟡 del
día, igual que cualquier otro hallazgo.

Y **el agente que escriba una cifra del producto**, antes de cerrar su turno.
Cuesta un segundo.

### Cuando el producto cambia

Si aparece una cifra nueva en el código —un tope, un precio, una galleta—, se
añade a este script **el mismo día**. Es lo único que hay que acordarse de
hacer, y es una línea.

### Lo que NO hace

- No juzga estilo, ni opiniones, ni si un texto está bien escrito.
- No mira `agentes/ia/diario-entrenamiento.md` ni los informes ni los partes:
  son **histórico** y dicen lo que era verdad el día que se escribieron. Tocarlos
  sería falsificar el registro, y el protocolo lo prohíbe (apartado 5).
- No mira `docs/kairo/ESPECIFICACION.md`: ahí las diferencias con el código son
  un hallazgo, no un error, y están contadas en
  `agentes/ia/conocimiento/creditos-y-planes.md`.
