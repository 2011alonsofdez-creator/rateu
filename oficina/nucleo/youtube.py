"""Puente con YouTube: Data API v3, Analytics API y subida de videos."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

import requests

from .ajustes import AJUSTES
from .registro import di

TOKEN_URL = "https://oauth2.googleapis.com/token"
DATA = "https://www.googleapis.com/youtube/v3"
SUBIDA = "https://www.googleapis.com/upload/youtube/v3/videos"
ANALITICA = "https://youtubeanalytics.googleapis.com/v2/reports"

ALCANCES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


class ErrorYouTube(RuntimeError):
    pass


class YouTube:
    def __init__(self) -> None:
        self._token: str | None = None
        self._caduca: float = 0.0

    # ---------- autenticacion ----------
    def token(self) -> str:
        if self._token and time.time() < self._caduca - 60:
            return self._token
        datos = AJUSTES.oauth_youtube
        if not all(datos.values()):
            raise ErrorYouTube(
                "faltan YT_CLIENT_ID, YT_CLIENT_SECRET o YT_REFRESH_TOKEN "
                "(mira oficina/README.md)"
            )
        r = requests.post(
            TOKEN_URL,
            data={**datos, "grant_type": "refresh_token"},
            timeout=30,
        )
        if r.status_code != 200:
            raise ErrorYouTube(f"no he podido renovar el token: {r.status_code} {r.text[:300]}")
        cuerpo = r.json()
        self._token = cuerpo["access_token"]
        self._caduca = time.time() + int(cuerpo.get("expires_in", 3600))
        return self._token

    def _cabeceras(self) -> dict:
        return {"Authorization": f"Bearer {self.token()}"}

    # ---------- lectura ----------
    def _get(self, url: str, params: dict) -> dict:
        r = requests.get(url, params=params, headers=self._cabeceras(), timeout=60)
        if r.status_code != 200:
            raise ErrorYouTube(f"GET {url} -> {r.status_code} {r.text[:300]}")
        return r.json()

    def canal(self) -> dict:
        datos = self._get(
            f"{DATA}/channels",
            {"part": "id,snippet,statistics,contentDetails", "mine": "true"},
        )
        items = datos.get("items") or []
        if not items:
            raise ErrorYouTube("la cuenta autorizada no tiene canal")
        return items[0]

    def videos_del_canal(self, maximo: int = 50) -> list[dict]:
        canal = self.canal()
        subidas = canal["contentDetails"]["relatedPlaylists"]["uploads"]
        ids: list[str] = []
        pagina = None
        while len(ids) < maximo:
            params = {"part": "contentDetails", "playlistId": subidas, "maxResults": 50}
            if pagina:
                params["pageToken"] = pagina
            datos = self._get(f"{DATA}/playlistItems", params)
            ids += [i["contentDetails"]["videoId"] for i in datos.get("items", [])]
            pagina = datos.get("nextPageToken")
            if not pagina:
                break
        return self.detalles_videos(ids[:maximo])

    def detalles_videos(self, ids: list[str]) -> list[dict]:
        salida: list[dict] = []
        for i in range(0, len(ids), 50):
            trozo = ids[i : i + 50]
            if not trozo:
                continue
            datos = self._get(
                f"{DATA}/videos",
                {"part": "snippet,statistics,contentDetails", "id": ",".join(trozo)},
            )
            salida += datos.get("items", [])
        return salida

    def buscar(self, consulta: str, maximo: int = 25, dias: int | None = 30) -> list[dict]:
        params: dict[str, Any] = {
            "part": "snippet",
            "q": consulta,
            "type": "video",
            "maxResults": min(maximo, 50),
            "order": "viewCount",
            "regionCode": AJUSTES.get("canal.pais", "ES"),
            "relevanceLanguage": AJUSTES.get("canal.idioma", "es"),
            "videoDuration": "short",
        }
        if dias:
            from datetime import datetime, timedelta, timezone

            desde = datetime.now(timezone.utc) - timedelta(days=dias)
            params["publishedAfter"] = desde.strftime("%Y-%m-%dT%H:%M:%SZ")
        datos = self._get(f"{DATA}/search", params)
        return datos.get("items", [])

    # ---------- analitica ----------
    def informe(
        self,
        metricas: str,
        dimensiones: str | None = None,
        desde: str | None = None,
        hasta: str | None = None,
        filtros: str | None = None,
        orden: str | None = None,
        maximo: int | None = None,
    ) -> dict:
        params: dict[str, Any] = {
            "ids": "channel==MINE",
            "metrics": metricas,
            "startDate": desde or "2005-01-01",
            "endDate": hasta or time.strftime("%Y-%m-%d"),
        }
        if dimensiones:
            params["dimensions"] = dimensiones
        if filtros:
            params["filters"] = filtros
        if orden:
            params["sort"] = orden
        if maximo:
            params["maxResults"] = maximo
        return self._get(ANALITICA, params)

    def retencion(self, video_id: str) -> list[tuple[float, float]]:
        """Curva de retencion: [(porcentaje_del_video, ratio_de_audiencia), ...]."""
        datos = self.informe(
            metricas="audienceWatchRatio",
            dimensiones="elapsedVideoTimeRatio",
            filtros=f"video=={video_id}",
            desde="2005-01-01",
        )
        filas = datos.get("rows") or []
        return sorted((float(f[0]), float(f[1])) for f in filas)

    def vistas_por_dia(self, video_id: str, desde: str, hasta: str) -> list[tuple[str, int]]:
        datos = self.informe(
            metricas="views,estimatedMinutesWatched,averageViewPercentage",
            dimensiones="day",
            filtros=f"video=={video_id}",
            desde=desde,
            hasta=hasta,
        )
        return [(f[0], int(f[1])) for f in (datos.get("rows") or [])]

    def verificar(self) -> dict:
        """Evita el desastre de subir el short de un canal al otro."""
        ficha = self.canal()
        esperado = (AJUSTES.get("canal.id") or "").strip()
        real = ficha["id"]
        if esperado and esperado != real:
            raise ErrorYouTube(
                f"el token autoriza el canal {ficha['snippet']['title']} ({real}) "
                f"pero la configuracion de '{AJUSTES.slug}' espera {esperado}. "
                "Revisa el secreto YT_REFRESH_TOKEN de ese canal."
            )
        if not esperado:
            di(
                "youtube",
                f"canal.id vacio en {AJUSTES.slug}; el token apunta a "
                f"{ficha['snippet']['title']} ({real}). Apuntalo en canales/{AJUSTES.slug}.json",
            )
        return ficha

    # ---------- subida ----------
    def subir(
        self,
        ruta: Path,
        titulo: str,
        descripcion: str,
        etiquetas: list[str],
        privacidad: str = "public",
        publicar_en: str | None = None,
    ) -> str:
        cuerpo = {
            "snippet": {
                "title": titulo[:100],
                "description": descripcion[:4900],
                "tags": etiquetas[:30],
                "categoryId": str(AJUSTES.get("publicacion.categoria_youtube", "24")),
                "defaultLanguage": AJUSTES.get("canal.idioma", "es"),
                "defaultAudioLanguage": AJUSTES.get("canal.idioma", "es"),
            },
            "status": {
                "privacyStatus": "private" if publicar_en else privacidad,
                "selfDeclaredMadeForKids": bool(
                    AJUSTES.get("publicacion.hecho_para_ninos", False)
                ),
            },
        }
        if publicar_en:
            cuerpo["status"]["publishAt"] = publicar_en

        tamano = ruta.stat().st_size
        inicio = requests.post(
            SUBIDA,
            params={"uploadType": "resumable", "part": "snippet,status"},
            headers={
                **self._cabeceras(),
                "Content-Type": "application/json; charset=UTF-8",
                "X-Upload-Content-Length": str(tamano),
                "X-Upload-Content-Type": "video/mp4",
            },
            data=json.dumps(cuerpo),
            timeout=60,
        )
        if inicio.status_code not in (200, 201):
            raise ErrorYouTube(f"YouTube no acepta la subida: {inicio.status_code} {inicio.text[:300]}")
        destino = inicio.headers.get("Location")
        if not destino:
            raise ErrorYouTube("YouTube no ha devuelto la URL de subida")

        di("subidor", f"subiendo {tamano / 1e6:.1f} MB")
        with ruta.open("rb") as f:
            r = requests.put(
                destino,
                data=f,
                headers={"Content-Type": "video/mp4", "Content-Length": str(tamano)},
                timeout=900,
            )
        if r.status_code not in (200, 201):
            raise ErrorYouTube(f"la subida ha fallado: {r.status_code} {r.text[:300]}")
        video_id = r.json().get("id", "")
        if not video_id:
            raise ErrorYouTube("la subida no ha devuelto id de video")
        return video_id


def enlace(video_id: str) -> str:
    return f"https://www.youtube.com/shorts/{video_id}"
