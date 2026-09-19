/* entrar.js — entrada y alta de cuenta. */
(function () {
  "use strict";

  function boot() {
    var DF = window.DF;
    var params = new URLSearchParams(location.search);
    var modo = params.get("registro") ? "registro" : "entrar";
    var volver = params.get("volver") || "app.html";
    if (volver.indexOf("/") !== -1 || volver.indexOf(":") !== -1) volver = "app.html";
    var planDeseado = params.get("plan") || "";

    var tabEntrar = document.getElementById("tab-entrar");
    var tabRegistro = document.getElementById("tab-registro");
    var form = document.getElementById("formulario");
    var titulo = document.querySelector("[data-titulo]");
    var subtitulo = document.querySelector("[data-subtitulo]");
    var boton = document.querySelector("[data-enviar]");
    var cajaError = document.querySelector("[data-error]");
    var pieRegistro = document.querySelector("[data-pie-registro]");

    function pintarModo() {
      var esRegistro = modo === "registro";
      tabEntrar.setAttribute("aria-selected", String(!esRegistro));
      tabRegistro.setAttribute("aria-selected", String(esRegistro));
      titulo.textContent = esRegistro ? "Crea tu cuenta" : "Entra en tu cuenta";
      subtitulo.textContent = esRegistro
        ? "Empiezas con 5 créditos gratis. No hace falta tarjeta."
        : "Usa el correo y la contraseña con los que te registraste.";
      boton.textContent = esRegistro ? "Crear cuenta y empezar" : "Entrar";
      form.password.autocomplete = esRegistro ? "new-password" : "current-password";
      pieRegistro.classList.toggle("oculto", !esRegistro);
      cajaError.classList.add("oculto");
    }

    function mostrarError(msg) {
      cajaError.textContent = msg;
      cajaError.classList.remove("oculto");
    }

    tabEntrar.addEventListener("click", function () { modo = "entrar"; pintarModo(); });
    tabRegistro.addEventListener("click", function () { modo = "registro"; pintarModo(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      cajaError.classList.add("oculto");
      var email = form.email.value.trim();
      var password = form.password.value;
      if (!email || email.indexOf("@") === -1) { mostrarError("Escribe un correo válido."); return; }
      if (password.length < 8) { mostrarError("La contraseña necesita al menos 8 caracteres."); return; }

      boton.disabled = true;
      var textoOriginal = boton.textContent;
      boton.textContent = modo === "registro" ? "Creando tu cuenta…" : "Entrando…";

      DF.api(modo === "registro" ? "registro" : "login", { email: email, password: password })
        .then(function (r) {
          if (!r.ok) {
            mostrarError(r.error || "No he podido completar la operación. Inténtalo de nuevo.");
            boton.disabled = false; boton.textContent = textoOriginal;
            return;
          }
          var destino = volver;
          if (planDeseado && (planDeseado === "pro" || planDeseado === "empresa")) {
            destino = "cuenta.html?mejorar=" + planDeseado;
          }
          location.href = destino;
        });
    });

    // Si ya hay sesión abierta, no hace falta volver a entrar.
    DF.api("yo").then(function (r) { if (r.ok && r.perfil) location.href = volver; });

    pintarModo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
