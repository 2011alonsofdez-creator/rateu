# Los agentes de Kairo

Esta carpeta es el **cerebro compartido** de los 5 agentes que trabajan en Kairo
todos los días, solos, sin que haya que pedírselo.

No confundir con `kairo/`, que es la aplicación, ni con `docs/kairo/`, que es la
documentación del producto. Aquí vive la *gestión*: cómo va, qué falta, qué se
entrena y qué se construye cada día.

Los agentes trabajan siempre en la rama **`claude/kairo-agentes`**. Nunca en
`main`: eso lo fusiona el dueño cuando ha visto lo que hay.

## Los 5 agentes

| Agente | Cuándo | Qué hace | Te avisa |
|---|---|---|---|
| `kairo-guardian` | diario 07:12 | Comprueba que Kairo está viva: web, modo privado de Vercel, `/api/estado`, el reloj de Co-Works, claves expuestas, legales. Y que los otros 4 corrieron | Solo si algo va mal |
| `kairo-entrenador` | diario 08:04 | Entrena la IA: afina `kairo/src/lib/ia/prompt.ts`, añade ejemplos y casos límite, pasa el banco de pruebas | No (va en el parte) |
| `kairo-constructor` | diario 08:47 | Coge una tarea del backlog y la termina de verdad. Cierra **el parte diario** | Sí, 1 al día |
| `kairo-radar` | cada 3 días 09:38 | **La tabla de estado**: va bien / va mal / a mejorar / a añadir, y recarga el backlog | Sí |
| `kairo-crecimiento` | cada 3 días 10:21 | Competencia con precios reales, búsquedas, canales de lanzamiento | Sí |

Horario de Madrid, escalonados para que no se pisen escribiendo en el repositorio.

## Los archivos

| Archivo | Para qué |
|---|---|
| `CONTEXTO.md` | **Lo primero que lee todo agente.** Qué es Kairo, su URL, su estado y sus objetivos. |
| `notas.md` | **Tu buzón.** Escribe ahí lo que quieras y el siguiente agente lo tendrá en cuenta. Sin formato. |
| `PROTOCOLO.md` | Las reglas que cumplen los cinco. Incluye **lo que no tocan sin permiso**. |
| `ESTADO.md` | Panel vivo: semáforo, métricas y veredicto de la última revisión. |
| `backlog.md` | La cola priorizada. El radar y el de crecimiento la llenan; el constructor la vacía. |
| `informes/` | Un informe por revisión del radar. El histórico. |
| `diario/` | Un parte por día: qué se entrenó y qué se construyó. |
| `mercado/` | Informes de competencia y oportunidades. |
| `entregas/` | Material terminado listo para usar, cuando no va directo al código. |
| `ia/` | El entrenamiento: ejemplos, conocimiento, banco de pruebas y diario. |
| `lanzamiento/` | Checklist de lanzamiento y registro diario del guardián. |

## Cómo los controlas

- **Pedirles algo**: escríbelo en `notas.md`. Manda sobre su rutina.
- **Cambiar prioridades**: reordena `backlog.md`. El constructor va de arriba abajo.
- **Lanzar uno a mano**: en una sesión de Claude Code, "ejecuta el agente kairo-radar".
- **Cambiar horas o pararlos**: se hace en las Rutinas de claude.ai.

## Reglas que cumplen todos

1. Nunca inventan datos. Sin métricas, escriben "sin datos" y dicen qué conectar.
2. Nunca tocan `main`, Vercel, variables de entorno, pagos, créditos ni autenticación.
3. Todo queda en un commit, para que se pueda deshacer.
4. Escriben en español, claro y sin palabrería. Primero la conclusión.
5. Añaden al final; no borran el histórico.
