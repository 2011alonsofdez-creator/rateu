/* cuenta.js — plan, créditos, historial y cambio de plan (simulado). */
(function () {
  "use strict";
  var DF = window.DF;
  var perfil = null;
  var planElegido = null;

  function $(s) { return document.querySelector(s); }

  var VENTAJAS = {
    gratis:  ["5 documentos al mes", "Todas las funciones", "Sin tarjeta"],
    pro:     ["200 documentos al mes", "Subida masiva", "Avisos de descuadre", "Soporte por correo"],
    empresa: ["1.000 documentos al mes", "Todo lo del plan Pro", "Soporte prioritario"]
  };

  function pintarPlanes() {
    var cont = $("[data-planes]");
    cont.innerHTML = ["gratis", "pro", "empresa"].map(function (k) {
      var p = DF.PLANES[k];
      var actual = perfil.plan === k;
      return '<article class="plan' + (k === "pro" && !actual ? " plan-destacado" : "") + '">' +
        "<h3>" + p.nombre + "</h3>" +
        '<div class="plan-precio">' + p.precio + " €<small> /mes</small></div>" +
        '<p class="plan-creditos">' + p.creditos.toLocaleString("es-ES") + " créditos al mes</p>" +
        "<ul>" + VENTAJAS[k].map(function (v) {
          return '<li><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10.5l4 4 8-9"/></svg> ' + DF.escHTML(v) + "</li>";
        }).join("") + "</ul>" +
        (actual
          ? '<span class="btn btn-secundario" style="pointer-events:none;opacity:.7">Tu plan actual</span>'
          : (k === "gratis"
            ? '<button class="btn btn-secundario" type="button" data-bajar>Volver al plan gratuito</button>'
            : '<button class="btn ' + (k === "pro" ? "btn-primario" : "btn-secundario") + '" type="button" data-elegir="' + k + '">Cambiar a ' + p.nombre + "</button>")) +
        "</article>";
    }).join("");
  }

  function pintar(p) {
    perfil = p;
    DF.pintarCabecera(p);
    $("[data-plan-grande]").textContent = p.plan_nombre;
    $("[data-precio-plan]").textContent = DF.PLANES[p.plan].precio + " € al mes · " + DF.PLANES[p.plan].creditos.toLocaleString("es-ES") + " créditos";
    $("[data-renovacion]").textContent = p.renovacion
      ? "Se renueva el " + DF.formatoFecha(p.renovacion) + " (simulado)."
      : "El plan gratuito no se renueva automáticamente.";
    $("[data-creditos-grande]").textContent = p.creditos.toLocaleString("es-ES");
    $("[data-creado]").textContent = DF.formatoFecha(p.creado);

    var docsHechos = (p.historial || []).filter(function (h) { return h.accion === "documento"; }).length;
    $("[data-total-docs]").textContent = docsHechos;

    var botonCancelar = $("[data-cancelar]");
    botonCancelar.classList.toggle("oculto", p.plan === "gratis");
    $("[data-nota-cancelar]").textContent = p.plan === "gratis"
      ? "Estás en el plan gratuito: no hay nada que cancelar."
      : "Al cancelar vuelves al plan gratuito de inmediato.";

    var nombres = { documento: "Documento procesado", alta: "Alta de la cuenta", pago_simulado: "Cambio de plan (simulado)", cancelacion: "Cancelación", renovacion: "Renovación mensual" };
    var h = p.historial || [];
    $("[data-historial]").innerHTML = h.length
      ? h.map(function (x) {
          return "<li><span class='fecha'>" + DF.formatoFecha(x.fecha) + "</span>" +
            "<span>" + DF.escHTML(nombres[x.accion] || x.accion) +
            (x.detalle ? " · <span style='color:var(--gris)'>" + DF.escHTML(x.detalle) + "</span>" : "") + "</span>" +
            "<span class='coste'>" + (x.coste ? "−" + x.coste + " créd." : "") + "</span></li>";
        }).join("")
      : "<li class='nota'>Todavía no has procesado ningún documento.</li>";

    pintarPlanes();
  }

  function abrirPago(plan) {
    planElegido = plan;
    $("[data-pago-plan]").textContent = DF.PLANES[plan].nombre;
    $("[data-pago-precio]").textContent = DF.PLANES[plan].precio + " €";
    $("[data-modal-pago]").classList.add("abierto");
  }
  function cerrar() { $("[data-modal-pago]").classList.remove("abierto"); }

  function boot() {
    document.addEventListener("click", function (e) {
      var elegir = e.target.closest("[data-elegir]");
      if (elegir) { abrirPago(elegir.getAttribute("data-elegir")); return; }
      if (e.target.closest("[data-bajar]") || e.target.closest("[data-cancelar]")) {
        if (!confirm("¿Seguro que quieres volver al plan gratuito? Perderás los créditos del plan actual.")) return;
        DF.api("cancelar", {}).then(function (r) {
          if (!r.ok) { DF.toast(r.error || "No he podido cancelar.", "error"); return; }
          pintar(r.perfil);
          DF.toast("Has vuelto al plan gratuito.", "ok");
        });
        return;
      }
      if (e.target.closest("[data-cerrar-modal]")) cerrar();
    });

    $("[data-confirmar-pago]").addEventListener("click", function () {
      var b = this;
      b.disabled = true; b.textContent = "Simulando el pago…";
      DF.api("checkout", { plan: planElegido }).then(function (r) {
        b.disabled = false; b.textContent = "Simular pago";
        if (!r.ok) { DF.toast(r.error || "No he podido activar el plan.", "error"); return; }
        cerrar();
        pintar(r.perfil);
        DF.toast("Plan " + r.perfil.plan_nombre + " activado (pago simulado, no se ha cobrado nada).", "ok", 6000);
      });
    });

    $("[data-modal-pago]").addEventListener("click", function (e) { if (e.target === this) cerrar(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });

    DF.exigirSesion().then(function (p) {
      if (!p) return;
      pintar(p);
      var mejorar = new URLSearchParams(location.search).get("mejorar");
      if (mejorar && DF.PLANES[mejorar] && mejorar !== "gratis" && p.plan !== mejorar) abrirPago(mejorar);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
