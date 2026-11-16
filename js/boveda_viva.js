/* boveda_viva.js — versión animada de la figura «bóveda + curva del azar».
   Cuenta el método en 15 s: el observador (el huevo) apunta un telescopio a pares de planetas; cada cuerda que se dibuja es una prueba y el rombo cae
   casi siempre cerca del centro de la curva del azar; una cuerda parece destacar, pero no pasa el umbral corregido, y con el cielo desplazado también aparece.
   Es una ilustración esquemática, no un dato. Con «reducir movimiento» se conserva la imagen estática. */
(function () {
  "use strict";
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var TX = {
    es: { t1: "Probamos muchos aspectos entre planetas…", t2: "Uno parece destacar…", t3: "…pero con cielos desplazados también aparece: era azar.", t4: "Por eso comparamos con el azar antes de creer.", um: "umbral corregido", rep: "↻ clic para repetir", cap: "Animación esquemática: el observador mira pares de planetas; cada cuerda cae en la curva del azar." },
    en: { t1: "We test many aspects between planets…", t2: "One seems to stand out…", t3: "…but with shifted skies it also appears: it was chance.", t4: "That is why we compare with chance before believing.", um: "corrected threshold", rep: "↻ click to replay", cap: "Schematic animation: the observer looks at pairs of planets; each chord lands on the chance curve." },
    fr: { t1: "Nous testons de nombreux aspects entre planètes…", t2: "L'un semble ressortir…", t3: "…mais avec des ciels décalés il apparaît aussi : c'était le hasard.", t4: "C'est pourquoi nous comparons au hasard avant de croire.", um: "seuil corrigé", rep: "↻ clic pour rejouer", cap: "Animation schématique : l'observateur regarde des paires de planètes ; chaque corde tombe sur la courbe du hasard." }
  };
  var FIN = 12.9, CX = 450, HY = 470, RR = 335, BW = 900, BH = 703, LOOP = 15, N = 11, SX = 130, DEPTH = 165;
  var CHORDS = [[0, 6], [2, 9], [1, 7], [4, 10], [3, 8], [5, 9], [0, 4], [2, 6], [1, 10]], ZS = [0.3, -0.7, 0.9, -0.2, 1.2, -1.1, 0.5, 0.1, -0.4], GOLD = [0, 8];
  var logo = new Image(); logo.src = "imagenes/logo-invesciencias.png";
  function lang() { var l = document.documentElement.lang || "es"; return TX[l] ? l : "es"; }
  function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function seeded(n) { var s = 7, a = []; for (var i = 0; i < n; i++) { s = (s * 16807) % 2147483647; a.push(s / 2147483647); } return a; }
  var STARS = seeded(150);

  function Viva(img) {
    var cv = document.createElement("canvas"); cv.setAttribute("role", "img"); cv.setAttribute("aria-label", img.getAttribute("alt") || ""); cv.style.cssText = "width:100%;height:auto;aspect-ratio:" + BW + "/" + BH + ";display:block;border-radius:12px";
    img.parentNode.replaceChild(cv, img); var ctx = cv.getContext("2d"), W = 0, t0 = performance.now(), raf = 0, vis = true, last = 0, z = 0, aim = -1.2, fin = 0, inicio = false;
    var cap = cv.parentNode.querySelector("figcaption"); if (cap) cap.textContent = TX[lang()].cap;
    function size() { var r = cv.getBoundingClientRect(); if (!r.width) return false; var d = Math.min(window.devicePixelRatio || 1, 2); W = r.width; cv.width = Math.round(W * d); cv.height = Math.round(W * BH / BW * d); ctx.setTransform(d * W / BW, 0, 0, d * W / BW, 0, 0); return true; }
    function pos(i, s) { var u = i / (N - 1) + s; if (u > 1.0001) u -= 1.1; var a = Math.max(0, Math.min(1, u)) * Math.PI; return { x: CX - RR * Math.cos(a), y: HY - RR * Math.sin(a), al: u < 0 || u > 1 ? 0 : 1 }; }
    function bez(P, Q, t) { var mx = (P.x + Q.x) / 2, my = (P.y + Q.y) / 2, qx = CX + (mx - CX) * 0.3, qy = HY - (HY - my) * 0.3, u = 1 - t; return { x: u * u * P.x + 2 * u * t * qx + t * t * Q.x, y: u * u * P.y + 2 * u * t * qy + t * t * Q.y }; }
    function cuerda(P, Q, p, col, w, dash, alpha) {
      if (p <= 0) return; ctx.beginPath(); for (var k = 0; k <= 28; k++) { var q = bez(P, Q, p * k / 28); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
      ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha = alpha; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    function curvaY(zz) { return HY + 14 + DEPTH * Math.exp(-zz * zz / 2); }
    function frame(ts) {
      raf = 0; if (!vis) return; var tot = (ts - t0) / 1000, quieta = tot >= LOOP + FIN, t = quieta ? FIN : tot % LOOP, dt = last ? Math.min((ts - last) / 1000, 0.1) : 0.016; last = ts; var tx = TX[lang()];
      // escena
      var g = ctx.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, "#00805f"); g.addColorStop(1, "#006a52"); ctx.fillStyle = g; ctx.fillRect(0, 0, BW, BH);
      STARS.forEach(function (v, i) { if (i % 2) return; var x = v * BW, y = STARS[(i + 31) % 150] * (HY - 20); ctx.globalAlpha = 0.25 + 0.4 * STARS[(i + 7) % 150]; ctx.fillStyle = "#fff"; ctx.fillRect(x, y, 2, 2); }); ctx.globalAlpha = 1;
      var shift = t >= 9.4 && t < 13.2 ? 0.09 * sm((t - 9.4) / 1.2) * (1 - sm((t - 12.2) / 1.0)) : 0;
      // arcos
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 2; [0.66, 0.43].forEach(function (f) { ctx.beginPath(); ctx.arc(CX, HY, RR * f, Math.PI, 2 * Math.PI); ctx.stroke(); });
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX, HY, RR, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(60, HY); ctx.lineTo(840, HY); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 30px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillText("♒︎", CX, HY - RR - 26);
      var P = []; for (var i = 0; i < N; i++) P.push(pos(i, shift));
      // cuerdas de prueba
      var aimPt = { x: CX, y: HY - RR * 0.9 }, estado = 0, zt = 0;
      CHORDS.forEach(function (c, k) {
        var a = 1.0 + 0.62 * k, p = sm((t - a) / 0.6); var al = t > 13.2 ? 0 : t >= 7 ? 0.22 : 0.55; if (t > 13.2) al = Math.max(0, 0.22 * (1 - (t - 13.2) / 1.2));
        cuerda(P[c[0]], P[c[1]], p, "#fff", 1.6, [7, 7], p < 1 ? 0.9 : al);
        if (t >= a && t < a + 0.62) { var q = p < 0.4 ? P[c[0]] : bez(P[c[0]], P[c[1]], sm((p - 0.4) / 0.6)); aimPt = q; }
        if (t >= a + 0.6 && t < 7) zt = ZS[k];
      });
      if (t >= 1 && t < 7) estado = 1;
      // cuerda dorada
      var ga = 7.2, gp = sm((t - ga) / 1.2); if (t >= ga && t < 13.2) { cuerda(P[GOLD[0]], P[GOLD[1]], gp, "#f0a81c", 4, null, 1); if (t < 8.4) aimPt = gp < 0.4 ? P[GOLD[0]] : bez(P[GOLD[0]], P[GOLD[1]], sm((gp - 0.4) / 0.6)); }
      if (t >= 7 && t < 9.4) { estado = 2; zt = t >= 8.4 ? 2.1 : zt; }
      if (t >= 9.4 && t < 13.2) { estado = 3; var u = (t - 9.4) / 3.8; aimPt = pos(Math.round(1 + 8 * u), shift); zt = u < 0.33 ? 1.7 : u < 0.66 ? -1.9 : 2.3; }
      if (t >= 13.2) { estado = 4; zt = 0.2; aimPt = { x: CX, y: HY - RR * 0.9 }; }
      if (t < 1) estado = 0;
      // planetas
      P.forEach(function (p, i) { if (!p.al) return; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 6.2832); ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fill(); ctx.beginPath(); ctx.arc(p.x, p.y, 7.5, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#006a52"; ctx.lineWidth = 3; ctx.stroke(); });
      // curva del azar + umbral
      var cur = []; for (var zz = -3.4; zz <= 3.4; zz += 0.1) cur.push([CX + zz * SX, curvaY(zz)]);
      var gf = ctx.createLinearGradient(0, HY, 0, HY + DEPTH + 20); gf.addColorStop(0, "rgba(255,255,255,.04)"); gf.addColorStop(1, "rgba(255,255,255,.34)");
      ctx.beginPath(); ctx.moveTo(cur[0][0], HY + 14); cur.forEach(function (c) { ctx.lineTo(c[0], c[1]); }); ctx.lineTo(cur[cur.length - 1][0], HY + 14); ctx.closePath(); ctx.fillStyle = gf; ctx.fill();
      ctx.beginPath(); cur.forEach(function (c, k) { if (k) ctx.lineTo(c[0], c[1]); else ctx.moveTo(c[0], c[1]); }); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.stroke();
      var ua = sm((t - 8.6) / 0.8) * (t < 13.2 ? 1 : 1 - sm((t - 13.2) / 1.0));
      if (ua > 0.01) { ctx.globalAlpha = ua; ctx.setLineDash([6, 6]); ctx.strokeStyle = "#ffe28a"; ctx.lineWidth = 2; [-2.6, 2.6].forEach(function (u) { ctx.beginPath(); ctx.moveTo(CX + u * SX, HY + 14); ctx.lineTo(CX + u * SX, curvaY(u) + 28); ctx.stroke(); }); ctx.setLineDash([]); ctx.fillStyle = "#ffe28a"; ctx.font = "600 17px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillText(tx.um, CX + 2.6 * SX + 8, HY + 14 + DEPTH * 0.55); ctx.globalAlpha = 1; }
      // rombo
      var k = 1 - Math.exp(-dt * 7); z += (zt - z) * k; var dx = CX + z * SX, dy = curvaY(z), brillo = Math.abs(z) > 1.8 ? 1 : 0;
      if (brillo) { ctx.beginPath(); ctx.arc(dx, dy, 24, 0, 6.2832); ctx.fillStyle = "rgba(240,168,28,.35)"; ctx.fill(); }
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#e0a21d"; ctx.fillRect(-9, -9, 18, 18); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(-9, -9, 18, 18); ctx.restore();
      // observador y telescopio
      var ex = CX, ey = HY - 44; ctx.beginPath(); ctx.ellipse(ex, ey, 27, 36, 0, 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill();
      if (logo.complete && logo.naturalWidth) { var lh = 44, lw = lh * logo.naturalWidth / logo.naturalHeight; ctx.drawImage(logo, ex - lw / 2, ey - lh / 2, lw, lh); }
      var px = ex, py = ey - 30, want = Math.atan2(aimPt.y - py, aimPt.x - px), d = want - aim; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; aim += d * (1 - Math.exp(-dt * 6));
      var tipx = px + Math.cos(aim) * 56, tipy = py + Math.sin(aim) * 56;
      if (estado) { var bg = ctx.createLinearGradient(tipx, tipy, aimPt.x, aimPt.y); bg.addColorStop(0, "rgba(255,244,190,.34)"); bg.addColorStop(1, "rgba(255,244,190,0)"); ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(aimPt.x + Math.cos(aim + 1.57) * 12, aimPt.y + Math.sin(aim + 1.57) * 12); ctx.lineTo(aimPt.x - Math.cos(aim + 1.57) * 12, aimPt.y - Math.sin(aim + 1.57) * 12); ctx.closePath(); ctx.fillStyle = bg; ctx.fill(); }
      ctx.save(); ctx.translate(px, py); ctx.rotate(aim); ctx.fillStyle = "#e9f5f1"; ctx.strokeStyle = "#00513f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(-6, -5, 56, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.rect(46, -7.5, 10, 15); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fillStyle = "#00513f"; ctx.fill();
      // leyenda
      var msg = estado === 1 ? tx.t1 : estado === 2 ? tx.t2 : estado === 3 ? tx.t3 : estado === 4 ? tx.t4 : ""; ctx.textAlign = "left"; ctx.font = "600 25px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255," + (msg ? 0.96 : 0) + ")"; ctx.fillText(msg, 36, 48, BW - 72);
      if (quieta) { ctx.textAlign = "right"; ctx.font = "600 21px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(tx.rep, BW - 30, BH - 22); if (!fin) fin = ts; if (ts - fin > 900) { raf = 0; return; } } else fin = 0;
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && vis && size()) { if (!inicio) { inicio = true; t0 = performance.now(); } raf = requestAnimationFrame(frame); } }
    window.addEventListener("resize", function () { if (size()) { fin = 0; if (!raf && vis) raf = requestAnimationFrame(frame); } });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) { last = 0; if (fin) { t0 = performance.now(); z = 0; fin = 0; } start(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(cv);
    cv.addEventListener("click", function () { t0 = performance.now(); z = 0; fin = 0; last = 0; if (!raf) start(); });
    new MutationObserver(function () { if (cap) cap.textContent = TX[lang()].cap; }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("nav button")) setTimeout(function () { last = 0; fin = 0; if (!raf) start(); }, 80); });
    start();
  }
  function iniciar() { [].forEach.call(document.querySelectorAll(".ay-fig img[src*='boveda_curva'], .hero-fig img[src*='boveda_curva']"), Viva); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
