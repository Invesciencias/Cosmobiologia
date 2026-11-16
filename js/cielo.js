/* cielo.js — núcleo de cálculo de la pestaña «Cielo y eventos».
   Sin dependencias del DOM. Compara el cielo de un conjunto de eventos con fechas control y con cielos desplazados (placebos).
   Efemérides: datos/efemerides_6h.bin (JPL DE421 vía Skyfield; codigo/generar_efemerides.py).
   Procedimiento (igual que laboratorio/graficas_evento.py):
     z = (observados − esperados) / sqrt(max(esperados, 1) · (1 + 1/K)), con K = 6 fechas control (±18, ±24, ±30 días, misma hora). */
(function (root) {
  "use strict";
  var PLAN = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"];
  var GLIFOS = ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇"].map(function (g) { return g + "︎"; });
  var SIGNOS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map(function (g) { return g + "︎"; });  /* variante de texto: sin emoji de colores */
  var ASP = [["conjunción", 0, 8], ["sextil", 60, 6], ["cuadratura", 90, 7], ["trígono", 120, 8], ["oposición", 180, 8]];
  var ASP_GLIFO = ["☌", "✶", "□", "△", "☍"];
  var CONTROLES_DIAS = [-30, -24, -18, 18, 24, 30];
  var DIA = 86400000;
  var PARES = []; for (var i = 0; i < 10; i++) for (var j = i + 1; j < 10; j++) PARES.push([i, j]);
  var EF = null;

  function cargarEfemerides(base) {
    base = base || "";
    return Promise.all([fetch(base + "datos/efemerides_6h.json").then(function (r) { return r.json(); }),
                        fetch(base + "datos/efemerides_6h.bin").then(function (r) { return r.arrayBuffer(); })]).then(function (x) {
      var m = x[0]; EF = { t0: Date.parse(m.inicio_utc), h: m.paso_horas * 3600000, n: m.pasos, tab: new Uint16Array(x[1]), meta: m };
      return EF;
    });
  }
  function fijarEfemerides(ef) { EF = ef; }

  /* longitud eclíptica (grados) del cuerpo p en el instante ms (UTC); NaN fuera de 1970–2033 */
  function lon(p, ms) {
    var x = (ms - EF.t0) / EF.h, k = Math.floor(x); if (!(k >= 0 && k < EF.n - 1)) return NaN;
    var f = x - k, a = EF.tab[p * EF.n + k] * 0.01, b = EF.tab[p * EF.n + k + 1] * 0.01, d = b - a;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    var r = (a + d * f) % 360; return r < 0 ? r + 360 : r;
  }
  function sep(a, b) { return Math.abs(((a - b + 540) % 360) - 180); }

  /* Declusterizado de Gardner–Knopoff (1974). modo: "simetrica" (ventana antes y después del evento mayor, como en las
     diapositivas del curso; n = 1.383 con USGS 2000–2024 M≥6) o "despues" (solo posteriores, como codigo/decluster.py; n = 1.433). */
  function declusterizar(ev, modo) {
    var n = ev.length, ord = ev.map(function (_, k) { return k; }).sort(function (a, b) { return ev[a].t - ev[b].t; });  /* ev[k].t en ms UTC */
    var T = ord.map(function (k) { return ev[k].t / DIA; }), M = ord.map(function (k) { return ev[k].mag; });
    var la = ord.map(function (k) { return ev[k].lat * Math.PI / 180; }), lo = ord.map(function (k) { return ev[k].lon * Math.PI / 180; });
    var vt = M.map(function (m) { return m >= 6.5 ? Math.pow(10, 0.032 * m + 2.7389) : Math.pow(10, 0.5409 * m - 0.547); });
    var vd = M.map(function (m) { return Math.pow(10, 0.1238 * m + 0.983); });
    var keep = new Uint8Array(n).fill(1), orden = M.map(function (_, k) { return k; }).sort(function (a, b) { return M[b] - M[a] || a - b; });
    for (var z = 0; z < n; z++) {
      var i = orden[z]; if (!keep[i]) continue;
      var s = Math.sin(la[i]), c = Math.cos(la[i]);
      var j0 = i, j1 = i;
      while (j0 > 0 && T[i] - T[j0 - 1] <= vt[i]) j0--;
      while (j1 < n - 1 && T[j1 + 1] - T[i] <= vt[i]) j1++;
      for (var j = j0; j <= j1; j++) {
        if (j === i || !keep[j] || M[j] > M[i]) continue;
        if (modo === "despues" && !(T[j] > T[i])) continue;
        var cs = Math.sin(la[j]) * s + Math.cos(la[j]) * c * Math.cos(lo[j] - lo[i]); cs = Math.max(-1, Math.min(1, cs));
        if (6371 * Math.acos(cs) <= vd[i]) keep[j] = 0;
      }
    }
    var out = []; for (var q = 0; q < n; q++) if (keep[q]) out.push(ev[ord[q]]); return out;
  }

  /* z de las 225 casillas (45 pares × 5 aspectos) para una lista de instantes (ms). desplazamiento: ms que se suman a todos. */
  function tablaAspectos(tiempos, desplazamiento) {
    var obs = new Float64Array(225), ctl = new Float64Array(225), K = CONTROLES_DIAS.length, usados = 0, L = new Float64Array(10);
    for (var e = 0; e < tiempos.length; e++) {
      var t0 = tiempos[e] + (desplazamiento || 0), ok = true;
      for (var p = 0; p < 10; p++) { L[p] = lon(p, t0); if (L[p] !== L[p]) ok = false; }
      if (!ok) continue;
      var LC = [];
      for (var k = 0; k < K; k++) { var arr = new Float64Array(10); for (var p2 = 0; p2 < 10; p2++) { arr[p2] = lon(p2, t0 + CONTROLES_DIAS[k] * DIA); if (arr[p2] !== arr[p2]) ok = false; } LC.push(arr); }
      if (!ok) continue; usados++;
      for (var q = 0; q < 45; q++) {
        var i = PARES[q][0], j = PARES[q][1], so = sep(L[i], L[j]);
        for (var a = 0; a < 5; a++) if (Math.abs(so - ASP[a][1]) <= ASP[a][2]) obs[q * 5 + a]++;
        for (var k2 = 0; k2 < K; k2++) { var sc = sep(LC[k2][i], LC[k2][j]); for (var a2 = 0; a2 < 5; a2++) if (Math.abs(sc - ASP[a2][1]) <= ASP[a2][2]) ctl[q * 5 + a2]++; }
      }
    }
    var z = new Float64Array(225), esp = new Float64Array(225);
    for (var m = 0; m < 225; m++) { var ee = ctl[m] / K; esp[m] = ee; z[m] = (obs[m] - ee) / Math.sqrt(Math.max(ee, 1) * (1 + 1 / K)); }
    return { z: z, obs: obs, esp: esp, n: usados };
  }
  function cuerdas(z, umbral) { var c = []; umbral = umbral || 1.96; for (var m = 0; m < 225; m++) if (Math.abs(z[m]) > umbral) c.push({ q: Math.floor(m / 5), a: m % 5, i: PARES[Math.floor(m / 5)][0], j: PARES[Math.floor(m / 5)][1], z: z[m] }); return c.sort(function (x, y) { return Math.abs(y.z) - Math.abs(x.z); }); }

  /* generador pseudoaleatorio reproducible (mulberry32) */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* Cielos desplazados: cada evento se corre entre 200 y 2000 días, con signo al azar. Devuelve el número de cuerdas (|z| > 1,96) y el máximo |z|
     de cada placebo. Asíncrono por tandas para no congelar la página; alPaso(k, N) informa el avance. */
  function placebos(tiempos, N, semilla, alPaso, modo) {
    var R = rng(semilla || 2026), cnt = [], mx = [], k = 0;
    return new Promise(function (resolve) {
      function tanda() {
        var fin = Math.min(N, k + 5);
        for (; k < fin; k++) {
          var desp = tiempos.map(function () { return modo === "anios" ? Math.round((1 + Math.floor(R() * 8)) * 365.25) * (R() < 0.5 ? -1 : 1) * DIA : Math.round((200 + R() * 1800)) * (R() < 0.5 ? -1 : 1) * DIA; });  /* "anios": años enteros, conserva la estación */
          var tt = tiempos.map(function (t, e) { return t + desp[e]; });
          var r = tablaAspectos(tt, 0), c = 0, m = 0; for (var q = 0; q < 225; q++) { var a = Math.abs(r.z[q]); if (a > 1.96) c++; if (a > m) m = a; }
          cnt.push(c); mx.push(m);
        }
        if (alPaso) alPaso(k, N);
        if (k < N) setTimeout(tanda, 0); else resolve({ cnt: cnt, mx: mx });
      }
      tanda();
    });
  }
  function percentil(v, p) { var s = v.slice().sort(function (a, b) { return a - b; }), x = (s.length - 1) * p, i = Math.floor(x), f = x - i; return i + 1 < s.length ? s[i] * (1 - f) + s[i + 1] * f : s[i]; }
  /* piso de detección (RR) para una frecuencia base f con n eventos: 1 + 2,4866·√((1−f)/(n·f)) (unilateral, potencia 80 %) */
  function piso(n, f) { return 1 + 2.4866 * Math.sqrt((1 - f) / (n * f)); }

  /* z de cada casilla planeta × sector de 10° (carta compuesta) frente a las mismas fechas control */
  function tablaSectores(tiempos, sectores) {
    sectores = sectores || 36; var K = CONTROLES_DIAS.length, o = [], c = [], usados = 0;
    for (var p = 0; p < 10; p++) { o.push(new Float64Array(sectores)); c.push(new Float64Array(sectores)); }
    for (var e = 0; e < tiempos.length; e++) {
      var t0 = tiempos[e], v = []; var ok = true;
      for (var p2 = 0; p2 < 10; p2++) { var l = lon(p2, t0); if (l !== l) ok = false; v.push(l); }
      var vc = []; for (var k = 0; k < K; k++) for (var p3 = 0; p3 < 10; p3++) { var lc = lon(p3, t0 + CONTROLES_DIAS[k] * DIA); if (lc !== lc) ok = false; vc.push(lc); }
      if (!ok) continue; usados++;
      for (var p4 = 0; p4 < 10; p4++) o[p4][Math.floor(v[p4] / (360 / sectores)) % sectores]++;
      for (var k2 = 0; k2 < K; k2++) for (var p5 = 0; p5 < 10; p5++) c[p5][Math.floor(vc[k2 * 10 + p5] / (360 / sectores)) % sectores]++;
    }
    var Z = []; for (var p6 = 0; p6 < 10; p6++) { var fila = new Float64Array(sectores); for (var s = 0; s < sectores; s++) { var ee = c[p6][s] / K; fila[s] = (o[p6][s] - ee) / Math.sqrt(Math.max(ee, 1) * (1 + 1 / K)); } Z.push(fila); }
    return { Z: Z, n: usados };
  }

  root.Cielo = { PLAN: PLAN, GLIFOS: GLIFOS, SIGNOS: SIGNOS, ASP: ASP, ASP_GLIFO: ASP_GLIFO, PARES: PARES, CONTROLES_DIAS: CONTROLES_DIAS,
    cargarEfemerides: cargarEfemerides, fijarEfemerides: fijarEfemerides, lon: lon, sep: sep, declusterizar: declusterizar, tablaAspectos: tablaAspectos,
    cuerdas: cuerdas, placebos: placebos, percentil: percentil, piso: piso, tablaSectores: tablaSectores, rng: rng };
  if (typeof module !== "undefined" && module.exports) module.exports = root.Cielo;
})(typeof window !== "undefined" ? window : globalThis);
