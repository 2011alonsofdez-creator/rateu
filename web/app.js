/* app.js — la herramienta: subir, leer con IA, revisar y exportar.
   Script clásico + IIFE. Las librerías ESM (pdf.js) se cargan con import()
   dinámico solo cuando hacen falta. */
(function () {
  "use strict";

  var DF = window.DF;

  // ------------------------------------------------------------ campos
  var CAMPOS = [
    { k: "emisor_nombre",   e: "Emisor",           t: "texto" },
    { k: "emisor_nif",      e: "NIF del emisor",   t: "texto" },
    { k: "cliente_nombre",  e: "Cliente",          t: "texto" },
    { k: "cliente_nif",     e: "NIF del cliente",  t: "texto" },
    { k: "numero_factura",  e: "Nº de factura",    t: "texto" },
    { k: "fecha",           e: "Fecha de emisión", t: "texto" },
    { k: "base_imponible",  e: "Base imponible",   t: "num" },
    { k: "iva_porcentaje",  e: "IVA (%)",          t: "num" },
    { k: "iva_cuota",       e: "Cuota de IVA",     t: "num" },
    { k: "irpf_porcentaje", e: "IRPF (%)",         t: "num" },
    { k: "irpf_cuota",      e: "Cuota de IRPF",    t: "num" },
    { k: "total",           e: "Total",            t: "num" },
    { k: "moneda",          e: "Moneda",           t: "texto" },
    { k: "forma_pago",      e: "Forma de pago",    t: "texto" },
    { k: "concepto",        e: "Concepto",         t: "texto" }
  ];
  var OBLIGATORIOS = ["emisor_nombre", "emisor_nif", "fecha", "total"];
  var MAX_BYTES = 12 * 1024 * 1024;
  var CONCURRENCIA = 2;

  // ------------------------------------------------------------ estado
  var docs = [];
  var activoId = null;
  var enCurso = 0;
  var contadorId = 0;
  var creditos = 0;
  var planActual = "gratis";
  var pdfjsLib = null;

  var el = {};

  function $(s) { return document.querySelector(s); }
  function safe(fn, n) { try { return fn(); } catch (e) { console.warn("[" + n + "]", e); } }

  // ------------------------------------------------------------ utilidades
  function norm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function numEs(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(/\s|€/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }
  function fmt(v) {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number") return v.toFixed(2).replace(".", ",");
    return String(v);
  }
  function leerArchivo(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(",")[1]); };
      fr.onerror = function () { rej(new Error("lectura")); };
      fr.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------ comprobaciones (las mismas del servidor)
  function recalcular(d) {
    var c = d.campos || {};
    var avisos = [], dudosos = [], faltan = [];
    var base = numEs(c.base_imponible), iva = numEs(c.iva_cuota);
    var irpf = numEs(c.irpf_cuota) || 0, total = numEs(c.total);
    var pct = numEs(c.iva_porcentaje);
    d.descuadre = false;

    if (base !== null && iva !== null && total !== null) {
      var calc = Math.round((base + iva - irpf) * 100) / 100;
      if (Math.abs(calc - total) > 0.02) {
        d.descuadre = true;
        avisos.push("Los números no cuadran: base " + fmt(base) + " + IVA " + fmt(iva) +
          (irpf > 0 ? " − IRPF " + fmt(irpf) : "") + " = " + fmt(calc) +
          ", pero el total dice " + fmt(total) + ".");
      }
    }
    if (base !== null && pct !== null && iva !== null && base > 0) {
      var esperado = Math.round(base * pct / 100 * 100) / 100;
      if (Math.abs(esperado - iva) > Math.max(0.02, base * 0.005)) {
        avisos.push("La cuota de IVA no coincide con el " + fmt(pct) + " % de la base (saldría " + fmt(esperado) + ").");
      }
    }
    OBLIGATORIOS.forEach(function (k) {
      var v = c[k];
      if (v === null || v === undefined || v === "") faltan.push(k);
    });
    if (faltan.length) avisos.push("Faltan datos obligatorios que no he sabido leer.");

    CAMPOS.forEach(function (f) {
      var v = c[f.k];
      if (v === null || v === undefined || v === "") return;
      if (d.editado && d.editado[f.k]) return;          // corregido a mano: ya no es dudoso
      if ((d.confianza[f.k] || 0) < 0.7) dudosos.push(f.k);
    });
    if (dudosos.length) avisos.push((dudosos.length === 1 ? "Hay 1 dato leído con dudas." : "Hay " + dudosos.length + " datos leídos con dudas."));

    d.dudosos = dudosos; d.faltan = faltan; d.avisos = avisos;
    d.necesitaRevision = !!(d.descuadre || dudosos.length || faltan.length);
    return d;
  }

  // ------------------------------------------------------------ subida
  function anadirArchivos(lista) {
    var permitidos = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    var añadidos = 0;
    Array.prototype.forEach.call(lista, function (file) {
      var mime = file.type || "";
      if (permitidos.indexOf(mime) === -1) {
        DF.toast("«" + file.name + "» no es PDF, JPG ni PNG. Lo he saltado.", "error");
        return;
      }
      if (file.size > MAX_BYTES) {
        DF.toast("«" + file.name + "» pesa más de 12 MB. Hazle una foto con menos resolución.", "error");
        return;
      }
      docs.push({
        id: ++contadorId, file: file, nombre: file.name, mime: mime,
        estado: "cola", campos: {}, confianza: {}, origen: {}, editado: {},
        avisos: [], dudosos: [], faltan: [], descuadre: false, revisado: false,
        vista: null, chunks: null, chunksEstado: "no"
      });
      añadidos++;
    });
    if (añadidos) { pintarLista(); procesarCola(); }
  }

  function procesarCola() {
    while (enCurso < CONCURRENCIA) {
      var d = docs.filter(function (x) { return x.estado === "cola"; })[0];
      if (!d) break;
      procesar(d);
    }
    pintarResumen();
  }

  function procesar(d) {
    d.estado = "procesando";
    enCurso++;
    pintarLista();
    leerArchivo(d.file)
      .then(function (b64) {
        return DF.api("usar", { nombre: d.nombre, mime: d.mime, datos: b64 });
      })
      .then(function (r) {
        if (r.sin_creditos) {
          d.estado = "cola";                       // se queda esperando a que haya créditos
          creditos = r.creditos || 0;
          DF.pintarCreditos(creditos);
          pararPorFaltaDeCreditos();
          return;
        }
        if (!r.ok) {
          d.estado = "error";
          d.error = r.error || "No he podido leer este documento.";
          if (typeof r.creditos === "number") { creditos = r.creditos; DF.pintarCreditos(creditos); }
          return;
        }
        creditos = r.creditos;
        DF.pintarCreditos(creditos);
        var res = r.resultado || {};
        d.campos = res.campos || {};
        d.confianza = res.confianza || {};
        d.origen = res.origen || {};
        d.estado = "listo";
        recalcular(d);
        if (activoId === null) seleccionar(d.id);
      })
      .catch(function (e) {
        console.warn(e);
        d.estado = "error";
        d.error = "Ha fallado la subida de este archivo. Inténtalo otra vez.";
      })
      .then(function () {
        enCurso--;
        pintarLista(); pintarResumen();
        if (activoId === d.id) pintarDatos();
        procesarCola();
      });
  }

  function pararPorFaltaDeCreditos() {
    var pendientes = docs.filter(function (x) { return x.estado === "cola"; }).length;
    abrirModalPlanes(pendientes
      ? "Te has quedado sin créditos y quedan " + pendientes + (pendientes === 1 ? " documento" : " documentos") + " en espera. Al mejorar el plan seguirán solos."
      : "Cada documento procesado gasta un crédito. Elige un plan para seguir.");
  }

  // ------------------------------------------------------------ lista de documentos
  function iconoTipo(mime) { return mime === "application/pdf" ? "PDF" : "IMG"; }

  function pintarLista() {
    var soloAvisos = el.filtro.checked;
    var visibles = docs.filter(function (d) { return !soloAvisos || (d.estado === "listo" && d.necesitaRevision) || d.estado === "error"; });
    el.contador.textContent = docs.length;
    el.vacio.classList.toggle("oculto", docs.length > 0);

    el.lista.innerHTML = visibles.map(function (d) {
      var estado = "", clase = "p-gris";
      if (d.estado === "cola") estado = "En espera…";
      else if (d.estado === "procesando") estado = "Leyendo con IA…";
      else if (d.estado === "error") { estado = "No se ha podido leer"; clase = "p-rojo"; }
      else if (d.revisado) { estado = "Revisado"; clase = "p-verde"; }
      else if (d.descuadre) { estado = "Los números no cuadran"; clase = "p-rojo"; }
      else if (d.necesitaRevision) { estado = "Revisar " + d.dudosos.length + (d.dudosos.length === 1 ? " dato" : " datos"); clase = "p-ambar"; }
      else { estado = "Listo"; clase = "p-azul"; }

      var spinner = d.estado === "procesando"
        ? '<svg class="girando" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5" stroke-linecap="round"/></svg>' : "";

      return '<li class="doc' + (d.id === activoId ? " activo" : "") + '" data-id="' + d.id + '" tabindex="0">' +
        '<span class="doc-ico">' + iconoTipo(d.mime) + "</span>" +
        '<span class="doc-txt">' +
          '<span class="doc-nombre">' + DF.escHTML(d.nombre) + "</span>" +
          '<span class="doc-estado">' + spinner + '<span class="pastilla ' + clase + '">' + estado + "</span></span>" +
        "</span>" +
        '<button class="doc-quitar" type="button" data-quitar="' + d.id + '" aria-label="Quitar documento" title="Quitar de la lista">' +
        '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l8 8M14 6l-8 8"/></svg>' +
        "</button></li>";
    }).join("");

    if (soloAvisos && !visibles.length && docs.length) {
      el.lista.innerHTML = '<li class="nota" style="padding:14px;text-align:center">Ningún documento tiene avisos. 🎉</li>';
    }
  }

  function pintarResumen() {
    var listos = docs.filter(function (d) { return d.estado === "listo"; });
    var rev = listos.filter(function (d) { return d.revisado; }).length;
    var conAviso = listos.filter(function (d) { return d.necesitaRevision && !d.revisado; }).length;
    var pl = function (n, uno, varios) { return n + " " + (n === 1 ? uno : varios); };
    el.resumen.textContent = pl(listos.length, "documento", "documentos") + " · " +
      pl(rev, "revisado", "revisados") + (conAviso ? " · " + conAviso + " con avisos" : "");
    el.expCsv.disabled = el.expXlsx.disabled = listos.length === 0;
  }

  // ------------------------------------------------------------ selección y visor
  function docActivo() {
    return docs.filter(function (d) { return d.id === activoId; })[0] || null;
  }

  function seleccionar(id) {
    activoId = id;
    pintarLista();
    pintarDatos();
    prepararVista();
  }

  function prepararVista() {
    var d = docActivo();
    if (!d) return;
    el.visorEstado.textContent = "";
    if (d.vista) { pintarVisor(d); return; }

    el.visor.innerHTML = '<p class="visor-vacio">Preparando la vista del documento…</p>';

    if (d.mime === "application/pdf") {
      renderPdf(d).then(function () { pintarVisor(d); }).catch(function (e) {
        console.warn(e);
        el.visor.innerHTML = '<p class="visor-vacio">No he podido mostrar la vista previa de este PDF, pero los datos extraídos son válidos.</p>';
      });
    } else {
      var url = URL.createObjectURL(d.file);
      var img = new Image();
      img.onload = function () {
        d.vista = { src: url, w: img.naturalWidth, h: img.naturalHeight };
        pintarVisor(d);
        ocrSiHaceFalta(d);
      };
      img.onerror = function () { el.visor.innerHTML = '<p class="visor-vacio">No he podido mostrar esta imagen.</p>'; };
      img.src = url;
    }
  }

  // pdf.js usa dos métodos de Map muy recientes. Los navegadores que todavía no
  // los traen (Chrome y Edge algo atrasados, muchos equipos de oficina) fallarían
  // al dibujar el PDF; con este relleno funcionan igual.
  function rellenarMap() {
    [Map.prototype, WeakMap.prototype].forEach(function (proto) {
      if (!proto.getOrInsert) {
        Object.defineProperty(proto, "getOrInsert", {
          value: function (clave, valor) {
            if (!this.has(clave)) this.set(clave, valor);
            return this.get(clave);
          }, writable: true, configurable: true
        });
      }
      if (!proto.getOrInsertComputed) {
        Object.defineProperty(proto, "getOrInsertComputed", {
          value: function (clave, calcular) {
            if (!this.has(clave)) this.set(clave, calcular(clave));
            return this.get(clave);
          }, writable: true, configurable: true
        });
      }
    });
  }

  function cargarPdfjs() {
    if (pdfjsLib) return Promise.resolve(pdfjsLib);
    safe(rellenarMap, "rellenarMap");
    return import("./lib/vendor/pdfjs/pdf.min.mjs").then(function (mod) {
      mod.GlobalWorkerOptions.workerSrc = "lib/vendor/pdfjs/pdf.worker.min.mjs";
      pdfjsLib = mod;
      return mod;
    });
  }

  function renderPdf(d) {
    return d.file.arrayBuffer().then(function (buf) {
      return cargarPdfjs().then(function (lib) {
        return lib.getDocument({ data: new Uint8Array(buf) }).promise;
      });
    }).then(function (pdf) {
      return pdf.getPage(1).then(function (page) {
        var vp1 = page.getViewport({ scale: 1 });
        var escala = Math.min(2.2, Math.max(1, 1100 / vp1.width));
        var vp = page.getViewport({ scale: escala });
        var lienzo = document.createElement("canvas");
        lienzo.width = Math.round(vp.width);
        lienzo.height = Math.round(vp.height);
        // API de pdf.js 6: se pasa `canvas`, e `intent:"print"` para que no se
        // pare si la pestaña queda en segundo plano.
        return page.render({ canvas: lienzo, viewport: vp, intent: "print" }).promise.then(function () {
          d.vista = { src: lienzo.toDataURL("image/png"), w: lienzo.width, h: lienzo.height };
          return page.getTextContent();
        }).then(function (tc) {
          var chunks = [];
          tc.items.forEach(function (it) {
            if (!it.str || !it.str.trim()) return;
            var tr = it.transform;
            var x = tr[4], y = tr[5];
            var alto = Math.abs(it.height || tr[3] || 10);
            var ancho = it.width || (it.str.length * alto * 0.5);
            chunks.push({
              texto: it.str,
              x0: x / vp1.width,
              y0: (vp1.height - y - alto) / vp1.height,
              x1: (x + ancho) / vp1.width,
              y1: (vp1.height - y) / vp1.height
            });
          });
          d.chunks = chunks;
          d.chunksEstado = chunks.length > 2 ? "listo" : "sin-texto";
          if (d.chunksEstado === "sin-texto") ocrSiHaceFalta(d);   // PDF escaneado
        });
      });
    });
  }

  function pintarVisor(d) {
    if (!d.vista) return;
    el.visor.innerHTML =
      '<div class="visor-lienzo" data-lienzo>' +
        '<img src="' + d.vista.src + '" alt="Vista del documento ' + DF.escHTML(d.nombre) + '">' +
      "</div>";
    if (d.chunksEstado === "cargando") el.visorEstado.textContent = "Localizando el texto en la imagen…";
    else if (d.chunksEstado === "falla" || d.chunksEstado === "sin-texto") el.visorEstado.textContent = "";
  }

  // OCR local (solo para SEÑALAR dónde está cada dato; la lectura la hace la IA)
  function ocrSiHaceFalta(d) {
    if (d.chunksEstado === "listo" || d.chunksEstado === "cargando") return;
    d.chunksEstado = "cargando";
    if (activoId === d.id) el.visorEstado.textContent = "Localizando el texto en la imagen…";

    cargarTesseract()
      .then(function () {
        var origen = location.origin + location.pathname.replace(/[^/]*$/, "");
        return Tesseract.createWorker("spa", 1, {
          workerPath: origen + "lib/vendor/tesseract/worker.min.js",
          corePath: origen + "lib/vendor/tesseract/tesseract-core-simd.wasm.js",
          langPath: origen + "lib/vendor/tesseract/lang/",
          gzip: true,
          workerBlobURL: false
        });
      })
      .then(function (w) {
        return w.recognize(d.vista.src).then(function (res) {
          var W = res.data.width || d.vista.w, H = res.data.height || d.vista.h;
          var palabras = (res.data.words || []);
          d.chunks = palabras.map(function (p) {
            return {
              texto: p.text,
              x0: p.bbox.x0 / W, y0: p.bbox.y0 / H,
              x1: p.bbox.x1 / W, y1: p.bbox.y1 / H
            };
          });
          d.chunksEstado = d.chunks.length ? "listo" : "falla";
          return w.terminate();
        });
      })
      .then(function () {
        if (activoId === d.id) { el.visorEstado.textContent = ""; pintarDatos(); }
      })
      .catch(function (e) {
        console.warn("[ocr]", e);
        d.chunksEstado = "falla";
        if (activoId === d.id) { el.visorEstado.textContent = ""; pintarDatos(); }
      });
  }

  function cargarTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "lib/vendor/tesseract/tesseract.min.js";
      s.onload = res; s.onerror = function () { rej(new Error("tesseract")); };
      document.head.appendChild(s);
    });
  }

  // ------------------------------------------------------------ resaltar el origen de un dato
  function construirIndice(chunks, sinEspacios) {
    var s = "", mapa = [];
    chunks.forEach(function (c, i) {
      var t = norm(c.texto);
      if (sinEspacios) t = t.replace(/\s/g, "");
      if (!t) return;
      if (!sinEspacios && s) { s += " "; mapa.push(-1); }
      for (var k = 0; k < t.length; k++) mapa.push(i);
      s += t;
    });
    return { s: s, mapa: mapa };
  }

  function localizar(d, literal) {
    if (!d.chunks || !d.chunks.length || !literal) return [];
    var intentos = [
      { ix: construirIndice(d.chunks, false), aguja: norm(literal) },
      { ix: construirIndice(d.chunks, true), aguja: norm(literal).replace(/\s/g, "") }
    ];
    for (var n = 0; n < intentos.length; n++) {
      var ix = intentos[n].ix, aguja = intentos[n].aguja;
      if (!aguja) continue;
      var pos = ix.s.indexOf(aguja);
      if (pos === -1) continue;
      var vistos = {}, indices = [];
      for (var i = pos; i < pos + aguja.length; i++) {
        var ci = ix.mapa[i];
        if (ci >= 0 && !vistos[ci]) { vistos[ci] = 1; indices.push(ci); }
      }
      return indices.map(function (i) { return d.chunks[i]; });
    }
    return [];
  }

  function resaltar(campo) {
    var d = docActivo();
    if (!d || !d.vista) return;
    var lienzo = el.visor.querySelector("[data-lienzo]");
    if (!lienzo) return;
    Array.prototype.forEach.call(lienzo.querySelectorAll(".resalte"), function (x) { x.remove(); });
    if (!campo) return;

    var literal = d.origen[campo];
    var cajas = localizar(d, literal);
    if (!cajas.length && literal) {
      // Segundo intento: buscar el valor en sí (sin la etiqueta que lo acompaña)
      cajas = localizar(d, String(d.campos[campo] == null ? "" : d.campos[campo]));
    }
    if (!cajas.length) {
      if (d.chunksEstado === "cargando") DF.toast("Todavía estoy localizando el texto de la imagen, dame un segundo.");
      else DF.toast("No he podido señalar este dato en el documento. Compruébalo a ojo.");
      return;
    }
    var margen = 0.004;
    cajas.forEach(function (c) {
      var r = document.createElement("div");
      r.className = "resalte";
      r.style.left = ((c.x0 - margen) * 100) + "%";
      r.style.top = ((c.y0 - margen) * 100) + "%";
      r.style.width = ((c.x1 - c.x0 + margen * 2) * 100) + "%";
      r.style.height = ((c.y1 - c.y0 + margen * 2) * 100) + "%";
      lienzo.appendChild(r);
      requestAnimationFrame(function () { r.classList.add("visible"); });
    });
    var primera = cajas[0];
    var alto = el.visor.scrollHeight;
    el.visor.scrollTo({ top: Math.max(0, primera.y0 * alto - el.visor.clientHeight / 3), behavior: "smooth" });
  }

  // ------------------------------------------------------------ tabla de datos
  // Los avisos se dibujan aparte para poder refrescarlos mientras el usuario
  // edita un campo, sin rehacer la tabla (y sin perder el foco del cursor).
  function htmlAvisos(d) {
    var avisosHtml = "";
    if (d.descuadre) {
      avisosHtml += '<div class="aviso aviso-error"><strong>⚠️ Los números no cuadran.</strong><br>' +
        DF.escHTML(d.avisos.filter(function (a) { return a.indexOf("no cuadran") !== -1; })[0] || "") +
        "<br>Revisa la base, el IVA y el total antes de exportar.</div>";
    }
    var otros = d.avisos.filter(function (a) { return a.indexOf("no cuadran") === -1; });
    if (otros.length) {
      avisosHtml += '<div class="aviso" style="background:var(--ambar-bg);color:var(--ambar);border-color:var(--ambar-bd)">' +
        "<strong>Revisa esto antes de dar el documento por bueno:</strong><ul style='margin:8px 0 0 18px'>" +
        otros.map(function (a) { return "<li>" + DF.escHTML(a) + "</li>"; }).join("") + "</ul></div>";
    }
    if (!avisosHtml) {
      avisosHtml = '<div class="aviso aviso-ok">✓ Todo cuadra y los datos se han leído con claridad. Repásalo y márcalo como revisado.</div>';
    }
    if (d.chunksEstado === "falla" || (d.mime !== "application/pdf" && d.chunksEstado === "no")) {
      avisosHtml += '<p class="nota" style="margin:-6px 0 14px">No he podido localizar el texto dentro de la imagen, así que la lupa 🔍 no podrá señalar los datos en este documento.</p>';
    }

    return avisosHtml;
  }

  function pintarEstadoDoc(d) {
    el.estadoDoc.innerHTML = d.revisado
      ? '<span class="pastilla p-verde">Revisado</span>'
      : (d.descuadre ? '<span class="pastilla p-rojo">No cuadra</span>'
        : (d.necesitaRevision ? '<span class="pastilla p-ambar">Revisar</span>' : '<span class="pastilla p-azul">Listo</span>'));
  }

  function pintarDatos() {
    var d = docActivo();
    el.revisado.disabled = !d || d.estado !== "listo";
    el.revisado.checked = !!(d && d.revisado);

    if (!d) {
      el.panelDatos.innerHTML = '<p class="visor-vacio">Aquí aparecerán los campos de la factura, editables uno a uno.</p>';
      el.estadoDoc.innerHTML = "";
      return;
    }
    if (d.estado === "procesando" || d.estado === "cola") {
      el.panelDatos.innerHTML = '<p class="visor-vacio">' +
        (d.estado === "cola" ? "En espera de procesarse…" : "La IA está leyendo este documento…") + "</p>";
      el.estadoDoc.innerHTML = "";
      return;
    }
    if (d.estado === "error") {
      el.panelDatos.innerHTML = '<div class="aviso aviso-error">' + DF.escHTML(d.error || "No he podido leer este documento.") +
        '</div><button class="btn btn-secundario btn-s" data-reintentar>Volver a intentarlo</button>';
      el.estadoDoc.innerHTML = '<span class="pastilla p-rojo">Error</span>';
      return;
    }

    var avisosHtml = htmlAvisos(d);

    var filas = CAMPOS.map(function (f) {
      var v = d.campos[f.k];
      var vacio = (v === null || v === undefined || v === "");
      var conf = d.confianza[f.k] || 0;
      var editado = !!(d.editado && d.editado[f.k]);
      var clase = "fila";
      if (editado) clase += " editado";
      else if (!vacio && conf < 0.7) clase += " dudoso";
      else if (vacio && OBLIGATORIOS.indexOf(f.k) !== -1) clase += " vacio";
      var punto = editado ? "" : (conf >= 0.85 ? "" : (conf >= 0.7 ? " medio" : " bajo"));
      var sinMarca = editado || (vacio && OBLIGATORIOS.indexOf(f.k) === -1);
      var tieneOrigen = !!d.origen[f.k] || !vacio;

      return '<tr class="' + clase + '" data-fila="' + f.k + '">' +
        '<td class="etiqueta">' + f.e +
          (editado ? ' <span class="pastilla p-verde" style="font-size:.66rem;padding:2px 7px">corregido</span>' : "") +
        "</td>" +
        '<td><input data-campo="' + f.k + '" class="' + (f.t === "texto" ? "texto" : "") + '" ' +
          'value="' + DF.escHTML(f.t === "num" ? fmt(v) : (v == null ? "" : v)) + '" ' +
          'placeholder="' + (vacio ? "— no encontrado —" : "") + '" ' +
          'title="' + (d.origen[f.k] ? "Leído de: " + DF.escHTML(d.origen[f.k]) : "") + '"></td>' +
        '<td class="fila-marca">' + (sinMarca ? "" : '<span class="punto-conf' + punto + '" title="' +
          (vacio ? "La IA no ha encontrado este dato" : "Confianza de la IA: " + Math.round(conf * 100) + "%") + '"></span>') + "</td>" +
        '<td class="fila-marca"><button class="lupa" type="button" data-lupa="' + f.k + '" ' + (tieneOrigen ? "" : "disabled") +
          ' title="Señalar en el documento de dónde sale este dato" aria-label="Señalar en el documento">' +
          '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/></svg>' +
        "</button></td></tr>";
    }).join("");

    el.panelDatos.innerHTML = '<div data-avisos>' + avisosHtml + "</div>" +
      '<table class="campos-tabla"><thead><tr><th>Campo</th><th>Valor (editable)</th><th></th><th></th></tr></thead><tbody>' +
      filas + "</tbody></table>" +
      '<p class="nota" style="margin-top:14px">Los datos en ámbar son los que la IA ha leído con dudas. Corrige lo que haga falta: se guarda al momento y es lo que se exporta.</p>';

    pintarEstadoDoc(d);

    resaltar(null);
  }

  // ------------------------------------------------------------ exportación
  var COLUMNAS = [["archivo", "Archivo"]].concat(CAMPOS.map(function (f) { return [f.k, f.e]; }))
    .concat([["revisado", "Revisado"], ["avisos", "Avisos"]]);

  function filasExport() {
    return docs.filter(function (d) { return d.estado === "listo"; }).map(function (d) {
      var fila = { archivo: d.nombre };
      CAMPOS.forEach(function (f) {
        var v = d.campos[f.k];
        fila[f.k] = (v === null || v === undefined) ? "" : v;
      });
      fila.revisado = d.revisado ? "Sí" : "No";
      fila.avisos = d.avisos.join(" | ");
      return fila;
    });
  }

  function exportarCsv() {
    var filas = filasExport();
    if (!filas.length) return;
    var sep = ";";
    var lineas = [COLUMNAS.map(function (c) { return c[1]; }).join(sep)];
    filas.forEach(function (f) {
      lineas.push(COLUMNAS.map(function (c) {
        var v = f[c[0]];
        if (typeof v === "number") return String(v).replace(".", ",");   // Excel en español
        v = String(v == null ? "" : v);
        return /["\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(sep));
    });
    descargar(new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" }), nombreArchivo("csv"));
    DF.toast("CSV descargado con " + filas.length + (filas.length === 1 ? " documento." : " documentos."), "ok");
  }

  // .xlsx real construido a mano (una hoja, sin dependencias más allá de JSZip)
  function exportarXlsx() {
    var filas = filasExport();
    if (!filas.length) return;
    if (!window.JSZip) { DF.toast("No he podido preparar el Excel. Prueba con el CSV.", "error"); return; }

    function esc(s) {
      return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
    }
    function col(n) {
      var s = "";
      n++;
      while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
      return s;
    }
    function celda(ref, valor) {
      if (typeof valor === "number" && isFinite(valor)) return '<c r="' + ref + '"><v>' + valor + "</v></c>";
      var t = String(valor == null ? "" : valor);
      if (!t) return "";
      return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + esc(t) + "</t></is></c>";
    }

    var xmlFilas = ['<row r="1">' + COLUMNAS.map(function (c, i) { return celda(col(i) + "1", c[1]); }).join("") + "</row>"];
    filas.forEach(function (f, n) {
      var r = n + 2;
      xmlFilas.push('<row r="' + r + '">' + COLUMNAS.map(function (c, i) {
        return celda(col(i) + r, f[c[0]]);
      }).join("") + "</row>");
    });
    var anchos = COLUMNAS.map(function (c, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (i === 0 ? 26 : Math.max(11, c[1].length + 4)) + '" customWidth="1"/>';
    }).join("");

    var hoja = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      "<cols>" + anchos + "</cols>" +
      '<sheetData>' + xmlFilas.join("") + "</sheetData></worksheet>";

    var zip = new JSZip();
    zip.file("[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      "</Types>");
    zip.folder("_rels").file(".rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      "</Relationships>");
    zip.folder("xl").file("workbook.xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Facturas" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.folder("xl").folder("_rels").file("workbook.xml.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      "</Relationships>");
    zip.folder("xl").folder("worksheets").file("sheet1.xml", hoja);

    zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      .then(function (blob) {
        descargar(blob, nombreArchivo("xlsx"));
        DF.toast("Excel descargado con " + filas.length + (filas.length === 1 ? " documento." : " documentos."), "ok");
      })
      .catch(function (e) {
        console.warn(e);
        DF.toast("No he podido generar el Excel. Prueba con el CSV.", "error");
      });
  }

  function nombreArchivo(ext) {
    var f = new Date();
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return "facturas-" + f.getFullYear() + p(f.getMonth() + 1) + p(f.getDate()) + "." + ext;
  }
  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  // ------------------------------------------------------------ planes (maqueta)
  var planElegido = null;
  function abrirModalPlanes(texto) {
    $("[data-modal-texto]").textContent = texto || "Cada documento procesado gasta un crédito. Elige un plan para seguir.";
    el.modalPlanes.classList.add("abierto");
  }
  function cerrarModales() {
    el.modalPlanes.classList.remove("abierto");
    el.modalPago.classList.remove("abierto");
  }
  function abrirPago(plan) {
    planElegido = plan;
    var p = DF.PLANES[plan];
    $("[data-pago-plan]").textContent = p.nombre;
    $("[data-pago-precio]").textContent = p.precio + " €";
    el.modalPlanes.classList.remove("abierto");
    el.modalPago.classList.add("abierto");
  }
  function confirmarPago() {
    var boton = $("[data-confirmar-pago]");
    boton.disabled = true; boton.textContent = "Simulando el pago…";
    DF.api("checkout", { plan: planElegido }).then(function (r) {
      boton.disabled = false; boton.textContent = "Simular pago";
      if (!r.ok) { DF.toast(r.error || "No he podido activar el plan.", "error"); return; }
      cerrarModales();
      creditos = r.perfil.creditos;
      planActual = r.perfil.plan;
      DF.pintarCabecera(r.perfil);
      DF.toast("Plan " + r.perfil.plan_nombre + " activado (pago simulado). Tienes " + creditos + " créditos.", "ok", 6000);
      procesarCola();
    });
  }

  // ------------------------------------------------------------ arranque
  function boot() {
    el.lista = $("[data-lista]");
    el.vacio = $("[data-vacio]");
    el.contador = $("[data-contador]");
    el.filtro = $("[data-filtro-avisos]");
    el.soltar = $("[data-soltar]");
    el.input = $("[data-archivos]");
    el.visor = $("[data-visor]");
    el.visorEstado = $("[data-visor-estado]");
    el.panelDatos = $("[data-panel-datos]");
    el.estadoDoc = $("[data-estado-doc]");
    el.revisado = $("[data-revisado]");
    el.resumen = $("[data-resumen]");
    el.expCsv = $("[data-exportar-csv]");
    el.expXlsx = $("[data-exportar-xlsx]");
    el.modalPlanes = $("[data-modal-planes]");
    el.modalPago = $("[data-modal-pago]");

    // Subida
    el.soltar.addEventListener("click", function () { el.input.click(); });
    el.soltar.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.input.click(); }
    });
    el.input.addEventListener("change", function () { anadirArchivos(el.input.files); el.input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) {
      el.soltar.addEventListener(ev, function (e) { e.preventDefault(); el.soltar.classList.add("encima"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      el.soltar.addEventListener(ev, function (e) { e.preventDefault(); el.soltar.classList.remove("encima"); });
    });
    el.soltar.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) anadirArchivos(e.dataTransfer.files);
    });
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("drop", function (e) { e.preventDefault(); });

    // Lista
    el.lista.addEventListener("click", function (e) {
      var quitar = e.target.closest("[data-quitar]");
      if (quitar) {
        e.stopPropagation();
        var id = parseInt(quitar.getAttribute("data-quitar"), 10);
        docs = docs.filter(function (d) { return d.id !== id; });
        if (activoId === id) { activoId = docs.length ? docs[0].id : null; pintarDatos(); if (activoId) prepararVista(); else el.visor.innerHTML = '<p class="visor-vacio">Selecciona un documento de la lista para verlo aquí.</p>'; }
        pintarLista(); pintarResumen();
        return;
      }
      var fila = e.target.closest(".doc");
      if (fila) seleccionar(parseInt(fila.getAttribute("data-id"), 10));
    });
    el.filtro.addEventListener("change", pintarLista);

    // Tabla de datos: edición, lupa y reintento
    el.panelDatos.addEventListener("input", function (e) {
      var campo = e.target.getAttribute && e.target.getAttribute("data-campo");
      if (!campo) return;
      var d = docActivo(); if (!d) return;
      var def = CAMPOS.filter(function (f) { return f.k === campo; })[0];
      var bruto = e.target.value.trim();
      d.campos[campo] = bruto === "" ? null : (def.t === "num" ? numEs(bruto) : bruto);
      d.editado[campo] = true;
      recalcular(d);
      e.target.closest("tr").classList.add("editado");
      e.target.closest("tr").classList.remove("dudoso", "vacio");
      var caja = el.panelDatos.querySelector("[data-avisos]");
      if (caja) caja.innerHTML = htmlAvisos(d);
      pintarEstadoDoc(d);
      pintarLista(); pintarResumen();
    });
    // Ojo: no se vuelve a dibujar la tabla al salir de un campo; eso rompería
    // el tabulador. Los avisos ya se refrescan al escribir.
    el.panelDatos.addEventListener("click", function (e) {
      var lupa = e.target.closest("[data-lupa]");
      if (lupa) { resaltar(lupa.getAttribute("data-lupa")); return; }
      if (e.target.closest("[data-reintentar]")) {
        var d = docActivo();
        if (d) { d.estado = "cola"; d.error = null; pintarLista(); pintarDatos(); procesarCola(); }
      }
    });
    el.panelDatos.addEventListener("focusin", function (e) {
      var campo = e.target.getAttribute && e.target.getAttribute("data-campo");
      if (campo) resaltar(campo);
    });

    el.revisado.addEventListener("change", function () {
      var d = docActivo(); if (!d) return;
      d.revisado = el.revisado.checked;
      pintarLista(); pintarResumen(); pintarDatos();
    });

    el.expCsv.addEventListener("click", exportarCsv);
    el.expXlsx.addEventListener("click", exportarXlsx);

    // Planes
    Array.prototype.forEach.call(document.querySelectorAll("[data-plan]"), function (b) {
      b.addEventListener("click", function () { abrirPago(b.getAttribute("data-plan")); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cerrar-modal]"), function (b) {
      b.addEventListener("click", cerrarModales);
    });
    $("[data-confirmar-pago]").addEventListener("click", confirmarPago);
    [el.modalPlanes, el.modalPago].forEach(function (m) {
      m.addEventListener("click", function (e) { if (e.target === m) cerrarModales(); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarModales(); });

    // Avisar antes de perder el trabajo sin exportar
    window.addEventListener("beforeunload", function (e) {
      var listos = docs.filter(function (d) { return d.estado === "listo"; });
      if (listos.length) { e.preventDefault(); e.returnValue = ""; }
    });

    DF.exigirSesion().then(function (perfil) {
      if (!perfil) return;
      creditos = perfil.creditos;
      planActual = perfil.plan;
      if (!perfil.ia_activa) {
        DF.toast("La IA todavía no está activada en esta web: falta configurar la clave en el servidor.", "error", 9000);
      }
      if (creditos === 0) {
        abrirModalPlanes("No te quedan créditos. Elige un plan para seguir procesando documentos.");
      }
    });

    pintarResumen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { safe(boot, "boot"); });
  else safe(boot, "boot");
})();
