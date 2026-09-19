# Datafactura — facturas y tickets a Excel

SaaS de extracción automática de datos de facturas y tickets para gestorías,
asesorías y autónomos. Todo el sitio está en la carpeta `web/`.

## Qué hace

El usuario sube facturas y tickets (PDF, JPG o PNG, varios a la vez), la IA lee
los campos clave, la web los muestra en una tabla editable junto al documento
original —señalando de dónde sale cada dato— y el usuario exporta a Excel o CSV.

## Qué es real y qué es maqueta

| Parte | Estado |
|---|---|
| Cuentas, contraseñas cifradas y sesiones | Real |
| Contador de créditos (se descuenta en el servidor) | Real |
| Lectura de documentos con IA | Real (necesita clave, ver abajo) |
| Avisos de baja confianza y de descuadre | Real |
| Exportación a Excel y CSV | Real |
| **Cobros y suscripciones** | **Maqueta señalizada en pantalla** |

## Estructura

```
web/                      ← esto es lo que se sube al hosting (a public_html)
  index.html              portada con precios y ejemplo antes/después
  entrar.html             entrada y alta de cuenta
  app.html                la herramienta
  cuenta.html             plan, créditos, historial, cancelación
  aviso-legal / privacidad / terminos / cookies
  setup.php               activar la clave de la IA desde el navegador (borrar después)
  api/index.php           cuentas, créditos y las comprobaciones de los importes
  api/gemini.php          único archivo que lee las claves de la IA
  lib/vendor/             pdf.js, Tesseract (OCR local) y JSZip
datafactura_datos/        ← FUERA de public_html: cuentas y créditos. No se toca al publicar.
publicar/datafactura.zip  paquete listo para subir
```

## Publicar

Subir el **contenido** de `web/` a la carpeta `public_html` del dominio
(o descomprimir ahí `publicar/datafactura.zip`). No hace falta compilar nada.

Después, abrir una sola vez `https://TU-DOMINIO/setup.php`, pegar una clave de
Anthropic (console.anthropic.com) o de Google (aistudio.google.com) y borrar
ese archivo. Sin clave, la web funciona pero no lee documentos.

Importante: la base de datos vive en `datafactura_datos/`, un nivel **por
encima** de `public_html`, para que al volver a publicar no se borren las
cuentas de los clientes.

## Pasar a cobros reales

Los nombres de las llamadas (`checkout`, `cancelar`, `webhook`) ya son los
definitivos: al conectar una pasarela solo cambia lo que hacen por dentro y se
retira el aviso de «MODO DEMO».
