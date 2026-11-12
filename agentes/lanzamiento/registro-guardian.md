# Registro diario del guardián

Una línea por día. Para que la racha se vea de un vistazo.

Leyenda: 🟢 todo bien · 🟡 cosas por atender · 🔴 algo roto ·
⚪ no comprobable desde la sede (sin permiso de red, ver backlog P1)

| Fecha | Estado | Web | Reloj | Agentes | Hallazgo |
|---|---|---|---|---|---|
| 2026-10-12 | 🟡 | ok (indirecto, 200) | ok, pero tarde | ok, primer día | faltan CONTEXTO, backlog, OG y robots |
| 2026-10-13 | 🟡 | ok (indirecto, 200) | verde, pero 3 veces en 24 h | ok, los 3 corrieron | el hueco del reloj empeora: 10 h 14 min |
| 2026-10-14 | 🟡 | ok (indirecto, 200) | verde, 4 veces en 24 h | ok, los 4 corrieron | sin novedad; 4 preguntas sin contestar, 2 días |
| 2026-10-15 | 🟡 | ok (indirecto, 200) | verde, 6 veces en 24 h, mejorando | ok, los 4 entregaron | nada nuevo; preguntas sin contestar, 3 días |
| 2026-10-16 | 🟡 | **ok, leído de verdad**: 200 y "TODO CORRECTO" | verde, 5 veces en 24 h | ok, los 3 entregaron | solo Gemini tiene clave; Claude y GPT no |
| 2026-10-17 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **el dueño cambió el cron**: midiendo | ok, los 4 entregaron | sigue 1 cerebro de 3; nada nuevo roto |
| 2026-10-18 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **medido: 7 de 72 toques** | ok, los 4 entregaron | el cron nuevo no basta: hueco de 4 h 28 |
| 2026-10-19 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | 8 de 72 toques, peor hueco 4 h 50 | ok, los 3 entregaron | nada nuevo; el reloj confirma lo de ayer |
| 2026-10-20 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **4 de 72**, peor hueco 6 h 29 | ok, los 4 entregaron | el reloj se ha medio partido: 8 → 4 |
| 2026-10-21 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | 6 de 72, peor hueco 5 h 00 | ok, los 5 entregaron | respaldo medido: los 3 siguen a $0 |
| 2026-10-22 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **5 de 72, hueco de 10 h 39** · y suena en vacío | ok, los 3 entregaron | el reloj no ha perdido nada: no hay nada que ejecutar |
| 2026-10-23 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | 6 de 72, peor hueco 5 h 44 · vuelve a la banda | ok, los 4 entregaron | nada nuevo; octavo día con un cerebro |
| 2026-10-24 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | 6 de 72, peor hueco **4 h 57**: el mejor de los 11 días | ok, los 4 entregaron | nada nuevo roto; noveno día con un cerebro |
| 2026-10-25 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **7 de 72**, peor hueco cerrado 4 h 23: su mejor día | ok, los 3 entregaron | **hay usuarios (4 avisos) y el buscador se muere cada tarde** |
| 2026-10-26 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | 7 de 72, peor hueco 5 h 34 | ok, los 4 entregaron | **puso las 3 claves de Gemini** · y el respaldo ya no es gratis: $0,44/M el primero |
| 2026-10-27 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **5 de 72**, peor hueco 6 h 17 | ok, los 4 entregaron | el repuesto de búsqueda es de pago y **se dispara cada tarde** |
| 2026-10-28 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | **4 de 72**, peor hueco 6 h 18 | ok, los 3 entregaron | nada nuevo: los dos 🟡 son los de ayer, un día más viejos |
| 2026-10-29 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena, verificado; **ya no lo mido a diario** | ok, los 4 entregaron | **Team contrata de verdad y el prompt no sabe qué es** · y su ficha del Abogado contradice a `/contratos` |
| 2026-10-30 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena, verificado (ejecuciones 166-169 en verde); sin medir | ok, los 4 entregaron | **mejoró el plan gratis anoche y la web vende el de antes** · y el `GRATIS_AL_DIA = 15` a mano era mío |
| 2026-10-31 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena, verificado (171-174 en verde); sin medir | ok, los 3 que tocaban | **el repuesto de búsqueda cuesta 4,4× menos: medido** · y me corrijo en MEGA, que ya tiene tres casas |
| 2026-11-01 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena, verificado (176-179 en verde); sin medir | ok, los 4 entregaron | **el proveedor retiró un modelo de la cadena** · y su arreglo del plan gratis choca con el nuestro: **primer conflicto de fusión** |
| 2026-11-03 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena, y **no perdió un toque ayer** (183-187 en verde) | 🔴 **ninguno corrió ayer**: la máquina se reinició, no falló ningún agente | **se perdió el día entero del 02-11** · y crecimiento se queda en siete días sin mirar el mercado |
| 2026-11-04 | 🟡 | ok, leído: 200 y "TODO CORRECTO" | suena (188-191 en verde); sin medir | ok, los 3 que tocaban | **nada nuevo**: los 🟡 son los de ayer · **17 P1 abiertos, el más viejo de 23 días, y los 17 esperan al dueño** · hoy no aviso |
| 2026-11-05 | 🟡 | ok, leído: 200 y "TODO CORRECTO" (ejecución 34, hoy 06:14) | suena (190-194 en verde, la última hoy a la 01:25) | ok, los 4 entregaron | **volvió con 12 commits anoche y llegó el segundo conflicto**: resuelto hoy, y una de las viñetas falsas era **nuestra** |
| 2026-11-06 | 🔴 | ok, leído: 200 y "TODO CORRECTO" (ejecución 35, hoy 06:18) | suena (195-198 en verde, la última hoy a las 02:37) | ok, los 4 entregaron | **vuelve a `/precios` el "No, no entrenamos con tus conversaciones"**, y es falso en la capa gratuita · y la escala de créditos se dobló: nuestro material enseña la vieja |
| 2026-11-07 | 🟡 | **ok, y por primera vez visto desde fuera**: su workflow `probar-portada` dice que la portada carga, que está la caja de probar y que **un desconocido pregunta y Kairo contesta** (`{"texto":"FUNCIONA","quedan":2}`), con el tope cortando a la tercera (429) | suena (195-198 en verde) | 3 de 4: el entrenador no corrió, la sesión se reinició dos veces encima de su hora | **22 commits suyos**: prueba sin cuenta, analítica propia y cuarto conflicto · y **la política de cookies ya no dice la verdad**: hay una galleta nueva y hay analítica |
| 2026-11-08 | ⬛ | — | — | **ninguno corrió** | el proceso de la sesión se reinició; los 4 avisos se quedaron en la cola |
| 2026-11-09 | ⬛ | — | — | **ninguno corrió** | igual que ayer; los 3 avisos, en la cola |
| 2026-11-10 | 🔴 | ok, leído: 200 y "TODO CORRECTO" (ejecución 37, hoy 06:18) | suena (209-214 en verde, la última hoy a las 00:26) | 🔴 **dos días sin que corra ninguno**: 8 avisos leídos hoy de golpe | **la automatización de los agentes lleva dos días caída** · y el "No" falso de `/precios` cumple **cinco días** publicado |
| 2026-11-11 | 🔴 | **ok, y medido desde fuera hoy**: `revisar.yml` 38 (06:20) dice 200 y "TODO CORRECTO", y `probar-portada` 8 da los cinco pasos en verde sobre su despliegue de anoche (`200db8f`): la portada carga, está la caja de probar, un desconocido pregunta y Kairo contesta, y el tope corta a la tercera | suena (215-218 en verde, la última hoy a la 01:29) | ok, los 4 entregaron ayer; hoy el guardián a su hora | **volvió anoche con 14 commits y un barrido de honestidad**: topes por plan de verdad (0023), fuera "ilimitado", fuera "modo niños", fuera los conectores que no existen, fuera los "1.200 al mes" · **y reforzó el "No" falso de `/precios`**: sexto día · quinto conflicto, resuelto · **rojo por eso y solo por eso**: el 06-11 esta misma frase se marcó 🔴 el día que volvió, y hoy dice más, no menos |
| 2026-11-12 | 🔴 | **ok, medido hoy desde fuera**: `revisar.yml` 39 (06:14) da 200 y "TODO CORRECTO", y `probar-portada` 10 los cinco pasos en verde sobre su despliegue de anoche (`6874ac1`) | suena (219-222 en verde, la última hoy a las 03:45) | ok, los **cinco** entregaron ayer, y el mercado se puso al día | **32 commits suyos anoche** y la cadena de modelos entera cambiada: fuera `laguna` (P1 de 10 días, **resuelto**) y fuera el buscador de pago (P1 de 17 días, **resuelto**), con Google Noticias gratis en su sitio · **pero la portada sigue prometiendo "Claude · Gemini · GPT" y ninguno de los dos está ya en la cadena** · y `/api/estado` describe una cadena que ya no existe · sexto conflicto, resuelto |
