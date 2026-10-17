# Generador de apps en Chromebook

VS Code + Cline + OpenRouter, en un Chromebook.

No es la guía de Windows con otras rutas: en ChromeOS **VS Code no se
instala como un programa normal**. Hay que encender primero el Linux que
el Chromebook lleva dentro y apagado de fábrica. Una vez encendido, lo
demás se parece bastante.

Esto **no toca Kairo**. Es un ayudante aparte que te escribe apps nuevas.

---

## Antes de empezar: ¿tu Chromebook puede?

Dos cosas que conviene mirar ahora y no a mitad:

**1. ¿Admite Linux?** Casi todos los de 2019 en adelante sí. Lo
comprobamos en el paso 1: si la opción no aparece, no se puede, y
entonces no sigas — te ahorro la tarde.

**2. ¿Tienes sitio?** Hacen falta **unos 10 GB libres**. Linux ocupa lo
suyo, y Node y los proyectos van encima.

Settings → **Acerca de ChromeOS** → **Almacenamiento**.

Y un aviso sincero: si tu Chromebook es de los de 4 GB de RAM, esto va a
ir lento. Funcionar funciona, pero compilar un proyecto con Linux
abierto al mismo tiempo se nota. No es que lo hayas hecho mal.

---

## Paso 1 · Encender Linux

Settings (el engranaje) → abajo del todo **Avanzada** → **Desarrolladores**
→ **Entorno de desarrollo de Linux** → **Activar**.

Te pregunta dos cosas:

- **Nombre de usuario**: pon `alonso` o lo que quieras, en minúsculas y
  sin espacios.
- **Tamaño del disco**: te propondrá unos 10 GB. **Súbelo a 20 GB** si
  puedes. Ampliarlo después se puede, pero es un paso más.

Tarda unos minutos. Cuando acabe se abre **una ventana negra con texto**:
esa es la Terminal. Es donde vas a escribir los comandos de abajo.

> Si la opción de Linux no aparece en Settings, tu Chromebook no lo
> admite y hasta aquí hemos llegado. No hay forma de hacer esto sin él.

### Si la Terminal no arranca: `62 (NEED_UPDATE)`

Si al abrirla sale esto:

```
Launching vmshell failed: Error starting crostini for terminal: 62 (NEED_UPDATE)
```

**No has hecho nada mal y Linux está bien instalado.** Lo que dice ese
error es que la *máquina* que hace funcionar a Linux se ha quedado
atrasada respecto a tu ChromeOS. Se arregla actualizando ChromeOS, no
reinstalando nada:

1. Settings → abajo del todo **Acerca de ChromeOS**.
2. **Buscar actualizaciones**. Si encuentra algo, déjalo bajar.
3. **Reiniciar** (el botón sale ahí mismo). Reiniciar es obligatorio:
   sin el reinicio no cambia nada.
4. Vuelve a abrir la **Terminal**.

Si dice que ya está actualizado y la Terminal sigue igual:

- Mira que tengas **wifi**: esa pieza se la baja de Google en ese
  momento, y sin internet falla con este mismo error.
- Reinicia el Chromebook de todas formas, aunque no hubiera
  actualización.
- Y si después de eso sigue sin abrirse: Settings → **Desarrolladores**
  → **Entorno de desarrollo de Linux** → **Quitar**, y vuelve a
  activarlo (paso 1 otra vez). **No pierdes nada tuyo**: Linux va en su
  propia caja y todavía no has creado nada dentro.

---

## Paso 2 · Instalar Node

Esto la guía de Windows se lo saltaba, y es un error: sin Node, el
generador no puede crear ningún proyecto. En Chromebook hay que ponerlo
sí o sí.

En la Terminal, pega esto y dale a Enter:

```
sudo apt update && sudo apt install -y curl git
```

Te pedirá tu contraseña de Linux (la que acabas de crear). **Al escribirla
no se ve nada, ni puntitos.** Es normal: escribe y dale a Enter.

Después, esto:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Cuando termine, **cierra la Terminal y vuelve a abrirla** (si no, no se
entera de lo que acabas de instalar). Y entonces:

```
nvm install --lts
node --version
```

Si la última línea te contesta algo como `v22.x.x`, ya está.

---

## Paso 3 · Instalar VS Code

**Primero averigua qué procesador tienes**, porque hay dos descargas
distintas y la que no es, no instala:

```
dpkg --print-architecture
```

- Si dice **`amd64`** → te hace falta el **.deb x64**
- Si dice **`arm64`** → te hace falta el **.deb Arm64**

Ahora, **en Chrome** (no en la Terminal): <https://code.visualstudio.com/download>
→ sección **Linux** → descarga el **.deb** que te toque.

El archivo cae en *Descargas*. Hay que pasarlo a Linux:

Abre la app **Archivos** → **Descargas** → clic derecho sobre el `.deb` →
**Compartir con Linux**. Ahora está dentro, en la carpeta de Linux.

Y en la Terminal:

```
cd ~
sudo apt install -y ./code*.deb
```

Para abrirlo, escribe `code` en la Terminal y dale a Enter. También te
habrá aparecido en el cajón de aplicaciones, dentro de la carpeta
**Aplicaciones de Linux**.

---

## Paso 4 · OpenRouter: la clave y los modelos

En Chrome:

1. <https://openrouter.ai> → crea la cuenta.
2. Tu foto arriba a la derecha → **Keys** → **Create Key**.
   - En **Credit limit** pon **Custom amount → 1**. No elijas *No limit*.
   - **Cópiala en ese momento.** No se vuelve a ver nunca.
