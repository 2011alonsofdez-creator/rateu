#!/usr/bin/env python3
"""Genera la imagen de Open Graph de Kairo: kairo/public/og.png

La que se ve cuando alguien pega un enlace de Kairo en WhatsApp, X o
LinkedIn. Se genera aquí y se guarda en el repositorio como PNG en vez de
construirse en cada despliegue: así no hay código nuevo corriendo en el
build de Vercel, y si algún día hay que cambiarla, se vuelve a ejecutar
esto y ya.

    python3 agentes/entregas/og/generar-og.py

Colores y marca sacados de kairo/src/app/globals.css y de
kairo/src/app/icon.svg, no inventados.
"""

from PIL import Image, ImageDraw, ImageFont

ANCHO, ALTO = 1200, 630            # el tamaño que esperan todas las redes
FONDO = (9, 10, 13)                # --bg
TEXTO = (236, 237, 242)            # --fg
APAGADO = (152, 155, 166)          # --muted
NARANJA_1 = (255, 74, 28)          # el degradado del icono, extremo cálido
NARANJA_2 = (255, 122, 24)         # y el otro extremo

NEGRITA = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
NORMAL = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

SALIDA = "kairo/public/og.png"


def mezcla(c1, c2, t):
    """Un punto intermedio entre dos colores, para fingir el degradado."""
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))


def marca(lienzo, cx, cy, escala):
    """El icono de Kairo: tres círculos que se cruzan y un punto en medio.

    Son los tres modelos y la única respuesta que sale de ellos. Mismas
    proporciones que icon.svg, que trabaja sobre una caja de 100x100.
    """
    grosor = round(8 * escala)
    radio = 24 * escala
    circulos = [(50, 34), (34, 62), (66, 62)]
    for i, (x, y) in enumerate(circulos):
        color = mezcla(NARANJA_1, NARANJA_2, i / (len(circulos) - 1))
        px = cx + (x - 50) * escala
        py = cy + (y - 50) * escala
        lienzo.ellipse(
            [px - radio, py - radio, px + radio, py + radio],
            outline=color,
            width=grosor,
        )
    # El punto del centro, que en el icono va a la altura 51 de 100.
    punto = 8 * escala
    pcy = cy + (51 - 50) * escala
    lienzo.ellipse(
        [cx - punto, pcy - punto, cx + punto, pcy + punto],
        fill=mezcla(NARANJA_1, NARANJA_2, 0.5),
    )


def main():
    imagen = Image.new("RGB", (ANCHO, ALTO), FONDO)
    lienzo = ImageDraw.Draw(imagen)

    # Un filo cálido arriba, para que la tarjeta no sea un rectángulo negro.
    for x in range(ANCHO):
        lienzo.line(
            [(x, 0), (x, 6)],
            fill=mezcla(NARANJA_1, NARANJA_2, x / (ANCHO - 1)),
        )

    marca(lienzo, cx=142, cy=138, escala=1.6)

    nombre = ImageFont.truetype(NEGRITA, 126)
    lema = ImageFont.truetype(NEGRITA, 80)
    pie = ImageFont.truetype(NORMAL, 38)

    izquierda = 88
    lineas = [
        (izquierda, 226, "Kairo", nombre, TEXTO),
        (izquierda, 366, "La IA que trabaja", lema, TEXTO),
        (izquierda, 456, "cuando tú no.", lema, mezcla(NARANJA_1, NARANJA_2, 0.5)),
        (izquierda, 546, "Claude, Gemini y GPT. Una sola IA.", pie, APAGADO),
    ]
    for x, y, texto, fuente, color in lineas:
        lienzo.text((x, y), texto, font=fuente, fill=color)

    # Que no se salga nada: si un texto se sale del lienzo, mejor enterarse
    # aquí que al verlo recortado en la vista previa de WhatsApp.
    for x, y, texto, fuente, _ in lineas:
        izq, arr, der, aba = lienzo.textbbox((x, y), texto, font=fuente)
        if der > ANCHO - 40 or aba > ALTO - 20:
            raise SystemExit(
                f"El texto {texto!r} se sale: llega a x={der}, y={aba} "
                f"en un lienzo de {ANCHO}x{ALTO}."
            )
        print(f"  {texto[:28]:30} x {izq}-{der}   y {arr}-{aba}")

    imagen.save(SALIDA, "PNG", optimize=True)
    print(f"{SALIDA}  {imagen.width}x{imagen.height}")


if __name__ == "__main__":
    main()
