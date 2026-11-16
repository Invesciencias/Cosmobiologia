/* accesibilidad.js — mejoras de accesibilidad que no cambian el aspecto de la página:
   1) cada campo de formulario recibe un nombre accesible (aria-label) si no tiene etiqueta asociada;
   2) los enlaces que abren otra pestaña reciben rel="noopener noreferrer".
   Se aplica al cargar y a lo que la página añada después (tablas, formularios generados). */
(function () {
  "use strict";
  function limpio(t) { return (t || "").replace(/\s+/g, " ").trim(); }
  function nombreDe(el) {
    if (el.getAttribute("aria-label") || el.title) return null;
    if (el.id && document.querySelector('label[for="' + el.id.replace(/"/g, '\\"') + '"]')) return null;
    if (el.closest("label")) return null;
    if (el.getAttribute("aria-labelledby")) return null;
    var t = limpio(el.placeholder);
    if (!t) { var p = el.previousElementSibling; if (p && p.tagName === "LABEL") t = limpio(p.textContent); }
    if (!t) { var c = el.parentElement; if (c) { var l = c.querySelector("label"); if (l && l.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) t = limpio(l.textContent); } }
    if (!t) { var c2 = el.closest("td,th,div,fieldset"); if (c2) { var l2 = c2.querySelector("label, legend, b, strong"); if (l2) t = limpio(l2.textContent); } }
    if (!t && el.tagName === "INPUT" && el.type === "checkbox") { var s = el.nextSibling; while (s && !limpio(s.textContent)) s = s.nextSibling; if (s) t = limpio(s.textContent); }
    if (!t) t = limpio((el.name || el.id || el.type || "").replace(/[_-]+/g, " "));
    return t ? t.slice(0, 90) : null;
  }
  function arreglar(raiz) {
    (raiz || document).querySelectorAll("input:not([type=hidden]),select,textarea").forEach(function (el) { var t = nombreDe(el); if (t) el.setAttribute("aria-label", t); });
    (raiz || document).querySelectorAll('a[target="_blank"]').forEach(function (a) { var r = (a.getAttribute("rel") || "").split(/\s+/); if (r.indexOf("noopener") < 0) r.push("noopener"); if (r.indexOf("noreferrer") < 0) r.push("noreferrer"); a.setAttribute("rel", r.join(" ").trim()); });
  }
  var pendiente = false;
  function programar() { if (pendiente) return; pendiente = true; setTimeout(function () { pendiente = false; arreglar(document); }, 300); }
  function iniciar() { arreglar(document); new MutationObserver(programar).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
