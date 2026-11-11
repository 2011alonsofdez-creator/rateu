#!/usr/bin/env python3
"""Comprueba que las cifras de lo que escriben los agentes siguen siendo las
del código de Kairo.

POR QUÉ EXISTE
--------------
Entre el 06 y el 10 de noviembre de 2026, cuatro veces un cambio del dueño
dejó **falso** algo que los agentes habían escrito:

  · 06-11  la escala de créditos, en cuatro archivos de `agentes/ia/`
  · 06-11  el caso 7 del banco de pruebas, que esperaba 120 y 1.000
  · 07-11  la política de cookies, que decía "no hay analítica"
  · 10-11  (evitado a tiempo) el tono de la prueba de la portada

Las tres primeras se arreglaron a mano al día siguiente, y las tres veces la
conclusión fue "dejemos escrita una regla". Así que la regla acabó escrita en
tres archivos distintos, y eso no es una regla: es la prueba de que se nos
olvidó tres veces.

Esto es la regla hecha programa. No vigila estilo ni opiniones: solo cifras y
hechos que **salen del código** y que el material repite a mano.

CÓMO SE USA
-----------
    python3 agentes/comprobar/cifras.py

Salida 0 si todo cuadra. Salida 1 y una lista de desajustes si no, con el
archivo y la línea. No arregla nada: avisa.

CÓMO SE AMPLÍA
--------------
Cada comprobación es una entrada de `COMPROBACIONES`: de dónde sale el dato en
el código y qué archivos del material no pueden contradecirlo. Si mañana
aparece una cifra nueva en el producto, se añade aquí **el mismo día**, que es
justo la costumbre que este archivo intenta sustituir.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CODIGO = RAIZ / "kairo"
MATERIAL = RAIZ / "agentes"


# --------------------------------------------------------------------------
# De dónde sale cada cifra en el código. Nada escrito a mano aquí.
# --------------------------------------------------------------------------
def leer(ruta: str) -> str:
    return (CODIGO / ruta).read_text(encoding="utf-8")


def constante(texto: str, nombre: str, clave: str) -> str:
    """El valor de `clave` dentro del objeto `nombre`. Sin evaluar nada."""
    bloque = re.search(rf"{nombre}[^=]*=\s*\{{(.*?)\n\}};", texto, re.S)
    if not bloque:
        raise SystemExit(f"no encuentro la constante {nombre} en el código")
    valor = re.search(rf"\b{clave}\s*:\s*([0-9]+)", bloque.group(1))
    if not valor:
        raise SystemExit(f"no encuentro {nombre}.{clave} en el código")
    return valor.group(1)


def sql_default(archivo: str, columna: str) -> str:
    texto = leer(f"supabase/migrations/{archivo}")
    m = re.search(rf"alter column {columna} set default (\d+)", texto)
    if not m:
        raise SystemExit(f"no encuentro el default de {columna} en {archivo}")
    return m.group(1)


def sql_topes_por_plan(funcion: str) -> dict:
    """Los topes del disparador de la 0023, por plan.

    Hasta el 10-11 los topes eran uno para todos y se leían con un `>=`
    suelto. Esa noche el dueño los hizo POR PLAN (0023), así que el número
    único dejó de existir: leer ahora un `>=` daría el de un plan
    cualquiera y el verificador afirmaría un tope que no es de nadie.

    La base de datos manda sobre el TypeScript, y lo dice él mismo en el
    comentario de `COWORKS_POR_PLAN`: "si un día bailan, manda la de abajo".
    Así que de aquí salen los de verdad, y abajo se comprueba que los de
    `planes.ts` dicen lo mismo.
    """
    texto = leer("supabase/migrations/0023_topes_por_plan.sql")
    i = texto.index(f"function public.{funcion}")
    trozo = texto[i : i + 1200]
    sup = re.search(r"when 'supreme'\s*then\s*(\d+)", trozo)
    plus = re.search(r"when 'plus'\s*then\s*(\d+)", trozo)
    free = re.search(r"else\s+(\d+)", trozo)
    if not (sup and plus and free):
        raise SystemExit(f"no encuentro los topes por plan de {funcion} en 0023")
    return {"free": free.group(1), "plus": plus.group(1), "supreme": sup.group(1)}


planes = leer("src/lib/planes.ts")

NIVELES = {k: constante(planes, "CREDITOS_NIVEL", k) for k in ("fast", "normal", "forja", "mega")}
PLANES = {k: constante(planes, "CREDITOS_PLAN", k) for k in ("free", "plus", "supreme")}
REGALO = sql_default("0020_escala_x2.sql", "creditos_extra")

# Los topes, por plan desde el 10-11. La migración manda; `planes.ts` se
# comprueba contra ella, porque la pantalla lee el TypeScript y el servidor
# corta con el disparador: si bailan, la página vende algo que no se cumple.
COWORKS = sql_topes_por_plan("limitar_coworks")
MENTES = sql_topes_por_plan("limitar_mentes")
for cual, sql, nombre in (("Co-Works", COWORKS, "COWORKS_POR_PLAN"),
                          ("Mentes", MENTES, "MENTES_POR_PLAN")):
    for plan, tope in sql.items():
        ts = constante(planes, nombre, plan)
        if ts != tope:
            raise SystemExit(
                f"{nombre}.{plan} dice {ts} y la 0023 corta en {tope}: "
                f"la página vendería {ts} {cual} y el servidor dejaría {tope}"
            )

probar = leer("src/app/api/probar/route.ts")
GALLETA_PRUEBA = re.search(r'const GALLETA = "([^"]+)"', probar).group(1)
PRUEBAS_POR_VISITANTE = re.search(r"const POR_VISITANTE = (\d+)", probar).group(1)


def miles(n: str) -> str:
    """2000 → '2.000', como se escribe en los textos en español."""
    return f"{int(n):,}".replace(",", ".")


# --------------------------------------------------------------------------
# Qué no puede decir el material. Cada entrada: (qué es, patrón prohibido,
# por qué está prohibido ahora).
# --------------------------------------------------------------------------
TEXTOS = [
    "ia/conocimiento/creditos-y-planes.md",
    "ia/conocimiento/datos-y-privacidad.md",
    "ia/evals/banco-de-pruebas.md",
    *[str(p.relative_to(MATERIAL)) for p in sorted((MATERIAL / "ia/ejemplos").glob("*.md"))],
]

# Las cifras de la escala anterior, que es la que ha mordido cuatro veces.
VIEJAS = {
    "1 crédito": "el rápido cuesta {fast}",
    "normal 4": "el normal cuesta {normal}",
    "Forja 20": "Forja cuesta {forja}",
    "MEGA 120": "el MEGA cuesta {mega}",
    "120 créditos": "el MEGA cuesta {mega}",
    "20 créditos al día": "el plan gratis son {free} al día",
    "1.000 créditos al mes": "Kairo+ son {plus} al mes",
    "3.000 créditos al mes": "Supreme son {supreme} al mes",
    "150 créditos de regalo": "el regalo son {regalo}",
    "150 de regalo": "el regalo son {regalo}",
    "Co-Works ilimitados": (
        f"los topes son {COWORKS['free']} / {COWORKS['plus']} / {COWORKS['supreme']}"
    ),
    "Mentes ilimitadas": (
        f"los topes son {MENTES['free']} / {MENTES['plus']} / {MENTES['supreme']}"
    ),
    # Y las dos formas en que nuestro propio material contaba el tope de
    # antes del 10-11, cuando era uno para todos. Decirlo así ya es falso.
    "tope de 10 Co-Works": (
        f"ya no hay un tope único: {COWORKS['free']} / {COWORKS['plus']} / {COWORKS['supreme']}"
    ),
    "10 Co-Works y 30 Mentes": (
        f"son {COWORKS['plus']} y {MENTES['plus']} en Kairo+, y {COWORKS['supreme']} y {MENTES['supreme']} en Supreme"
    ),
}

CONTEXTO = dict(
    fast=NIVELES["fast"], normal=NIVELES["normal"], forja=NIVELES["forja"], mega=NIVELES["mega"],
    free=PLANES["free"], plus=miles(PLANES["plus"]), supreme=miles(PLANES["supreme"]),
    regalo=REGALO,
)

# Lo que la política de cookies tiene que nombrar, porque el código lo pone.
COOKIES = [
    (GALLETA_PRUEBA, "la prueba de la portada pone esta galleta"),
    ("kairo.theme", "preferencia guardada en el navegador"),
    ("kairo.lang", "preferencia guardada en el navegador"),
    ("kairo.buscar", "preferencia guardada en el navegador"),
    ("kairo.sonido", "preferencia guardada en el navegador"),
    ("kairo.borrador", "preferencia guardada en el navegador"),
]
POLITICA = "../kairo/src/app/legal/cookies/contenido.tsx"


def sin_comentarios_md(texto: str) -> str:
    """Fuera las notas de mantenimiento y el histórico: citan la cifra vieja
    a propósito, y marcarlas sería el falso positivo de siempre."""
    texto = texto.split("## Nota de mantenimiento")[0]
    texto = re.sub(r"\*\*(Historia de esta cifra|Era 1 / 4 / 20 / 120|Cifras actualizadas|Eran? \d+)[^\n]*\n", "", texto)
    return texto


def main() -> int:
    fallos: list[str] = []

    print("Cifras leídas del código:")
    print(f"  niveles  {NIVELES['fast']} / {NIVELES['normal']} / {NIVELES['forja']} / {NIVELES['mega']}")
    print(f"  planes   {PLANES['free']} al día · {miles(PLANES['plus'])} · {miles(PLANES['supreme'])}")
    print(f"  regalo   {REGALO}")
    print(
        f"  topes    Co-Works {COWORKS['free']} / {COWORKS['plus']} / {COWORKS['supreme']}"
        f" · Mentes {MENTES['free']} / {MENTES['plus']} / {MENTES['supreme']}"
        "  (free / Kairo+ / Supreme, leídos de la 0023)"
    )
    print(f"  prueba   {PRUEBAS_POR_VISITANTE} por visitante, galleta «{GALLETA_PRUEBA}»")
    print()

    for rel in TEXTOS:
        ruta = MATERIAL / rel
        if not ruta.exists():
            continue
        lineas = sin_comentarios_md(ruta.read_text(encoding="utf-8")).splitlines()
        for n, linea in enumerate(lineas, 1):
            for viejo, porque in VIEJAS.items():
                if viejo in linea:
                    fallos.append(f"{rel}:{n} dice «{viejo}» y {porque.format(**CONTEXTO)}")

    politica = (MATERIAL / POLITICA).resolve()
    if politica.exists():
        texto = politica.read_text(encoding="utf-8")
        for nombre, porque in COOKIES:
            if nombre not in texto:
                fallos.append(f"la política de cookies no nombra «{nombre}»: {porque}")
        if "no hay analítica" in texto:
            fallos.append("la política de cookies dice «no hay analítica», y `lib/rastro.ts` existe")

    if fallos:
        print(f"{len(fallos)} desajuste(s):")
        for f in fallos:
            print(f"  · {f}")
        return 1

    print("Todo cuadra: el material dice lo que dice el código.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