3. <https://openrouter.ai/models> → filtros de la izquierda → **Free** →
   copia **dos o tres identificadores completos** de los de ese día.

> **No le enseñes esa clave a nadie**, ni en capturas.

---

## Paso 5 · Instalar Cline

Con VS Code abierto:

1. Icono de los **cuatro cuadrados** en la barra de la izquierda
   (o `Ctrl+Shift+X`).
2. Busca **Cline** → **Install**.
3. Cuando acabe, pincha el icono de Cline en esa misma barra.

Debajo de donde se escribe el mensaje:

- **API Provider** → `OpenRouter`
- **API Key** → pega la tuya
- **Model** → pega **uno** de los nombres del paso 4

---

## Paso 6 · La carpeta de trabajo (ANTES de dar permisos)

Esto es lo que separa «un ayudante» de «un programa con permiso para
ejecutar comandos suelto por tus archivos».

En la Terminal:

```
mkdir -p ~/FabricaDeApps/Docs ~/FabricaDeApps/Blueprints ~/FabricaDeApps/AppsGeneradas
```

Son cuatro carpetas: la de fuera (`FabricaDeApps`) y tres dentro. En la
guía original salían partidas en tres nombres sueltos — era un error de
copiado.

Luego, en VS Code: **File → Open Folder…** → `FabricaDeApps` → **OK**.

**Solo esa.** No abras Kairo con Cline en modo automático: si se
equivoca, se equivoca encima de tu proyecto.

---

## Paso 7 · El archivo de reglas

Al lado de esta guía tienes `clinerules.txt`. Ábrelo, copia el texto
entero, y en VS Code (con `FabricaDeApps` abierta):

**File → New File** → pega → **Guardar** dentro de `FabricaDeApps` con
este nombre exacto:

```
.clinerules
```

Con el punto delante y sin `.txt`. En Linux los archivos que empiezan por
punto están ocultos, así que no te extrañe si luego no lo ves en la app
Archivos: ahí está, y VS Code sí lo enseña.

---

## Paso 8 · Los permisos, ahora sí

La guía que te pasaron decía que darle todos los permisos «no es darle
acceso a tu ordenador». **Es exactamente eso.** Con el automático puesto,
Cline escribe archivos y ejecuta comandos sin preguntarte, y su propio
archivo de reglas empieza pidiendo permiso para las dos cosas.

Úsalo si quieres, pero sabiendo qué aceptas. Por orden:

| | |
|---|---|
| **Leer archivos** | automático, sin problema |
| **Escribir archivos** | automático, pero solo con `FabricaDeApps` abierta |
| **Ejecutar comandos** | déjalo preguntando los primeros días |

En Chromebook hay un consuelo: **Linux está metido en su propia caja**.
Lo que pase ahí dentro no toca tus archivos de ChromeOS ni tu cuenta de
Google. Y si algo se lía del todo, Settings → Desarrolladores → Linux →
**Eliminar** y vuelves a empezar de cero.

---

## Paso 9 · Probarlo

Lee `PRIMERA-PRUEBA.md`, que está al lado de esta guía: tiene el texto
exacto para pegarle y qué deberías ver en cada fase.

Cuando diga que ha terminado, en la Terminal de VS Code
(**Terminal → New Terminal**):

```
cd ~/FabricaDeApps/AppsGeneradas/plazos
npm run dev
```

Te dará una dirección tipo `http://localhost:3000`. **Ábrela en Chrome**:
ChromeOS deja pasar `localhost` de Linux al navegador sin tener que hacer
nada. Para parar la app: `Ctrl + C` en la Terminal.

---

## Si algo no va

| Lo que ves | Lo que es | Qué haces |
|---|---|---|
| `62 (NEED_UPDATE)` al abrir la Terminal | ChromeOS atrasado respecto a Linux | Acerca de ChromeOS → **Buscar actualizaciones** → **Reiniciar** (ver paso 1) |
| `code: command not found` | el .deb no llegó a instalarse | repite el paso 3, y mira que el archivo esté en `~` |
| El `.deb` «no es compatible» | descargaste el de la otra arquitectura | `dpkg --print-architecture` y baja el que toque |
| `npx: command not found` | falta Node, o no reabriste la Terminal | cierra y abre la Terminal, y `nvm install --lts` |
| No encuentra el `.deb` | está en Descargas, no en Linux | Archivos → clic derecho → **Compartir con Linux** |
| `localhost:3000` no abre | la app no está corriendo | mira que `npm run dev` siga abierto en la Terminal |
| Va lentísimo | Chromebook + Linux + compilar | normal, sobre todo con 4 GB de RAM |
| «model not found» | ese modelo ya no existe | coge otro de la lista Free |
| Se para y no sigue | cuota del modelo gratis agotada | cambia de modelo o espera |

---

## Lo que NO cambia respecto a Windows

- Los modelos **cógelos de `openrouter.ai/models` el día que lo montes**,
  no de ninguna guía. Rotan cada pocas semanas y uno retirado no avisa:
  simplemente falla.
- Con modelos gratis esto va **lento**. Media hora para una app pequeña
  es normal, no es que esté colgado.
- Y **no pongas esto a tocar Kairo**. Kairo tiene base de datos,
  usuarios, pagos y un reloj andando. Un agente automático metiendo mano
  ahí sin nadie mirando es la forma más rápida de romper algo que
  funciona.
