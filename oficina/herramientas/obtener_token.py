"""Saca el YT_REFRESH_TOKEN. Se ejecuta UNA VEZ y en tu ordenador, no en Actions.

    python oficina/herramientas/obtener_token.py --id TU_CLIENT_ID --secreto TU_SECRETO

Abre el navegador, das permiso con la cuenta del canal y te imprime el refresh token.
"""
from __future__ import annotations

import argparse
import http.server
import socket
import threading
import urllib.parse
import webbrowser

import requests

ALCANCES = " ".join(
    [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
    ]
)
AUTORIZAR = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN = "https://oauth2.googleapis.com/token"

codigo: str | None = None


class Manejador(http.server.BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        global codigo
        parametros = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        codigo = (parametros.get("code") or [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            "<h2>Listo. Vuelve a la terminal.</h2>".encode("utf-8")
            if codigo
            else "<h2>No ha llegado el codigo.</h2>".encode("utf-8")
        )

    def log_message(self, *_args) -> None:  # silencio
        return


def puerto_libre() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", required=True, help="client_id de Google Cloud")
    parser.add_argument("--secreto", required=True, help="client_secret de Google Cloud")
    parser.add_argument(
        "--solo-token", action="store_true",
        help="imprime unicamente el refresh token, para encadenarlo con gh secret set",
    )
    args = parser.parse_args()

    puerto = puerto_libre()
    redireccion = f"http://127.0.0.1:{puerto}"
    url = AUTORIZAR + "?" + urllib.parse.urlencode(
        {
            "client_id": args.id,
            "redirect_uri": redireccion,
            "response_type": "code",
            "scope": ALCANCES,
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    servidor = http.server.HTTPServer(("127.0.0.1", puerto), Manejador)
    threading.Thread(target=servidor.handle_request, daemon=True).start()

    aviso = sys.stderr if args.solo_token else sys.stdout
    print("Abriendo el navegador. Si no se abre, pega esta URL:\n", file=aviso)
    print(url, "\n", file=aviso)
    webbrowser.open(url)
    while codigo is None:
        threading.Event().wait(0.5)

    respuesta = requests.post(
        TOKEN,
        data={
            "code": codigo,
            "client_id": args.id,
            "client_secret": args.secreto,
            "redirect_uri": redireccion,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    respuesta.raise_for_status()
    datos = respuesta.json()
    if args.solo_token:
        print(datos["refresh_token"])
    else:
        print("\nGuarda esto como secreto YT_REFRESH_TOKEN en GitHub:\n")
        print(datos["refresh_token"])


if __name__ == "__main__":
    main()
