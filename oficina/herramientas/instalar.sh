#!/usr/bin/env bash
# Deja la oficina lista: pide los permisos y los guarda como secretos en GitHub.
#
#   bash oficina/herramientas/instalar.sh
#
# Ningun token se imprime por pantalla: van directos a `gh secret set`.
set -u

verde()  { printf '\033[32m%s\033[0m\n' "$*"; }
rojo()   { printf '\033[31m%s\033[0m\n' "$*"; }
titulo() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }

cd "$(dirname "$0")/../.." || exit 1

titulo "Comprobando lo que hace falta"
falta=0
for programa in gh python3 claude; do
  if command -v "$programa" >/dev/null 2>&1; then
    verde "  $programa ok"
  else
    rojo "  falta $programa"
    falta=1
  fi
done
if [ "$falta" = 1 ]; then
  rojo "Instala lo que falta y vuelve a lanzarme."
  echo "  gh     -> https://cli.github.com"
  echo "  claude -> npm install -g @anthropic-ai/claude-code"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  titulo "Entrando en GitHub"
  gh auth login || { rojo "sin GitHub no puedo guardar los secretos"; exit 1; }
fi
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
[ -z "$repo" ] && { rojo "no veo el repositorio; lanza esto dentro de la carpeta del repo"; exit 1; }
verde "repositorio: $repo"

python3 -m pip install --quiet --upgrade requests >/dev/null 2>&1

tiene_secreto() { gh secret list --repo "$repo" 2>/dev/null | grep -q "^$1[[:space:]]"; }

# ---------- 1. Claude con tu suscripcion ----------
titulo "1/3  Claude (tu suscripcion, sin pagar API)"
if tiene_secreto CLAUDE_CODE_OAUTH_TOKEN; then
  verde "  ya estaba puesto, lo dejo"
else
  echo "  Se abrira el navegador: dale a permitir con tu cuenta de Claude."
  salida=$(claude setup-token 2>/dev/null | tr -d '\r')
  token=$(printf '%s\n' "$salida" | grep -oE 'sk-ant-[A-Za-z0-9_-]{20,}' | tail -1)
  if [ -z "$token" ]; then
    echo "  No he podido leerlo solo. Pegalo aqui (no se vera al escribir):"
    read -rs token
    echo
  fi
  if [ -n "$token" ]; then
    printf '%s' "$token" | gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo "$repo" && verde "  guardado"
  else
    rojo "  sin token; la oficina no podra escribir guiones"
  fi
  unset token salida
fi

# ---------- 2. Permisos de YouTube ----------
titulo "2/3  YouTube"
if tiene_secreto YT_CLIENT_ID && tiene_secreto YT_CLIENT_SECRET; then
  verde "  client id y secret ya estaban puestos"
else
  echo "  Saca un 'ID de cliente OAuth' de tipo 'App de escritorio' en:"
  echo "    https://console.cloud.google.com/apis/credentials"
  echo "  (activa antes YouTube Data API v3 y YouTube Analytics API)"
  printf '  client id: '      ; read -r cid
  printf '  client secret: '  ; read -rs csecret; echo
  [ -z "$cid" ] || [ -z "$csecret" ] && { rojo "  faltan datos, lo dejo aqui"; exit 1; }
  printf '%s' "$cid"     | gh secret set YT_CLIENT_ID     --repo "$repo"
  printf '%s' "$csecret" | gh secret set YT_CLIENT_SECRET --repo "$repo"
  verde "  guardados"
fi

pedir_canal() {
  nombre=$1; secreto=$2
  if tiene_secreto "$secreto"; then
    verde "  $nombre: ya estaba puesto"
    return
  fi
  if [ -z "${cid:-}" ]; then
    printf '  client id otra vez (para %s): ' "$nombre"     ; read -r cid
    printf '  client secret otra vez: '                     ; read -rs csecret; echo
  fi
  echo
  echo "  --> Ahora se abre el navegador: INICIA SESION CON EL CANAL $nombre"
  printf '  (pulsa intro cuando estes listo) '; read -r _
  tok=$(python3 oficina/herramientas/obtener_token.py --id "$cid" --secreto "$csecret" --solo-token)
  if [ -n "$tok" ]; then
    printf '%s' "$tok" | gh secret set "$secreto" --repo "$repo" && verde "  $nombre guardado"
  else
    rojo "  $nombre: no ha venido token"
  fi
  unset tok
}
pedir_canal "GTA 6"       YT_REFRESH_TOKEN_GTA6
pedir_canal "OTRA EPOCA"  YT_REFRESH_TOKEN_OTRA_EPOCA
unset cid csecret

# ---------- 3. Resumen y primer turno ----------
titulo "3/3  Como ha quedado"
gh secret list --repo "$repo" | grep -E 'CLAUDE_CODE_OAUTH_TOKEN|YT_' || rojo "  no hay secretos puestos"

echo
printf '¿Lanzo ya el primer vídeo de prueba en GitHub Actions? [s/N] '
read -r respuesta
case "$respuesta" in
  s|S|si|SI|y|Y)
    gh workflow run "oficina-diaria.yml" --repo "$repo" -f forzar=true
    verde "lanzado: mira Actions en GitHub (tarda unos minutos)"
    ;;
  *) echo "vale; cuando quieras: gh workflow run oficina-diaria.yml -f forzar=true" ;;
esac
