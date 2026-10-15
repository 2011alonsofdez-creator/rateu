# La primera prueba

Una app pequeña de verdad, para ver el bucle entero funcionando sin que
un modelo gratis se atragante. Si esta sale, el generador te sirve. Si
esta no sale, no vas a perder la tarde con una grande.

Antes de empezar: los pasos 1 a 7 de `GUIA.md` hechos, y VS Code con la
carpeta `FabricaDeApps` abierta.

---

## Lo que le vas a pedir

Pega esto tal cual en el chat de Cline:

```
Hazme una app de una sola página llamada "plazos" que haga esto:

- Un campo para escribir una fecha (la fecha límite de algo).
- Debajo, en grande, cuántos días quedan hasta esa fecha.
- Y tres avisos encendidos o apagados según lo cerca que esté:
  7 días, 3 días y 1 día. Encendido = ya has pasado ese punto.
- Si la fecha ya pasó, que lo diga claramente en rojo.

En español, modo oscuro, sin base de datos y sin cuentas de usuario.
Todo en el navegador.
```

Está elegida a propósito: **no necesita internet, ni base de datos, ni
claves de nada.** Es la que más posibilidades tiene de salir bien a la
primera con un modelo gratis. Y de paso hace lo mismo que los avisos de
Paperwork, para que veas la idea suelta.

---

## Lo que tienes que ver, por orden

| Fase | Qué verás | Cuánto tarda |
|---|---|---|
| **Plan** | un `blueprint.md` nuevo en `Blueprints` | 1-3 min |
| **Crear** | un comando largo con `create-next-app` y mucho texto pasando | 1-2 min |
| **Programar** | archivos apareciendo dentro de `AppsGeneradas` | 5-15 min |
| **Compilar** | `npm run build`, y seguramente errores | 2-5 min |
| **Arreglarse** | abre el archivo del error, lo corrige, compila otra vez | lo que haga falta |

**Que salgan errores en «compilar» es lo normal, no es que vaya mal.**
Esa fase existe justo para eso. Lo que quieres ver es que los lee y los
arregla él.

Con modelos gratis, **la cosa entera puede llevar media hora**. No es
que esté colgado: es que está en cola.

---

## Cómo saber si se ha atascado de verdad

| Señal | Qué es | Qué haces |
|---|---|---|
| Lleva 5 min sin escribir **nada** | cola del modelo gratis | espera un poco más |
| Repite el **mismo error** tres veces | se ha atascado | se para solo (está en las reglas) — cambia de modelo |
| «model not found» o parecido | ese modelo ya no existe | coge otro de la lista Free |
| Pide permiso y no avanza | es a propósito | dale a aceptar |

Si cambias de modelo: panel de Cline → donde pone el nombre del modelo →
pegas otro de los dos o tres que copiaste. **No hace falta empezar de
cero**, retoma donde estaba.

---

## Cuando diga que ha terminado

En VS Code, abre una terminal (`Ctrl + ñ`) y escribe:

```
cd AppsGeneradas/plazos
npm run dev
```

Te va a decir algo como `http://localhost:3000`. Ábrelo en el navegador.

**Eso es tu app**, corriendo en tu ordenador. Solo tú la ves — no está
en internet, y para ponerla en internet haría falta todo lo que hemos
hecho con Kairo estas semanas (Vercel, dominio, variables…).

Para pararla: `Ctrl + C` en la terminal.

---

## Qué mirar para decidir si te sirve

No mires si la app es bonita. Mira estas tres:

1. **¿Entendió lo que le pediste?** — los tres avisos de 7, 3 y 1 día,
   ¿están?
2. **¿Se arregló sus propios errores?** — esto es lo que lo separa de
   pedirle código a una IA cualquiera.
3. **¿Cuánto tuviste que intervenir?** — si acabaste explicándoselo
   todo tres veces, con modelos gratis no te va a compensar para nada
   grande.

Si las tres van bien, tienes una herramienta. Si no, ya sabes que no, y
te ha costado media tarde en vez de una semana.
