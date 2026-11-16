/* cielo_ui.js — interfaz de la pestaña «Cielo y eventos». Usa Cielo (js/cielo.js) y la lista `events` del explorador. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", VERDE = "#4f9f8c", NAR = "#ffb454", AZUL = "#2f80b8", INK = "#14282b", MUT = "#53696a";
  var corriendo = false, ultimo = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, texto) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (texto != null) n.textContent = texto; return n; }
  function fmt(x, d) { var t = Number(x).toFixed(d || 0).split("."); t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."); return t.join(","); }
  function mezcla(c1, c2, t) { var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16), r = [16, 8, 0].map(function (s) { return Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); }); return "rgb(" + r[0] + "," + r[1] + "," + r[2] + ")"; }
  function colorZ(z, vmax) { var t = Math.max(-1, Math.min(1, z / vmax)); return t >= 0 ? mezcla("#ffffff", VERDE, t) : mezcla("#ffffff", NAR, -t); }
  function pol(cx, cy, r, th) { var a = th * Math.PI / 180; return [cx - r * Math.cos(a), cy - r * Math.sin(a)]; }   // 0° al oeste, sentido horario (como la rueda del Laboratorio)

  function iniciar() {
    var sel = $("cielo_dominio"); if (!sel) return;
    var cuenta = {}; (typeof events !== "undefined" ? events : []).forEach(function (e) { var d = String(e.domain || ""); if (d) cuenta[d] = (cuenta[d] || 0) + 1; });
    var previo = sel.value; sel.innerHTML = "";
    Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).forEach(function (d) { var o = document.createElement("option"); o.value = d; o.textContent = d + " (" + fmt(cuenta[d]) + ")"; sel.appendChild(o); });
    if (previo && cuenta[previo]) sel.value = previo; else if (cuenta["sismo"]) sel.value = "sismo";
    alCambiarDominio();
  }
  function alCambiarDominio() {
    var esSismo = $("cielo_dominio").value === "sismo";
    $("cielo_vmin").value = esSismo ? 6 : ""; $("cielo_declust").disabled = !esSismo; if (!esSismo) $("cielo_declust").value = "no"; $("cielo_modo").value = esSismo ? "dias" : "anios";
    $("cielo_nota_dom").textContent = esSismo ? "" : "Este dominio puede tener estacionalidad o varios registros por evento (por ejemplo, una tormenta con muchas lecturas). Las fechas control de ±18 a 30 días caen en otra estación, así que muchas comparaciones salen «significativas» solo por la estación: es un control positivo del método, no un hallazgo. El declusterizado de Gardner–Knopoff solo se aplica a sismos.";
  }

  function seleccionar() {
    var dom = $("cielo_dominio").value, vmin = parseFloat($("cielo_vmin").value), y0 = parseInt($("cielo_y0").value, 10), y1 = parseInt($("cielo_y1").value, 10), out = [], salta = 0;
    (typeof events !== "undefined" ? events : []).forEach(function (e) {
      if (String(e.domain || "") !== dom) return;
      var t = Date.parse(e.datetime_utc), v = parseFloat(e.value), la = parseFloat(e.latitude), lo = parseFloat(e.longitude);
      if (!(t === t)) { salta++; return; }
      var y = new Date(t).getUTCFullYear(); if (y0 === y0 && y < y0) return; if (y1 === y1 && y > y1) return;
      if (vmin === vmin && !(v >= vmin)) return;
      out.push({ t: t, mag: v, lat: la, lon: lo });
    });
    return out;
  }

  function calcular() {
    if (corriendo) return; var msg = $("cielo_msg"), barra = $("cielo_barra");
    msg.textContent = "Cargando efemérides…"; $("cielo_res").style.display = "none";
    corriendo = true; $("cielo_ir").disabled = true;
    var base = ""; var lista = seleccionar(), bruto = lista.length, modo = $("cielo_declust").value;
    var prep = (window.__efem ? Promise.resolve() : Cielo.cargarEfemerides(base).then(function () { window.__efem = true; }));
    prep.then(function () {
      if (modo !== "no") { msg.textContent = "Quitando réplicas…"; lista = Cielo.declusterizar(lista, modo); }
      var tiempos = lista.map(function (e) { return e.t; });
      if (tiempos.length < 30) throw new Error("Hay solo " + tiempos.length + " eventos con esos filtros; se necesitan al menos 30.");
      msg.textContent = "Calculando las 225 comparaciones…";
      return new Promise(function (r) { setTimeout(function () { r(); }, 20); }).then(function () {
        var asp = Cielo.tablaAspectos(tiempos, 0), sec = Cielo.tablaSectores(tiempos, 36), N = parseInt($("cielo_placebos").value, 10);
        barra.style.display = "block"; barra.max = N; barra.value = 0; msg.textContent = "Cielos desplazados (azar): 0 de " + N;
        return Cielo.placebos(tiempos, N, 2026, function (k) { barra.value = k; msg.textContent = "Cielos desplazados (azar): " + k + " de " + N; }, $("cielo_modo").value).then(function (pl) {
          ultimo = { n: asp.n, bruto: bruto, modo: modo, asp: asp, sec: sec, pl: pl, N: N, dom: $("cielo_dominio").value, desp: $("cielo_modo").value }; dibujar(ultimo);
        });
      });
    }).catch(function (e) { msg.textContent = "No se pudo calcular: " + (e && e.message ? e.message : e); })
      .then(function () { corriendo = false; $("cielo_ir").disabled = false; barra.style.display = "none"; });
  }

  function pct(p, n) { return p === 0 ? "menos del " + (100 / n < 1 ? "1" : Math.round(100 / n)) + " %" : "el " + Math.round(p * 100) + " %"; }
  function dibujar(u) {
    $("cielo_msg").textContent = ""; $("cielo_res").style.display = "block";
    var ch = Cielo.cuerdas(u.asp.z), cnt = u.pl.cnt, media = cnt.reduce(function (s, x) { return s + x; }, 0) / cnt.length, p25 = Cielo.percentil(cnt, 0.025), p975 = Cielo.percentil(cnt, 0.975);
    var Pcu = cnt.filter(function (x) { return x >= ch.length; }).length / cnt.length, zmax = 0; for (var m = 0; m < 225; m++) zmax = Math.max(zmax, Math.abs(u.asp.z[m]));
    var Pmx = u.pl.mx.filter(function (x) { return x >= zmax; }).length / u.pl.mx.length;
    var modoTxt = u.modo === "simetrica" ? "sin réplicas (Gardner–Knopoff, ventana simétrica)" : (u.modo === "despues" ? "sin réplicas (solo posteriores)" : "sin declusterizar");
    var av = $("cielo_aviso"); av.style.display = "none"; av.textContent = "";
    if (u.dom !== "sismo") { av.style.display = "block"; av.textContent = "Ojo: este dominio tiene estacionalidad (por ejemplo, los huracanes se concentran de agosto a octubre) y a veces varios registros por evento. Las fechas control caen en otra estación, así que el Sol y los planetas cercanos salen «significativos» solo por la estación. Por eso los cielos desplazados se hicieron con años enteros (conservan la estación). Si aun así la real queda muy por encima del azar, sospecha del diseño antes que del cielo: para concluir hace falta un nulo que conserve la estación y contar una tormenta como un solo evento."; }
    else if (ch.length > p975 + 3 && Pcu < 0.05) { av.style.display = "block"; av.textContent = "La real queda por encima del 95 % del azar. Antes de creerlo: comprueba que quitaste las réplicas, que el catálogo es independiente, y repite el cálculo en otro periodo o catálogo (compuerta 3)."; }
    $("cielo_resumen").textContent = fmt(u.n) + " eventos usados de " + fmt(u.bruto) + " seleccionados · " + modoTxt + " · efemérides de 1970 a 2033: los eventos fuera de ese rango se omiten.";
    // rueda de cartas
    var cont = $("cielo_rueda"); cont.innerHTML = ""; var W = 740, H = 560, cx = 250, cy = 280, r0 = 56, dr = 16.5, vmax = 2.6, svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": "Rueda de cartas: un anillo por planeta, 36 sectores de 10 grados, coloreados por z" }); svg.style.maxWidth = "740px";
    var nSec = 36, fuera = 0, pos = 0, neg = 0;
    for (var p = 0; p < 10; p++) for (var s = 0; s < nSec; s++) {
      var z = u.sec.Z[p][s]; if (Math.abs(z) > 1.96) { fuera++; if (z > 0) pos++; else neg++; }
      var a0 = s * 10, a1 = a0 + 10, ri = r0 + p * dr, ro = ri + dr, P1 = pol(cx, cy, ri, a0), P2 = pol(cx, cy, ro, a0), P3 = pol(cx, cy, ro, a1), P4 = pol(cx, cy, ri, a1);
      svg.appendChild(el("path", { d: "M" + P1 + " L" + P2 + " A" + ro + " " + ro + " 0 0 1 " + P3 + " L" + P4 + " A" + ri + " " + ri + " 0 0 0 " + P1 + "Z", fill: colorZ(z, vmax), stroke: "#fff", "stroke-opacity": ".3", "stroke-width": ".4" }, null)).appendChild(el("title", {}, Cielo.PLAN[p] + " · " + (s * 10) + "°–" + (s * 10 + 10) + "° · z = " + z.toFixed(2)));
    }
    for (var k = 0; k < 12; k++) {
      var Pa = pol(cx, cy, r0, k * 30), Pb = pol(cx, cy, r0 + 10 * dr + 4, k * 30), Pg = pol(cx, cy, r0 + 10 * dr + 20, k * 30 + 15);
      svg.appendChild(el("line", { x1: Pa[0], y1: Pa[1], x2: Pb[0], y2: Pb[1], stroke: "#007a60", "stroke-width": "1.8" }));
      var g = el("text", { x: Pg[0], y: Pg[1], "text-anchor": "middle", "dominant-baseline": "central", "font-size": "17", fill: "#007a60" }, Cielo.SIGNOS[k]); svg.appendChild(g);
    }
    for (var q = 0; q < 10; q++) svg.appendChild(el("text", { x: 530, y: cy + (q - 4.5) * 24, "font-size": "13", fill: INK, "dominant-baseline": "central" }, Cielo.GLIFOS[q] + "  " + Cielo.PLAN[q]));
    svg.appendChild(el("text", { x: 530, y: 118, "font-size": "12", fill: "#007a60", "font-weight": "700" }, "Cada anillo es un planeta;"));
    svg.appendChild(el("text", { x: 530, y: 134, "font-size": "12", fill: "#007a60", "font-weight": "700" }, "el Sol está al centro."));
    cont.appendChild(svg);
    var zmaxS = 0, pS = 0, sS = 0; for (var p2 = 0; p2 < 10; p2++) for (var s2 = 0; s2 < nSec; s2++) { var zz = Math.abs(u.sec.Z[p2][s2]); if (zz > zmaxS) { zmaxS = zz; pS = p2; sS = s2; } }
    $("cielo_rueda_txt").textContent = "Casillas fuera de ±1,96: " + fuera + " (" + pos + " verdes y " + neg + " naranjas); el azar da unas 18 de 360. El mayor |z| es " + zmaxS.toFixed(2).replace(".", ",") + " (" + Cielo.PLAN[pS] + ", " + (sS * 10) + "°–" + (sS * 10 + 10) + "°). Verde: más eventos que en fechas control; naranja: menos. Los planetas lentos (Júpiter hacia afuera) salen casi blancos porque no distinguen un evento de otro; Sol, Mercurio y Venus se mueven juntos, así que sus casillas vecinas no son pruebas independientes.";
    // rueda de aspectos
    var c2 = $("cielo_aspectos"); c2.innerHTML = ""; var R = 150, cx2 = 190, cy2 = 190, sv2 = el("svg", { viewBox: "-40 0 460 390", width: "100%", role: "img", "aria-label": "Rueda de aspectos: cuerdas entre los planetas cuyo aspecto se aparta del azar" }); sv2.style.maxWidth = "460px";
    sv2.appendChild(el("circle", { cx: cx2, cy: cy2, r: R, fill: "none", stroke: "#007a60", "stroke-width": "2" }));
    var pts = Cielo.PLAN.map(function (_, i) { var a = (-90 + 36 * i) * Math.PI / 180; return [cx2 + R * Math.cos(a), cy2 + R * Math.sin(a)]; });
    ch.slice().sort(function (a, b) { return Math.abs(a.z) - Math.abs(b.z); }).forEach(function (c) {
      var P = pts[c.i], Q = pts[c.j], mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, cxp = cx2 + (mx - cx2) * 0.35, cyp = cy2 + (my - cy2) * 0.35, col = c.z > 0 ? AZUL : NAR;
      var pa = el("path", { d: "M" + P + " Q" + cxp + " " + cyp + " " + Q, fill: "none", stroke: col, "stroke-width": (1.5 + Math.abs(c.z) / 1.5).toFixed(1), "stroke-linecap": "round", opacity: ".9" }); pa.appendChild(el("title", {}, Cielo.PLAN[c.i] + " " + Cielo.ASP_GLIFO[c.a] + " " + Cielo.PLAN[c.j] + " · z = " + c.z.toFixed(2).replace(".", ","))); sv2.appendChild(pa);
      var mxp = 0.25 * P[0] + 0.5 * cxp + 0.25 * Q[0], myp = 0.25 * P[1] + 0.5 * cyp + 0.25 * Q[1];
      sv2.appendChild(el("circle", { cx: mxp, cy: myp, r: 10, fill: "#fff", stroke: col, "stroke-width": "2" })); sv2.appendChild(el("text", { x: mxp, y: myp + 1, "text-anchor": "middle", "dominant-baseline": "central", "font-size": "12", fill: INK }, Cielo.ASP_GLIFO[c.a]));
    });
    pts.forEach(function (P, i) { sv2.appendChild(el("circle", { cx: P[0], cy: P[1], r: 6, fill: "#005743" })); var a = (-90 + 36 * i) * Math.PI / 180; sv2.appendChild(el("text", { x: cx2 + (R + 26) * Math.cos(a), y: cy2 + (R + 26) * Math.sin(a), "text-anchor": "middle", "dominant-baseline": "central", "font-size": "11", fill: "#005743" }, Cielo.GLIFOS[i] + " " + Cielo.PLAN[i])); });
    c2.appendChild(sv2);
    // histograma de placebos
    var c3 = $("cielo_hist"); c3.innerHTML = ""; var topeP = Math.max.apply(null, cnt), fuera_escala = ch.length > topeP + 4, mxv = (fuera_escala ? topeP : Math.max(topeP, ch.length)) + 2, h = new Array(mxv + 1).fill(0); cnt.forEach(function (x) { h[x]++; }); var hm = Math.max.apply(null, h), sv3 = el("svg", { viewBox: "0 0 420 250", width: "100%", role: "img", "aria-label": "Cuántas cuerdas da el azar" }); sv3.style.maxWidth = "420px";
    var bw = 380 / (mxv + 1);
    for (var i2 = 0; i2 <= mxv; i2++) { var hh = 150 * h[i2] / hm, dentro = i2 >= p25 && i2 <= p975; sv3.appendChild(el("rect", { x: 20 + i2 * bw + 1, y: 190 - hh, width: bw - 2, height: hh, fill: dentro ? "#9fb9b2" : "#cfd9d6" })); if (i2 % 2 === 0 || mxv < 12) sv3.appendChild(el("text", { x: 20 + i2 * bw + bw / 2, y: 206, "text-anchor": "middle", "font-size": "10", fill: MUT }, String(i2))); }
    if (fuera_escala) { sv3.appendChild(el("text", { x: 400, y: 60, "text-anchor": "end", "font-size": "12", fill: AZUL, "font-weight": "700" }, "la real: " + ch.length + " →")); sv3.appendChild(el("text", { x: 400, y: 76, "text-anchor": "end", "font-size": "10", fill: AZUL }, "(fuera de escala, muy por encima del azar)")); } else { sv3.appendChild(el("line", { x1: 20 + ch.length * bw + bw / 2, x2: 20 + ch.length * bw + bw / 2, y1: 24, y2: 190, stroke: AZUL, "stroke-width": "3" })); sv3.appendChild(el("text", { x: 24 + ch.length * bw + bw / 2, y: 34, "font-size": "12", fill: AZUL, "font-weight": "700" }, "la real: " + ch.length)); }
    sv3.appendChild(el("text", { x: 210, y: 232, "text-anchor": "middle", "font-size": "11", fill: MUT }, "cuerdas fuera de ±1,96 en cada cielo desplazado"));
    c3.appendChild(sv3);
    $("cielo_aspectos_txt").innerHTML = ""; var t = $("cielo_aspectos_txt");
    var l1 = document.createElement("p"); l1.innerHTML = "<b></b>"; l1.firstChild.textContent = ch.length + " cuerdas fuera de ±1,96; el azar da " + media.toFixed(1).replace(".", ",") + " (95 % entre " + Math.round(p25) + " y " + Math.round(p975) + "). Ese número o más lo da el azar " + pct(Pcu, cnt.length) + " de las veces; el z más alto (" + zmax.toFixed(2).replace(".", ",") + ") lo iguala " + pct(Pmx, cnt.length) + "."; t.appendChild(l1);
    var l2 = document.createElement("p"); l2.className = "small muted"; l2.textContent = "Con " + fmt(u.n) + " eventos y una frecuencia base de 10 %, el piso de detección es RR ≈ " + Cielo.piso(u.n, 0.1).toFixed(2).replace(".", ",") + ": un efecto menor no se distingue del azar. Las 225 comparaciones no son independientes; el p-valor global sale de " + fmt(u.N) + " cielos desplazados (cada evento corrido entre 200 y 2.000 días, misma hora y lugar)."; t.appendChild(l2);
    var tb = $("cielo_tabla").tBodies[0]; tb.innerHTML = "";
    ch.forEach(function (c) { var m2 = c.q * 5 + c.a, tr = tb.insertRow(), vals = [Cielo.PLAN[c.i] + " " + Cielo.ASP_GLIFO[c.a] + " " + Cielo.PLAN[c.j], Cielo.ASP[c.a][0], fmt(u.asp.obs[m2]), fmt(u.asp.esp[m2], 1), (c.z > 0 ? "+" : "") + c.z.toFixed(2).replace(".", ",")]; vals.forEach(function (v) { tr.insertCell().textContent = v; }); });
    if (!ch.length) { var tr0 = tb.insertRow(), cc = tr0.insertCell(); cc.colSpan = 5; cc.textContent = "Ninguna comparación pasa ±1,96."; }
  }

  function ejemplo() {
    var d = $("cielo_dominio"); if (!d.options.length) iniciar(); d.value = "sismo"; alCambiarDominio();
    $("cielo_vmin").value = 6; $("cielo_y0").value = 2000; $("cielo_y1").value = 2024; $("cielo_declust").value = "simetrica"; $("cielo_modo").value = "dias"; $("cielo_placebos").value = "100";
    calcular(); var m = $("cielo_msg"); if (m && m.scrollIntoView) m.scrollIntoView({ block: "center" });
  }
  window.cieloInit = iniciar; window.cieloEjemplo = ejemplo; window.cieloCalcular = calcular; window.cieloAlCambiarDominio = alCambiarDominio;
})();
