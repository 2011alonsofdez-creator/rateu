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

# LOS PANELES VIVOS, AÑADIDOS EL 11-11 Y POR UN MOTIVO CONCRETO.
#
# Este script nació el 10-11 mirando el material de entrenamiento, que es donde
# habían mordido los cuatro fallos conocidos. Ese mismo día, el radar buscando a
# mano para su informe encontró **cuatro cifras en presente y falsas** en los dos
# archivos que el script NO miraba: `CONTEXTO.md` —el que el protocolo manda leer
# antes de opinar— y el checklist de lanzamiento. Tres llevaban cinco días; una,
# doce.
#
# O sea que el agujero estaba justo donde más caro sale: no en lo que Kairo
# aprende, sino en lo que los cinco agentes leen antes de decidir nada.
PANELES = [
    "CONTEXTO.md",
    "ESTADO.md",
    "lanzamiento/checklist.md",
]

# LA COPIA DEL PRODUCTO, AÑADIDA EL 12-11 PORQUE HOY MORDIÓ AHÍ.
#
# Este script miraba el material de los agentes (10-11) y los paneles vivos
# (11-11). Lo que no miraba era **la app**, y hoy el guardián ha encontrado que
# `i18n.tsx` decía *"Puedes tener hasta 30 Mentes"* cuando desde la noche del
# 10-11 el tope es por plan: **3 / 30 / 150**. A quien estaba en el plan
# gratuito le prometía diez veces lo que iba a poder crear.
#
# Es el mismo agujero dos pisos más abajo: primero el material, luego los
# paneles, y debajo la copia que de verdad lee el usuario.
COPIA = [
    "src/lib/i18n.tsx",
    "src/lib/mock.ts",
    "src/app/precios/contenido.tsx",
    "src/components/ElegirPlan.tsx",
]


def sin_comentarios_ts(texto: str) -> str:
    """Fuera los comentarios, y no es un detalle: es lo que hace usable esto.

    La primera pasada sobre la app dio **tres** desajustes y los tres eran
    comentarios nuestros citando la historia a propósito: "suya la viñeta de
    los 150 de regalo", "Supreme da 25 y Kairo+ 5", "él dejó con «1 credit, a
    normal one 4, and a Mega-Prompt 120» escrito a mano". Cantarlos sería el
    error (c) de las plantillas otra vez, y un verificador con falsos
    positivos se apaga solo.

    El `(?<!:)` del `//` es para no partir una URL por la mitad.
    """
    # Los comentarios de bloque se sustituyen por SUS MISMOS saltos de línea,
    # no por nada. Borrarlos del todo corre las líneas de abajo y el script
    # señala el sitio equivocado: la primera versión acusaba a
    # `mock.ts:130`, que es un trozo de SQL de ejemplo, de hablar de
    # Co-Works. Un verificador que da bien el fallo y mal la línea manda a
    # leer el archivo entero, que es justo lo que viene a ahorrar.
    texto = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), texto, flags=re.S)
    return re.sub(r"(?<!:)//[^\n]*", "", texto)


def topes_sin_plan(linea: str) -> list[str]:
    """Un tope dicho a secas, sin decir de qué plan es.

    Desde el 10-11 los topes de Co-Works y Mentes son POR PLAN, así que una
    cifra sola —"hasta 30 Mentes"— es verdad para uno de los tres planes y
    falsa para los otros dos. Lo que se exige no es un número concreto: es que
    la frase diga **de quién** es, o que lleve el hueco `{n}` y lo rellene
    quien sabe el plan.

    Por eso no vale comprobar "que el número esté entre los tres valores":
    el fallo de hoy decía 30, que es exactamente el de Kairo+.
    """
    malas = []
    PLANES_CERCA = (
        "free", "Free", "gratis", "gratuito", "plus", "Kairo+", "supreme", "Supreme",
        "tu plan", "su plan", "your plan", "per plan", "{n}",
    )
    if any(p in linea for p in PLANES_CERCA):
        return malas


    # Y se mira la FRASE entera, no solo el número pegado al nombre. El fallo
    # de hoy tenía las dos formas: «30 Mentes» en el aviso del tope, y «hasta
    # 30, cada una con su tono» en la explicación, donde la palabra "Mentes"
    # está al principio de la frase y el número doce palabras después. Buscar
    # solo lo pegado cazaba el primero y se dejaba el segundo, que es el que
    # lee todo el mundo porque sale sin tener que chocar con el tope.
    for cual, topes in (("Mentes", MENTES), ("Co-Works", COWORKS)):
        # En singular también: la explicación de la pantalla empieza por "Una
        # Mente es tu propia IA…" y suelta el número doce palabras después,
        # sin repetir el plural. Esa es la frase que lee todo el mundo.
        nombres = ("Mentes", "Mente", "Minds", "Mind") if cual == "Mentes" else ("Co-Works", "Co-Work")
        if not any(n in linea for n in nombres):
            continue
        # NO cualquier número de la frase: solo el que de verdad suena a tope.
        #
        # La primera versión cogía el primer número que encontrara, y acusó a
        # dos respuestas de ejemplo que ofrecen "un Co-Work que te avise cada
        # martes a las 21:00": el 21 de una hora no es un tope. Así que el
        # número tiene que venir detrás de una palabra de tope —"hasta",
        # "máximo de", "up to"— o ir pegado al nombre.
        #
        # Las dos formas hacen falta, porque el fallo de hoy tenía las dos:
        # «hasta 30, cada una con su tono» en la explicación y «máximo de 30
        # Mentes» en el aviso.
        patrones = [
            r"(?:hasta|máximo de|máximo|como mucho|up to|maximum of|a maximum of)\s+(\d+)\b",
            r"\b(\d+)\s+(?:" + "|".join(nombres) + r")\b",
        ]
        for patron in patrones:
            m = re.search(patron, linea)
            if m:
                malas.append(
                    f"«{m.group(0).strip()}» habla de {cual} y no dice de qué plan; "
                    f"son {topes['free']} / {topes['plus']} / {topes['supreme']}"
                )
                break
    return malas


