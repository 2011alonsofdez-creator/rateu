# Protocolo común de los agentes de Kairo

Lo cumplen los 5 agentes, siempre. Las fichas de cada uno
(`.claude/agents/kairo-*.md`) solo describen lo que les es propio.

## 0. Dónde estás

Vives en la **sede de los agentes**: una sesión permanente que ya tiene este
repositorio clonado. No tienes que traerte nada: el repositorio está aquí.

- Repositorio: `2011alonsofdez-creator/rateu`
- La app de Kairo: `kairo/` (Next.js 16 + React 19 + Tailwind 4)
- Documentación del producto: `docs/kairo/`
- **Tu sitio: `agentes/`** — todo lo que escribas va aquí
- Tu rama: `claude/kairo-agentes`. **Nunca `main`.**

Primero de todo:

```bash
cd <raíz del repositorio>      # búscalo con `ls ~` si no lo tienes delante
git fetch origin --prune
git checkout claude/kairo-agentes 2>/dev/null || git checkout -B claude/kairo-agentes origin/claude/kairo-agentes
git pull --no-rebase origin claude/kairo-agentes
git config user.email 2011.alonso.fdez@gmail.com
git config user.name "Alonso"
ls agentes/                    # tiene que existir antes de seguir
```

Si `agentes/` no aparece, para y avisa: el sistema está mal instalado y un
informe inventado es peor que ninguno.

## 1. Leer, en este orden

1. `agentes/CONTEXTO.md` — qué es Kairo, su URL, su estado y sus objetivos.
2. `agentes/notas.md` — **lo que ha pedido el dueño manda sobre tu rutina.**
3. `agentes/ESTADO.md` — de dónde venimos.
4. `agentes/backlog.md` — qué está pendiente.
5. Tu propio histórico (tu último informe o entrada de diario), para no
   repetirte ni contradecirte.

## 2. Trabajar

Lo que diga tu ficha. Tres límites duros:

- **Una cosa bien antes que cinco a medias.** Un cambio pequeño, terminado y
  comprobado vale más que un plan enorme.
- **Nada de métricas inventadas.** Si no hay analítica conectada, se escribe
  "sin datos" y se dice qué habría que conectar. Nunca un número estimado con
  cara de real.
- **El código no miente, el README sí envejece.** Antes de afirmar que algo
  está hecho, míralo en el código.

## 3. Dejar constancia

```bash
git add -A
git commit -m "agentes(<agente>): <qué hiciste>"
git push -u origin claude/kairo-agentes
```

Si el push falla por red, reintenta hasta 4 veces esperando 2 s, 4 s, 8 s y 16 s.
Si falla por conflicto: `git pull --no-rebase origin claude/kairo-agentes`,
resuelve y vuelve a empujar. **Nunca reescribas historia ya publicada**
(ni `rebase`, ni `--force`, ni `--amend` sobre commits ya empujados).

## 4. Avisar

El aviso va **solo al dueño**, a `2011.alonso.fdez@gmail.com`. Dos vías:

1. **Correo (la que él prefiere).** El conector de Gmail está en la sede, pero
   **ojo con el nombre**: no se llama `mcp__Gmail__send_message`, sino algo como
   `mcp__d64e67bf-1fb9-407b-b086-d1831f448020__send_message`, con un
   identificador en medio que puede cambiar. Así que **no lo busques por nombre
   exacto**: busca por palabras con `ToolSearch` (`gmail send email`) y usa el
   que aparezca. Si no aparece ninguno, pasa a la vía 2 sin perder más tiempo.
2. **Notificación al móvil** con `PushNotification`, que siempre está.

Y hay un tercer canal que no cuesta nada: **tu último mensaje de la sesión**.
Escríbelo como el informe en corto, porque es lo que el dueño va a leer.

Cómo se escribe:

- Encabezado: `[Kairo] <lo importante en 6 palabras>` — que se entienda sin abrirlo.
- **Primero la conclusión**, en una frase. Luego el detalle. Al final, el
  archivo donde está todo.
- Cabe en una pantalla de móvil. Lo largo va al archivo.
- Si no hay nada que contar, **no avises**. El silencio también es información.

| Agente | Avisa |
|---|---|
| `kairo-guardian` | solo si algo está roto o si ayer falló otro agente |
| `kairo-entrenador` | nunca (su trabajo va en el parte diario) |
| `kairo-constructor` | siempre: **el parte diario** |
| `kairo-radar` | siempre: la tabla de estado |
| `kairo-crecimiento` | siempre: oportunidades |

## 5. Lo que ningún agente hace sin permiso

Kairo es un producto vivo con usuarios y dinero de por medio. Hay cosas que no
se tocan sin que el dueño diga que sí, por escrito, esa vez:

- **`main`.** Jamás. Todo va a `claude/kairo-agentes` y lo fusiona él.
- **Vercel, el dominio, las variables de entorno y los secretos de GitHub.**
- **Pagos, créditos y suscripciones** (`api/pagos/`, `api/suscripcion/`,
  `lib/planes.ts`, la función `gastar_creditos`). Un fallo ahí cobra de más o
  regala el producto.
- **Autenticación y permisos** (`proxy.ts`, `(auth)/`, RLS de Supabase).
- **Migraciones de Supabase.** Se pueden *proponer* en un archivo nuevo; no se
  aplican ni se cambian las existentes.
- **Publicar en redes, foros o Product Hunt**, ni escribir a nadie que no sea
  el dueño.
- **Borrar histórico.** Todo se añade; lo que ya no vale se marca como descartado.

El resto del código de `kairo/` sí se puede tocar, en la rama de agentes y en
cambios pequeños: textos, componentes de interfaz, páginas estáticas, prompts,
documentación. Si un cambio te parece grande, no lo hagas: propónlo en el
backlog y dilo en el parte.

## 6. Si algo sale mal

No te quedes a medias en silencio. Deja el commit con lo que llevabas, anota el
problema bajo `## Bloqueos` en tu archivo de salida, y si impide el trabajo del
día dilo en el aviso, en una línea. Un bloqueo claro es mejor que un informe que
disimula.
