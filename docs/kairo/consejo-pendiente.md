# Consejo — lo que queda

## El encargo

Que se pueda meter **cualquier archivo** y que el consejo lo lea bien, **sin
que nadie tenga que transcribir nada a mano**.

Hoy funciona solo el PDF con capa de texto. Todo lo demás —una foto de un
documento, un PDF escaneado, un Word, una hoja de cálculo— o se queda fuera
o depende de que un modelo con vista tenga cuota, que es justo lo que ha
fallado tres veces seguidas.

## Lo que hay que hacer, por orden de lo que más duele

### 1. OCR en el servidor, antes de pedírselo a nadie

Es lo que falta de verdad. Un escaneo no tiene por qué costar una llamada:
`tesseract` lo lee en el ordenador, gratis, sin cuota y dando el **mismo
texto para los seis**, que es la propiedad que hace que el consejo valga
algo. Un modelo con vista, además de costar, puede inventarse lo que no ve.

Dónde encaja: en `src/lib/consejo/leer.ts`, entre detectar `estado:
"escaneo"` y rendirse. El motor y el aviso previo ya comparten ese módulo,
así que tocando ahí se arreglan los dos a la vez.

Dos cosas que ya sé y conviene no redescubrir:

- **Los documentos de este usuario son fotos, no escaneos planos.** Están
  curvadas, con sombra en un margen y con borde oscuro alrededor del papel.
  Pasarlas a `tesseract` tal cual pierde el margen derecho: lo comprobé con
  la carta de sanción y las líneas salían cortadas («...de lun:», «esta
  emp»). Hace falta preprocesar: recortar el borde (el papel ocupa en torno
  al 8,5 %–94,5 % del ancho), pasar a gris, `autocontrast` y binarizar
  suave. Con eso mejora, pero seguía degradando a la derecha.
- **`--psm 6` da bastante más texto que el 1, el 3 o el 4** en estas fotos
  (2.320 caracteres frente a 1.720). Probar también `--psm 11`/`12` y, si
  la curvatura sigue estorbando, mirar un enderezado previo.

Antes de dar el OCR por bueno hay que medirlo: si de una página salen
cuatro palabras sueltas, eso no es material y hay que decirlo, igual que se
hace ahora con los escaneos.

Instalación en su máquina (Debian/Crostini):

```bash
sudo apt install -y tesseract-ocr tesseract-ocr-spa poppler-utils
```

Y comprobar en `doctor` si está, para poder avisar de que falta en vez de
fallar raro.

### 2. Que el aviso previo cambie de tono

Ahora `/api/consejo/revisar` dice «escaneado» y bloquea el botón. Con OCR
tendría que decir «escaneado, lo paso por OCR aquí» y enseñar cuántos
caracteres salieron, antes de lanzar. Solo bloquear cuando ni el OCR saque
nada.

### 3. Los demás formatos

Ninguno necesita un modelo, todos son extracción de texto:

- `.docx` → `mammoth` o leer el XML del paquete.
- `.xlsx`, `.csv` → `xlsx`; una hoja se pasa a texto por filas.
- `.pptx` → texto de las formas.
- `.odt`, `.rtf` → LibreOffice en modo cabeza (`soffice --headless
  --convert-to txt`), que ya está instalado en muchos sitios.
- Imágenes sueltas (`.jpg`, `.png`) → el mismo camino que el escaneo.

Al añadirlos hay que tocar `ADJUNTOS.documentos` en `src/lib/tipos.ts`, la
firma de bytes en `tipoReal` (`documentos.ts`) y el `accept` del selector.

### 4. El modelo con vista, al final del todo

Que quede como último recurso y no como primera opción: solo cuando no hay
texto ni lo saca el OCR. Y que se diga en pantalla que se está gastando una
llamada en mirar un documento, porque ahora pasa sin avisar.

## Lo que NO hay que tocar

- El umbral de `pareceEscaneo` lo comparten el aviso previo y el motor a
  propósito. Si cada uno decide por su cuenta, el aviso miente.
- El PDF no viaja entero a ningún modelo: se extrae el texto en el servidor
  y lo que se manda son caracteres. Esa es la razón de que el consejo pueda
  permitirse diez archivos y 40 MB donde el chat solo admite cuatro y 4 MB.

## Estado al cerrar el día

- Los tres documentos del expediente real pasan la revisión previa en
  verde: carta transcrita (6.065 caracteres), demanda (7.394), sentencia
  (18.663). 32.122 en total, dentro del tope de 60.000.
- La carta de sanción original sigue siendo una foto sin texto. Se trabajó
  con una transcripción hecha a mano; eso es exactamente lo que este
  encargo viene a eliminar.