# LO QUE HAY QUE RECORTAR EN ELLOS, Y POR QUÉ NO ES UN DETALLE.
#
# Estos archivos guardan su propio histórico **dentro de la misma celda**: una
# fila del checklist encadena "Lo de antes:" y debajo lleva, citada a propósito,
# la cifra de hace una semana. Si el script leyera la celda entera cantaría esas
# citas como desajustes, y un verificador que da falsos positivos se desactiva
# solo: a la tercera vez nadie lo mira.
#
# Es el error (c) de los cuatro que están escritos en las plantillas de
# comprobación —"un grep sobre todo el archivo encuentra las comillas de uno
# mismo"—, y ya nos ha pasado: el 06-11 con el material y el 11-11 con la fila
# de claves del checklist, que cita `sk-` para explicar qué busca.
#
# Así que de cada línea se mira solo lo que afirma **hoy**: lo que va antes del
# primer marcador de histórico. Y se cuenta cuántas se recortaron, porque un
# recorte silencioso es otra forma de punto ciego.
MARCAS_DE_HISTORICO = (
    "Lo de antes:",
    "Lo de ayer:",
    "Lo de ayer,",
    "Lo que decía esta entrada",
    "Esta línea decía",
    "esta fila decía",
    "Decía ",
    ", de histórico",
    "El 10-11 era",
    # Salió en la primera ejecución: el veredicto del panel del 11-11 cita la
    # escala vieja para contar que estuvo cinco días publicada. Es histórico
    # como el de las filas, solo que introducido con otras palabras.
    "de antes del",
    "la escala de créditos de antes",
)


def solo_lo_de_hoy(linea: str) -> tuple[str, bool]:
    """Devuelve lo que la línea afirma hoy, y si hubo que recortarla."""
    corte = min(
        (linea.index(m) for m in MARCAS_DE_HISTORICO if m in linea),
        default=-1,
    )
    return (linea, False) if corte < 0 else (linea[:corte], True)

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

# --------------------------------------------------------------------------
# LA SEGUNDA RED, Y LA QUE DE VERDAD HACÍA FALTA (11-11).
#
# `VIEJAS` caza **frases** concretas de la escala anterior: sirve porque esas
# frases son las que mordieron, pero solo pilla lo que ya ha pasado. La prueba
# está hecha y es incómoda: se le pasaron los paneles del 10-11 por la mañana,
# con sus cuatro cifras falsas dentro, y **cazó dos** —las dos de "ilimitado"—.
# Las otras cuatro se le escaparon enteras:
#
#     `free` 15 créditos, `plus` 1000 y `supreme` 3000
#     Hoy son `fast` 1, `normal` 4, `forja` 20, `mega` 120
#
# No por poco: por la forma. `VIEJAS` busca "20 créditos al día" y el panel
# escribe "`free` 15 créditos"; busca "MEGA 120" y el panel escribe "`mega` 120".
# Un verificador que solo conoce la redacción de ayer no protege de la de mañana.
#
# Así que esto no busca frases: busca **un nombre de cifra pegado a un número** y
# lo compara con el código. "rápido 2" pasa; "rápido 1" no. Da igual cómo esté
# escrito alrededor.
#
# El número tiene que ir pegado al nombre —con comillas, dos puntos, un "cuesta"
# o un espacio en medio, nada más— para no cazar un número que pasaba por ahí.
# Por eso "los cuatro niveles: rápido, normal, Forja y MEGA" no dispara: después
# de "rápido" hay una coma, no una cifra.
# --------------------------------------------------------------------------
# El `(?![,.]\d|\s*€)` del final es lo que distingue un crédito de un precio:
# sin él, "Kairo+ 9,99 €/mes" se leía como "Kairo+ 9" y cantaba un desajuste
# contra los 2.000 créditos. Salió en la primera ejecución, en `CONTEXTO.md:76`.
PEGADO = r"[\s:=]*`?(?:cuesta|son|trae|da)?[\s:=]*`?(\d[\d.]*)\b(?![,.]\d|\s*€)"

