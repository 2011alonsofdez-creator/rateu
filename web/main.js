/* main.js — portada. Solo revelados al hacer scroll; el contenido ya está en el HTML. */
(function () {
  "use strict";

  var $$ = function (sel, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(sel)); };
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }

  function initRevelar() {
    var items = $$(".revelar");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { obs.observe(el); });
  }

  function initAnclas() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var destino = document.getElementById(id);
      if (!destino) return;
      e.preventDefault();
      var y = destino.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top: y, behavior: "smooth" });
      history.replaceState(null, "", "#" + id);
    });
  }

  function boot() {
    document.documentElement.classList.add("js");
    safe(initRevelar, "revelar");
    safe(initAnclas, "anclas");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
