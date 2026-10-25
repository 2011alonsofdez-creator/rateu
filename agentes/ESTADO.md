# Estado de Kairo

> Panel vivo. Lo actualiza `kairo-radar` cada 3 días. El histórico completo
> está en `informes/`.

**Última revisión**: 2026-10-25 ([informe](informes/2026-10-25-estado.md))
**Semáforo general**: 🔴 nada de lo construido llega a nadie, **y ya hay gente al otro lado**

## Métricas

| Métrica | Valor | Anterior (22-10) | Tendencia |
|---|---|---|---|
| Web responde | sí, leído de `/api/estado`: 200 y "TODO CORRECTO" | sí | = |
| **Usuarios reales** | **4 avisos de personas** (commit `688ecb2` del dueño, 24-10) | se creía 0 | **primer dato, y corrige al informe del 22-10** |
| Cerebros con clave en producción | **1 de 3** | 1 de 3 | = **décimo día** |
| **Claves de Gemini** | **1** · con una sola, la cuota se agota a media tarde y deja de buscar | sin medir | **primera medición** |
| Capa de la cuenta de Gemini | **gratuita**, por su propio commit | sin confirmar | **contestada**, y en el sentido malo |
| Reloj de Co-Works | **7 de 72** toques/24 h · peor hueco cerrado **4 h 23** | 5 de 72 · 10 h 39 | ↑ su mejor día de los doce medidos |
| Telegram | el token está puesto y Telegram lo acepta | igual | = |
| Buscador | encendido **por la mañana**; por la tarde, sin medir | "encendido" | ↓ la medición anterior era del mejor momento del día |
| Respaldo de OpenRouter | 3 modelos, existen los 3 (el proveedor ofrece 467) | los 3 a $0/M | = en fondo; los precios **no se ven** en el log |
| Banco de pruebas del prompt | **25 de 28** en 14 casos (23-10) | 12 de 12 en 6 | ↑ instrumento nuevo, **3 unos abiertos** |
| Base de conocimiento | 2 archivos, **y ya llegan al prompt** (24-10) | 2, sin llegar | ↑ el cambio del ciclo |
| Tamaño del prompt (adulto / con buscador) | **159 / 182** líneas | 134 / 147 | ↑ +25 privacidad, +10 la regla del buscador |
| Checklist de lanzamiento | 13 ✅ · 3 🟡 · 1 ⚪ de 17 | 14 ✅ · 2 🟡 · 1 ⚪ de 17 | ↓ a propósito: el buscador bajó a 🟡 por honestidad |
| Tareas cerradas (acumulado) | **16** | 14 | ↑ +2, y media más (el reloj) |
| Commits **sin fusionar** en `main` | **59** | 47 | ↑ y es lo peor de la tabla |
| Turnos de agente perdidos | 0 en **15 días** | 0 en 12 | = |
| Preguntas al dueño sin contestar | **8**, trece días | 4, diez días | ↑ en número y en días |
| Visitas · conversión · ingresos | sin datos | sin datos | = sin analítica |

Las tres últimas siguen sin datos porque **no hay analítica instalada** (tarea
propia del backlog desde el 19-10). **Y lo que decía aquí hasta hoy era falso**:
decía que el reloj informa de 0 Co-Works y 0 papeles "o sea que todavía no hay
nadie dentro". Eso vale para los Co-Works y los papeles; **no para el chat**. El
commit `688ecb2` del dueño menciona **cuatro personas** que avisaron de que
Kairo daba datos viejos. Hay usuarios: lo que no hay es forma de contarlos.

## Veredicto de la última revisión

**Kairo tiene usuarios, y lo hemos sabido leyendo un mensaje de commit.** Cuatro
personas avisaron de que daba datos viejos. Durante trece días este sistema
priorizó con la premisa de que no había nadie dentro —la escribió el radar del
22-10— y era falsa.

Y lo que convierte el dato en el peor de la semana es lo que ya se sabía: esas
cuatro personas están usando la Kairo publicada, **que no tiene ni uno de los 59
arreglos** que llevamos quince días escribiendo.

Lo que sí ha ido bien: el sistema reordenó su cola el mismo día en que apareció
el fallo real, la base de conocimiento por fin llega al prompt, y salieron de la
interfaz dos promesas que no se sostenían —la hora exacta de los Co-Works y un
aviso de "no he podido buscar" que solo existía en castellano.
