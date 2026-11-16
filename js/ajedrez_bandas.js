/* ajedrez_bandas.js — «Los cambios de casa durante la partida»: bandas de movimiento de las 20 partidas del repositorio.
   Datos: datos/ajedrez_bandas.json (casas topocéntricas de Polich y Page, carta recalculada cada 2 minutos).
   SUPUESTO SIN VERIFICAR: la hora local de inicio y la sede de cada torneo están escritas de memoria. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", DATOS = null, cargando = false;
  var COL = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94"];
  function $(id) { return document.getElementById(id); }
  function el(tag, a, t) { var n = document.createElementNS(NS, tag); for (var k in a) n.setAttribute(k, a[k]); if (t != null) n.textContent = t; return n; }
  function coma(x, d) { return Number(x).toFixed(d).replace(".", ","); }
  function etiqueta(p) { return p.evento.replace("FIDE ", "") + " · ronda " + p.ronda + " · " + p.blancas.split(",")[0] + " – " + p.negras.split(",")[0] + " (" + p.resultado + ")"; }

  function cargar() {
    if (DATOS || cargando || !$("ajb_sel")) { if (DATOS) dibujar(); return; }
    cargando = true; $("ajb_info").textContent = "Cargando las partidas…";
    fetch("datos/ajedrez_bandas.json").then(function (r) { return r.json(); }).then(function (d) {
      DATOS = d; var s = $("ajb_sel"); s.innerHTML = "";
      d.partidas.forEach(function (p, i) { var o = document.createElement("option"); o.value = i; o.textContent = etiqueta(p); s.appendChild(o); });
      var k = d.partidas.findIndex(function (p) { return p.id.indexOf("wc_2021_dubai__game_06") === 0; }); if (k >= 0) s.value = k;
      cargando = false; dibujar();
    }).catch(function (e) { cargando = false; $("ajb_info").textContent = "No se pudieron cargar las partidas: " + e.message; });
  }

  function dibujar() {
    if (!DATOS) return; var p = DATOS.partidas[+$("ajb_sel").value], W = 780, H = 420, ml = 70, mr = 16, mt = 30, mb = 46, pw = W - ml - mr, ph = H - mt - mb, fil = ph / 10, x = function (h) { return ml + pw * h / p.horas; };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": "Bandas de movimiento: casa de la carta del instante en que está cada planeta durante la partida" }); svg.style.maxWidth = W + "px";
    DATOS.cuerpos.forEach(function (nom, k) {
      var y = mt + k * fil; svg.appendChild(el("text", { x: ml - 8, y: y + fil / 2, "text-anchor": "end", "dominant-baseline": "central", "font-size": "12", fill: "#14282b" }, nom));
      p.tramos[k].forEach(function (t) {
        var x0 = x(t[0]), x1 = x(t[1]), r = el("rect", { x: x0, y: y + 2, width: Math.max(x1 - x0, 0.5), height: fil - 4, fill: COL[t[2] - 1], stroke: "#fff", "stroke-width": "0.8" });
        r.appendChild(el("title", {}, nom + " · casa " + t[2] + " · de " + coma(t[0], 2) + " h a " + coma(t[1], 2) + " h")); svg.appendChild(r);
        if (x1 - x0 > 17) svg.appendChild(el("text", { x: (x0 + x1) / 2, y: y + fil / 2, "text-anchor": "middle", "dominant-baseline": "central", "font-size": "10.5", fill: "#14282b" }, String(t[2])));
      });
    });
    for (var h = 0; h <= p.horas; h++) { svg.appendChild(el("line", { x1: x(h), x2: x(h), y1: mt + 10 * fil, y2: mt + 10 * fil + 4, stroke: "#53696a" })); svg.appendChild(el("text", { x: x(h), y: mt + 10 * fil + 17, "text-anchor": "middle", "font-size": "11", fill: "#53696a" }, String(h))); }
    svg.appendChild(el("text", { x: ml + pw / 2, y: H - 8, "text-anchor": "middle", "font-size": "12", fill: "#14282b" }, "Horas desde el inicio de la partida (inicio supuesto: " + p.inicio_local_supuesto + ", hora de " + p.sede + ")"));
    p.mayores_perdidas.forEach(function (m, i) {
      svg.appendChild(el("line", { x1: x(m.hora), x2: x(m.hora), y1: mt - 4, y2: mt + 10 * fil, stroke: "#b4442b", "stroke-width": "1.6", "stroke-dasharray": "4 3" }));
      var t = el("text", { x: x(m.hora), y: mt - 8 - (i % 2) * 11, "text-anchor": "middle", "font-size": "10", fill: "#b4442b", "font-weight": "700" }, "j." + m.jugada); t.appendChild(el("title", {}, "Jugada " + m.jugada + ": pérdida de ventaja de " + coma(m.perdida, 1) + " puntos")); svg.appendChild(t);
    });
    var f = $("ajb_fig"); f.innerHTML = ""; f.appendChild(svg);
    var cam = p.tramos.reduce(function (s, t) { return s + t.length - 1; }, 0);
    $("ajb_info").textContent = p.evento + ", ronda " + p.ronda + ", " + p.fecha.replace(/\./g, "-") + " (" + p.sede + "): " + p.blancas + " – " + p.negras + ", " + p.resultado + ". " + coma(p.horas, 1) + " horas, " + p.jugadas + " medias jugadas, " + cam + " cambios de casa entre los diez cuerpos.";
  }

  window.ajbCargar = cargar; window.ajbDibujar = dibujar;
  document.addEventListener("DOMContentLoaded", function () { var b = document.querySelector('nav button[data-tab="ajedrez"]'); if (b) b.addEventListener("click", function () { setTimeout(cargar, 60); }); if (location.hash === "#ajedrez") setTimeout(cargar, 400); });
})();