def _n(txt: str) -> int:
    return int(txt.replace(".", ""))


def cifras_pegadas(linea: str) -> list[str]:
    """Nombres de cifra seguidos de un número que no es el del código."""
    malas = []
    esperado = [
        (r"`?(?:fast|rápido)`?", NIVELES["fast"], "el nivel rápido"),
        (r"`?(?:normal|estándar)`?", NIVELES["normal"], "el nivel normal"),
        (r"`?[Ff]orja`?", NIVELES["forja"], "Forja"),
        (r"`?(?:mega|MEGA|Mega-Prompt)`?", NIVELES["mega"], "el MEGA"),
        (r"`?(?:free|Free)`?", PLANES["free"], "el plan gratis, al día"),
        (r"`?(?:plus|Kairo\+)`?", PLANES["plus"], "Kairo+, al mes"),
        (r"`?(?:supreme|Supreme)`?", PLANES["supreme"], "Supreme, al mes"),
    ]
    for patron, valor, nombre in esperado:
        for m in re.finditer(patron + PEGADO, linea):
            if _n(m.group(1)) != _n(valor):
                malas.append(f"«{m.group(0).strip()}» y {nombre} son {valor}")
    # El regalo se escribe al revés que las demás: "los 300 de bienvenida".
    for m in re.finditer(r"(\d[\d.]*)\s+(?:créditos\s+)?de\s+(?:regalo|bienvenida)", linea):
        if _n(m.group(1)) != _n(REGALO):
            malas.append(f"«{m.group(0).strip()}» y el regalo son {REGALO}")
    return malas


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
            # La segunda red también aquí: el material se escribe con las
            # mismas palabras que los paneles y se queda viejo igual.
            for mala in sorted(set(cifras_pegadas(linea))):
                fallos.append(f"{rel}:{n} dice {mala}")

    # Los paneles vivos, con el histórico de cada línea recortado.
    recortadas = 0
    for rel in PANELES:
        ruta = MATERIAL / rel
        if not ruta.exists():
            continue
        crudas = ruta.read_text(encoding="utf-8").splitlines()
        hoy = []
        for cruda in crudas:
            linea, hubo = solo_lo_de_hoy(cruda)
            recortadas += hubo
            hoy.append(linea)

        # Primera pasada, línea a línea.
        por_linea: dict[int, set[str]] = {}
        for n, linea in enumerate(hoy, 1):
            for viejo, porque in VIEJAS.items():
                if viejo in linea:
                    fallos.append(f"{rel}:{n} dice «{viejo}» y {porque.format(**CONTEXTO)}")
            por_linea[n] = set(cifras_pegadas(linea))
            for mala in sorted(por_linea[n]):
                fallos.append(f"{rel}:{n} dice {mala}")

        # Segunda pasada, cada línea pegada a la siguiente: la prosa de los
        # paneles va envuelta a 76 columnas y una cifra se parte sin avisar.
        # En el panel del 10-11, «`plus` ("Kairo+")» terminaba la línea y el
        # «1000» empezaba la de abajo. Es el error (b) de las plantillas.
        # Solo se dice lo que NO apareció ya en ninguna de las dos sueltas,
        # que si no se cuenta dos veces el mismo fallo.
        for n in range(1, len(hoy)):
            junta = re.sub(r"\s+", " ", f"{hoy[n - 1]} {hoy[n]}")
            for mala in sorted(set(cifras_pegadas(junta)) - por_linea[n] - por_linea[n + 1]):
                fallos.append(f"{rel}:{n}-{n + 1} (partida en dos líneas) dice {mala}")
    # La copia del producto: lo que de verdad lee el usuario.
    for rel in COPIA:
        ruta = CODIGO / rel
        if not ruta.exists():
            continue
        for n, cruda in enumerate(sin_comentarios_ts(ruta.read_text(encoding="utf-8")).splitlines(), 1):
            for viejo, porque in VIEJAS.items():
                if viejo in cruda:
                    fallos.append(f"kairo/{rel}:{n} dice «{viejo}» y {porque.format(**CONTEXTO)}")
            for mala in sorted(set(cifras_pegadas(cruda))):
                fallos.append(f"kairo/{rel}:{n} dice {mala}")
            for mala in topes_sin_plan(cruda):
                fallos.append(f"kairo/{rel}:{n} dice {mala}")
    print(f"Copia del producto: {len(COPIA)} archivos, comentarios aparte.")

    print(
        f"Paneles vivos: {len(PANELES)} archivos, "
        f"{recortadas} línea(s) con histórico recortado antes de mirarlas."
    )
    print()

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
