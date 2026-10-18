# Generador de apps con VS Code + Cline + OpenRouter

Versión corregida de la guía que te pasaron, para **Windows** y sin las
cosas que estaban mal.

> ¿En Chromebook? Esa es otra: `GUIA-CHROMEBOOK.md`, al lado de esta.
> Ahí VS Code no se instala igual.

Esto **no tiene nada que ver con Kairo**. Es un ayudante que corre en tu
ordenador y te escribe apps nuevas. Kairo sigue donde está, intacto.

---

## Antes de empezar: lo que te dijeron mal

La guía original tenía tres cosas que te van a hacer perder el rato:

**1. Lo de los permisos no es verdad.** Decía:

> «pulsa en permisos y dale todos (No le estás dando permisos ni acceso a
> tu ordenador…)»

**Sí se los estás dando.** Con todos los permisos, Cline escribe archivos
y ejecuta comandos en tu ordenador **sin preguntarte**. Eso es
exactamente lo que son esos permisos.

No es motivo para no usarlo — mucha gente trabaja así. Es motivo para
saber lo que aceptas y para **tenerlo encerrado en una carpeta suya**,
que es lo que hace esta versión.

**2. Estaba escrita para un Mac.** Las rutas `~/AgentAppFactory/...` no
existen en Windows. Aquí van traducidas.

**3. Los nombres de modelos.** `poolside/laguna-s-2.1:free` y los otros
dos pueden estar retirados: en OpenRouter la lista cambia cada pocas
semanas. **No los copies de aquí ni de allí.** Cógelos de la web el día
que lo montes, como dice el paso 2.

---

## Paso 1 · Instalar VS Code

<https://code.visualstudio.com/download> → botón de Windows → ejecutas
el instalador → siguiente, siguiente.

Cuando pregunte, marca **«Add to PATH»** si sale. Lo demás por defecto.

---

## Paso 1 bis · Instalar Node

**Esto faltaba en la guía original y sin ello no funciona nada.** El
generador crea los proyectos con una herramienta que necesita Node; sin
Node se queda en el paso 3 con un `npx: command not found` que no
explica nada.

<https://nodejs.org> → el botón grande de la versión **LTS** → ejecutas
el instalador → siguiente, siguiente.

Para comprobarlo: abre el **Símbolo del sistema** (busca `cmd` en el
menú de inicio) y escribe:

```
node --version
```

Si te contesta algo como `v22.x.x`, listo. Si dice que no lo reconoce,
**cierra esa ventana y abre otra** — hasta que no se reinicia no se
entera.

---

## Paso 2 · Cuenta de OpenRouter y clave

Mientras se instala:

1. <https://openrouter.ai> → crea la cuenta.
2. Arriba a la derecha, tu foto → **Keys** → **Create Key**.
3. **Cópiala en ese momento y guárdala** en un sitio tuyo. OpenRouter
   no te la vuelve a enseñar nunca.
4. Vete a <https://openrouter.ai/models> y, en los filtros de la
   izquierda, marca **Free**. Copia **dos o tres nombres completos** de
   los que salgan ese día (son del estilo `vendedor/modelo:free`).

   Quédate con esos dos o tres: si el primero va lento o está saturado,
   cambias al siguiente sin tener que volver a buscar.

> **No le enseñes esa clave a nadie**, ni en capturas. Quien la tenga
> gasta tu cuota.

---

## Paso 3 · Instalar Cline

1. En VS Code, el icono de los **cuatro cuadrados** en la barra de la
   izquierda (o `Ctrl+Shift+X`).
2. Busca **Cline** → **Install**.
3. Cuando acabe, pincha el icono de Cline en esa misma barra.

---

## Paso 4 · Enchufarle OpenRouter

En el panel de Cline, debajo de donde se escribe:

- **API Provider** → `OpenRouter`
- **API Key** → pega la tuya
- **Model** → pega **uno** de los nombres que copiaste en el paso 2

---

## Paso 5 · La carpeta de trabajo (hazlo ANTES de darle permisos)

Esto es lo que la guía original no tenía, y es lo que te separa de que
un agente con permiso para ejecutar comandos ande suelto por tu disco.

Abre el Explorador de archivos y crea esto en tu carpeta de usuario
(`C:\Users\TU-USUARIO\`):

```
FabricaDeApps\
    Docs\
    Blueprints\
    AppsGeneradas\
```

Son **cuatro carpetas**, no archivos. La de fuera se llama
`FabricaDeApps` — en la guía original salía partida en tres
(«App/Agent/Factory»), que es un error de copiado.

Luego, en VS Code: **Archivo → Abrir carpeta…** y abre
`FabricaDeApps`. **Solo esa.** No abras la carpeta de Kairo con Cline
en modo automático: si se equivoca, se equivoca encima de tu proyecto.

---

## Paso 6 · El archivo de reglas

El texto está en `clinerules.txt`, junto a esta guía. Si estás leyendo
esto sin tener el repositorio delante, ábrelo aquí:
<https://raw.githubusercontent.com/2011alonsofdez-creator/rateu/main/docs/generador-de-apps/clinerules.txt>

1. Cópialo entero.
2. En VS Code, con `FabricaDeApps` abierta: **Archivo → Nuevo archivo**,
   pega, y guarda **dentro de `FabricaDeApps`** con el nombre exacto:

```
.clinerules
```

Con el punto delante y **sin** `.txt` al final. Si Windows te lo guarda
como `.clinerules.txt`, actívalo en el Explorador: pestaña **Vista** →
marca **Extensiones de nombre de archivo**, y quítale el `.txt`.

---

## Paso 7 · Los permisos, ahora sí

Ahora que está encerrado en su carpeta, en los ajustes de Cline puedes
subir el automático. Mi recomendación, por orden:

| | |
|---|---|
| **Leer archivos** | automático, sin miedo |
| **Escribir archivos** | automático, pero solo con `FabricaDeApps` abierta |
| **Ejecutar comandos** | déjalo preguntando los primeros días |

Lo de ejecutar comandos es lo único que puede hacer algo que no se
deshace. Cuando lleves un par de apps y veas qué ejecuta, lo subes.

---

## Paso 8 · Probarlo

En el chat de Cline, escribe algo concreto. Por ejemplo:

> Hazme una app de una sola página que convierta grados Celsius a
> Fahrenheit, con el diseño en modo oscuro.

Y déjalo trabajar. Va a escribir un plan, crear el proyecto, programar,
compilar y arreglarse sus propios errores.

**Con modelos gratis esto va lento.** No es que esté colgado: es que un
modelo gratis tiene cola. Si tarda demasiado, cambia al segundo nombre
de los que copiaste.

---

## Si algo no va

| Lo que ves | Lo que suele ser |
|---|---|
| «model not found» o similar | el nombre está retirado → coge otro de la lista Free |
| Se para y no sigue | cuota del modelo gratis agotada → cambia de modelo o espera |
| `npx: command not found` | falta Node, o no reiniciaste la ventana |
| Dice que no encuentra carpetas | no abriste `FabricaDeApps`, o están mal escritas |
| Va lentísimo | normal en los gratis |

---

## Y una cosa que no es técnica

Esto genera apps nuevas desde cero. **No lo pongas a tocar Kairo.**
Kairo tiene base de datos, usuarios, pagos y un reloj; un agente
automático metiendo mano ahí sin que nadie mire es la forma más rápida
de romper algo que funciona.

Para Kairo, seguimos como hasta ahora.
