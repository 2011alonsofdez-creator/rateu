/* auth.js — lo que comparten todas las páginas con sesión:
   hablar con el servidor, los mensajes en pantalla y la pastilla de créditos. */
(function () {
  "use strict";

  var API = "api/index.php";

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Llamada al servidor. Nunca lanza errores crudos: devuelve siempre un objeto.
  function api(accion, datos, metodo) {
    var opciones = {
      method: metodo || (datos ? "POST" : "GET"),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" }
    };
    if (datos) opciones.body = JSON.stringify(datos);
    return fetch(API + "?a=" + encodeURIComponent(accion), opciones)
      .then(function (r) {
        return r.json().catch(function () { return { ok: false, error: "Respuesta inesperada del servidor." }; })
          .then(function (j) { j.__http = r.status; return j; });
      })
      .catch(function () {
        return { ok: false, __http: 0, error: "No he podido conectar con el servidor. Comprueba tu conexión." };
      });
  }

  // Mensajes en la página (nunca alert: bloquea la pestaña y parece un fallo).
  function toast(mensaje, tipo, ms) {
    var cont = document.querySelector(".tostadas");
    if (!cont) {
      cont = document.createElement("div");
      cont.className = "tostadas";
      document.body.appendChild(cont);
    }
    var t = document.createElement("div");
    t.className = "tostada" + (tipo ? " " + tipo : "");
    t.textContent = mensaje;
    cont.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s"; t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 4200);
  }

  function pintarCreditos(n) {
    var pastilla = document.querySelector("[data-creditos]");
    if (!pastilla) return;
    var valor = pastilla.querySelector("[data-creditos-num]");
    if (valor) valor.textContent = n;
    pastilla.classList.toggle("baja", n <= 3);
    pastilla.classList.add("late");
    setTimeout(function () { pastilla.classList.remove("late"); }, 320);
  }

  function pintarCabecera(perfil) {
    var ini = document.querySelector("[data-iniciales]");
    if (ini) ini.textContent = (perfil.email || "?").slice(0, 2).toUpperCase();
    var em = document.querySelector("[data-email]");
    if (em) em.textContent = perfil.email;
    var pl = document.querySelector("[data-plan-nombre]");
    if (pl) pl.textContent = perfil.plan_nombre;
    pintarCreditos(perfil.creditos);
  }

  // Exige sesión: si no la hay, manda a la pantalla de entrada.
  function exigirSesion() {
    return api("yo").then(function (r) {
      if (!r.ok || !r.perfil) { location.href = "entrar.html?volver=" + encodeURIComponent(location.pathname.split("/").pop()); return null; }
      pintarCabecera(r.perfil);
      return r.perfil;
    });
  }

  function initMenu() {
    var menu = document.querySelector(".menu-cuenta");
    if (!menu) return;
    var boton = menu.querySelector("button");
    var caja = menu.querySelector(".menu-desplegable");
    if (!boton || !caja) return;
    boton.addEventListener("click", function (e) {
      e.stopPropagation();
      caja.classList.toggle("abierto");
    });
    document.addEventListener("click", function () { caja.classList.remove("abierto"); });
    var salir = menu.querySelector("[data-salir]");
    if (salir) salir.addEventListener("click", function () {
      api("logout", {}).then(function () { location.href = "index.html"; });
    });
  }

  function formatoFecha(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }

  window.DF = {
    api: api, toast: toast, escHTML: escHTML,
    pintarCreditos: pintarCreditos, pintarCabecera: pintarCabecera,
    exigirSesion: exigirSesion, initMenu: initMenu, formatoFecha: formatoFecha,
    PLANES: {
      gratis:  { nombre: "Gratis",  creditos: 5,    precio: 0 },
      pro:     { nombre: "Pro",     creditos: 200,  precio: 19 },
      empresa: { nombre: "Empresa", creditos: 1000, precio: 59 }
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMenu);
  else initMenu();
})();
