# Oficina de YouTube Shorts

Seis agentes que llevan canales de Shorts solos: buscan tema, escriben, montan,
suben, miden la retención y aprenden a qué hora publicar. Viven en GitHub Actions,
así que funcionan con tu ordenador apagado.

## Dos canales

| Canal | Carpeta de datos | Nicho | Horas que prueba |
| --- | --- | --- | --- |
| **GTA 6** (`canales/gta6.json`) | `datos/gta6/` | Todo lo que se sabe del juego: mapa, personajes, comparativas, cuenta atrás | 12, 14, 16, 18, 20, 21, 22 |
| **Otra Época** (`canales/otra-epoca.json`) | `datos/otra-epoca/` | POV: un día normal en otra época u otro universo | 13, 15, 17, 19, 20, 21, 22 |

Cada canal tiene su nicho, sus reglas de guion, su voz, su categoría de YouTube,
su memoria, su historial y su hora. `config.json` son solo los valores por defecto
que comparten. Las horas van distintas a propósito: así no compiten entre ellos y
cada uno aprende su mejor hora por separado.

Todas las órdenes aceptan `--canal gta6`, `--canal otra-epoca` o `--canal todos`.

```
nichos  →  guionista  →  editor  →  subidor
   ↑                                   │
   └──── analista (retención) ─────────┤
         horario (mejores horas) ──────┘
```

| Agente | Fichero | Qué hace |
| --- | --- | --- |
| Buscador de nichos | `agentes/nichos.py` | Busca shorts reales del nicho con la API de YouTube, puntúa subnichos y deja una cola de ideas. |
| Guionista | `agentes/guionista.py` | Escribe título, descripción, etiquetas y escenas (voz + imagen), aplicando las lecciones de retención. |
| Editor | `agentes/editor.py` | Voz en off, imágenes, zoom lento, subtítulos quemados y un mp4 vertical 1080x1920 con ffmpeg. |
| Subidor | `agentes/subidor.py` | Sube el vídeo y apunta la hora exacta de publicación. |
| Analista de retención | `agentes/analista.py` | Lee la curva real (`audienceWatchRatio`), encuentra los segundos donde la gente se va y escribe lecciones para el guionista. |
| Horarios | `agentes/horario.py` | La primera semana rota horas; luego compara vistas a 48 h y fija la mejor. |

El jefe es `oficina.py`: decide si toca publicar y los llama en orden.

## Puesta en marcha

### 1. Repasa los dos canales

`canales/gta6.json` y `canales/otra-epoca.json` ya vienen con nicho, subtemas,
reglas de guion y temas prohibidos. Lo único que falta es `canal.id` del canal de
GTA 6 (el de Otra Época ya está: `UCeFxGfEosv2LzPhOSg6OC4A`). Ese id sale de
YouTube Studio → Configuración → Configuración del canal → Información avanzada.

Sirve de seguro: antes de subir, la oficina comprueba que el token apunta a ese
canal y se niega a publicar si no coincide, para que un short de GTA no acabe en
el canal de POV.

### 2. Claves de IA

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

- `ANTHROPIC_API_KEY` — guiones, nichos y análisis (Claude).
- `OPENAI_API_KEY` — voz (`gpt-4o-mini-tts`) e imágenes (`gpt-image-1`).

### 3. Permisos de tu canal de YouTube

1. [Google Cloud Console](https://console.cloud.google.com/) → crea un proyecto.
2. **APIs y servicios → Biblioteca**: activa **YouTube Data API v3** y
   **YouTube Analytics API**.
3. **Pantalla de consentimiento OAuth**: tipo *Externo*, y añádete a ti mismo en
   *Usuarios de prueba* (con la cuenta dueña del canal).
4. **Credenciales → Crear credenciales → ID de cliente de OAuth → App de escritorio**.
   Apunta el *client ID* y el *client secret*.
5. En tu ordenador, una sola vez:

```bash
pip install requests
python oficina/herramientas/obtener_token.py --id TU_CLIENT_ID --secreto TU_SECRETO
```

Te imprime un *refresh token*. **Hazlo dos veces**, una iniciando sesión con la
cuenta de cada canal, y guarda:

- `YT_CLIENT_ID` y `YT_CLIENT_SECRET` (los mismos para los dos)
- `YT_REFRESH_TOKEN_GTA6`
- `YT_REFRESH_TOKEN_OTRA_EPOCA`

Si los dos canales cuelgan de la misma cuenta de Google, al autorizar sale un
selector de canal: elige el que toca en cada pasada.

### 4. Enciéndelo

El workflow **Oficina de Shorts - turno diario** suena cada 20 minutos y publica
cuando toca. Para la primera prueba: pestaña **Actions → Oficina de Shorts - turno
diario → Run workflow**, con *forzar* marcado.

## Probar en local sin gastar nada

```bash
pip install -r oficina/requirements.txt
```

```bash
OFICINA_SIMULADA=1 python -m oficina.oficina prueba --canal gta6
```

`OFICINA_SIMULADA=1` monta el vídeo con tonos y fondos de color en vez de llamar a
la IA de voz e imagen: sirve para ver que ffmpeg y los subtítulos van bien. Sin esa
variable (y con claves) hace el short de verdad y **no** lo sube.

```bash
python -m oficina.oficina estado --canal todos        # qué sabe la oficina
python -m oficina.oficina nichos --canal gta6         # solo buscar temas
python -m oficina.oficina retencion --canal todos     # solo analizar retención
python -m oficina.oficina horas --canal todos         # solo recalcular horas
python -m oficina.oficina dia --canal gta6 --forzar   # turno completo y subir ya
```

## Cómo aprende

- **Retención** → `datos/memoria.json` → `lecciones`. El guionista las recibe como
  órdenes en cada guion nuevo. Se reescriben cada semana con la curva real.
- **Horas** → la primera semana rota entre `publicacion.horas_a_probar` (una por día
  de la semana). Cuando hay al menos `minimo_videos_para_decidir` vídeos con 48 h de
  datos y tres horas distintas probadas, fija la mejor por mediana de vistas y la
  guarda en `hora_en_uso`. Para volver a explorar, borra ese campo.
- **Informes** legibles en `datos/informes/` (`-nichos.md`, `-retencion.md`,
  `-horarios.md`), que los workflows commitean solos.

## Lo que conviene saber

- **La retención tarda.** YouTube no da curva hasta que el vídeo tiene unas horas y
  unas cuantas visualizaciones; el analista salta los vídeos de menos de dos días.
- **Cuota de la API.** La búsqueda de nichos gasta 100 unidades por consulta y el día
  trae 10 000 **por proyecto de Google Cloud**, no por canal: con dos canales buscando
  se gasta el doble. Por eso solo se busca una vez por semana o cuando se vacía la cola.
- **Sube público y sin revisión previa.** Es lo que pediste. Si algún día quieres
  verlos antes, pon `publicacion.privacidad` en `"private"`.
- **Coste aproximado por vídeo:** un guion de Claude + una voz corta + 6 imágenes.
  Las imágenes son con diferencia lo más caro; bajar `video.escenas` a 4 lo recorta.
- **Vídeos generados** (`datos/<canal>/videos/`) no se guardan en git.
