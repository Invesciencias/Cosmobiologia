/* agricultura.js — pestaña «Agricultura»: rueda lunar animada, calendario en cuadrícula, calculadora de parcelas,
   simulador del azar (¿cuántas veces «parece» funcionar sin efecto real?) y libreta de siembras exportable a CSV.
   Posiciones: series truncadas de Meeus (error ≈0,3°): suficiente para fase y signo; NO es la efeméride DE421 de la plataforma. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var R = Math.PI / 180;
  function norm(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function T(ms) { return (ms / 86400000 + 2440587.5 - 2451545) / 36525; }
  function lunaLon(t) {
    var Lp = 218.3164477 + 481267.88123421 * t, D = 297.8501921 + 445267.1114034 * t, M = 357.5291092 + 35999.0502909 * t, Mp = 134.9633964 + 477198.8675055 * t, F = 93.2720950 + 483202.0175233 * t;
    return norm(Lp + 6.288774 * Math.sin(Mp * R) + 1.274027 * Math.sin((2 * D - Mp) * R) + 0.658314 * Math.sin(2 * D * R) + 0.213618 * Math.sin(2 * Mp * R) - 0.185116 * Math.sin(M * R) - 0.114332 * Math.sin(2 * F * R) + 0.058793 * Math.sin((2 * D - 2 * Mp) * R) + 0.057066 * Math.sin((2 * D - M - Mp) * R) + 0.053322 * Math.sin((2 * D + Mp) * R) + 0.045758 * Math.sin((2 * D - M) * R));
  }
  function solLon(t) { var L0 = 280.46646 + 36000.76983 * t, M = 357.52911 + 35999.05029 * t; return norm(L0 + 1.914602 * Math.sin(M * R) + 0.019993 * Math.sin(2 * M * R)); }
  function ayanamsa(t) { return 24.04 + 1.3969 * t; }   // Fagan–Bradley aproximada (grados)
  var ELEM = ["fuego", "tierra", "aire", "agua", "fuego", "tierra", "aire", "agua", "fuego", "tierra", "aire", "agua"];
  var COL = { fuego: "#e8743b", tierra: "#8d6e63", aire: "#e0b92d", agua: "#3f8fc6" };
  var GLIFO = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map(function (g) { return g + "︎"; });
  var ICO = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

  var TX = {
    es: { fases: ["Luna nueva", "Creciente", "Cuarto creciente", "Gibosa creciente", "Luna llena", "Gibosa menguante", "Cuarto menguante", "Menguante"], signos: ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"], tipo: { fuego: "Fruto", tierra: "Raíz", aire: "Flor", agua: "Hoja" },
      meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], dsem: ["L", "M", "X", "J", "V", "S", "D"],
      luz: "luz", hoy: "Hoy", trop: "tropical", zod_t: "Ver zodiaco tropical", zod_s: "Ver zodiaco sidéreo", cap_t: "🟡 Sol · 🌙 Luna. Zodiaco tropical, el del horóscopo: aquí no se muestra el tipo de día, porque la tradición biodinámica usa el sidéreo. Sol en {t} tropical.", cap: "🟡 Sol · 🌙 Luna sobre el anillo. Zodiaco sidéreo (≈24° detrás del tropical). Sol en {s} sidéreo · {t} tropical.", en: "en", dia: "Día de", n: "Se necesitan unas {n} parcelas por grupo (con potencia 80 % y α = 0,05).", nb: "Con ese ruido, un efecto de {e} % es invisible a simple vista: por eso se necesita el piso de detección antes de mirar.",
      play: "▶ Ver el mes pasar", pausa: "⏸ Pausa", hoyb: "Hoy", rueda: "Rueda del zodiaco sidéreo con la Luna y el Sol",
      sim_h: "El simulador del azar: ¿cuántas veces «funciona» sin efecto real?", sim_p: "Aquí <b>no hay ningún efecto de la Luna</b>: todas las parcelas rinden igual en promedio, con el ruido que elijas. Se reparten al azar entre días «buenos» y «malos» y se mide la diferencia. Repite miles de veces y verás cuántas veces el azar solo hace que algo <i>parezca</i> funcionar.",
      sim_n: "Parcelas por grupo", sim_cv: "Ruido entre parcelas", sim_e: "Llamamos «parece que funciona» a una diferencia de al menos", sim_uno: "🌱 Sembrar una vez", sim_mil: "🎲 Repetir 1.000 veces",
      sim_r1: "Esta vez, los días «buenos» rindieron {d} % {m} que los «malos», sin que la Luna hiciera nada.", sim_mas: "más", sim_menos: "menos",
      sim_rm: "En {p} % de las 1.000 repeticiones la diferencia pareció ≥ {e} % <b>sin ningún efecto real</b>. Un solo experimento pequeño no demuestra nada: por eso hacen falta réplicas.", sim_eje: "diferencia aparente entre días «buenos» y «malos» (%)", sim_ejey: "repeticiones",
      lib_h: "Mi libreta de siembras", lib_p: "Anota cada siembra y la libreta calcula la Luna de ese momento. Se guarda solo en tu navegador. Cuando juntes unas decenas, <b>descárgala en CSV</b> y pruébala en el Laboratorio.",
      lib_f: "Fecha", lib_h2: "Hora local", lib_u: "Diferencia con UTC (h)", lib_c: "Cultivo", lib_r: "Rendimiento (opcional)", lib_la: "Latitud (opcional)", lib_lo: "Longitud (opcional)", lib_add: "➕ Anotar siembra", lib_csv: "⬇ Descargar CSV", lib_borrar: "Borrar todo", lib_vacio: "Aún no hay siembras. Anota la primera.", lib_conf: "¿Borrar todas las siembras de esta libreta?",
      lib_cab: ["Fecha UTC", "Cultivo", "Luna", "Signo", "Tipo", "Rend.", ""], lib_ej: "Cultivo, p. ej. rábano",
      reto_h: "Reto: el experimento del rábano (6 semanas)", reto_p: "Un curso, un colegio o una huerta pueden hacerlo. <b>1.</b> Prepara 40 macetas iguales (mismo suelo, riego y luz) y numéralas. <b>2.</b> Sortea 20 para sembrar en día «bueno» (luna creciente) y 20 en día «malo» (menguante), con fechas cercanas para que la estación sea la misma. <b>3.</b> Anota la fecha de siembra, los días hasta germinar y el peso a la cosecha. <b>4.</b> Descarga el CSV y súbelo. <b>5.</b> Si el resultado se repite en otra huerta, cuéntanoslo; si no se repite, <b>cuéntanoslo también</b>." },
    en: { fases: ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"], signos: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"], tipo: { fuego: "Fruit", tierra: "Root", aire: "Flower", agua: "Leaf" },
      meses: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dsem: ["M", "T", "W", "T", "F", "S", "S"],
      luz: "light", hoy: "Today", trop: "tropical", zod_t: "Show tropical zodiac", zod_s: "Show sidereal zodiac", cap_t: "🟡 Sun · 🌙 Moon. Tropical zodiac, the horoscope one: the day type is not shown here, because biodynamic tradition uses the sidereal one. Sun in {t} tropical.", cap: "🟡 Sun · 🌙 Moon on the ring. Sidereal zodiac (≈24° behind the tropical one). Sun in {s} sidereal · {t} tropical.", en: "in", dia: "Day of", n: "About {n} plots per group are needed (80 % power, α = 0.05).", nb: "With that noise, a {e} % effect is invisible to the naked eye: that is why the detection floor comes before looking.",
      play: "▶ Watch the month go by", pausa: "⏸ Pause", hoyb: "Today", rueda: "Sidereal zodiac wheel with the Moon and the Sun",
      sim_h: "The chance simulator: how often does it “work” with no real effect?", sim_p: "Here <b>there is no Moon effect at all</b>: every plot yields the same on average, with the noise you choose. They are split at random between “good” and “bad” days and the difference is measured. Repeat thousands of times and see how often chance alone makes something <i>look</i> like it works.",
      sim_n: "Plots per group", sim_cv: "Noise between plots", sim_e: "We call it “looks like it works” when the difference is at least", sim_uno: "🌱 Sow once", sim_mil: "🎲 Repeat 1,000 times",
      sim_r1: "This time, “good” days yielded {d} % {m} than “bad” days, with the Moon doing nothing.", sim_mas: "more", sim_menos: "less",
      sim_rm: "In {p} % of the 1,000 repetitions the difference looked ≥ {e} % <b>with no real effect</b>. One small experiment proves nothing: that is why replication is needed.", sim_eje: "apparent difference between “good” and “bad” days (%)", sim_ejey: "repetitions",
      lib_h: "My sowing notebook", lib_p: "Note each sowing and the notebook computes the Moon at that moment. It is stored only in your browser. When you have a few dozen, <b>download it as CSV</b> and test it in the Laboratory.",
      lib_f: "Date", lib_h2: "Local time", lib_u: "Offset from UTC (h)", lib_c: "Crop", lib_r: "Yield (optional)", lib_la: "Latitude (optional)", lib_lo: "Longitude (optional)", lib_add: "➕ Add sowing", lib_csv: "⬇ Download CSV", lib_borrar: "Delete all", lib_vacio: "No sowings yet. Add the first one.", lib_conf: "Delete all sowings in this notebook?",
      lib_cab: ["UTC date", "Crop", "Moon", "Sign", "Type", "Yield", ""], lib_ej: "Crop, e.g. radish",
      reto_h: "Challenge: the radish experiment (6 weeks)", reto_p: "A class, a school or a garden can do it. <b>1.</b> Prepare 40 identical pots (same soil, watering and light) and number them. <b>2.</b> Draw 20 at random to sow on a “good” day (waxing Moon) and 20 on a “bad” day (waning), with nearby dates so the season is the same. <b>3.</b> Note the sowing date, days to germination and weight at harvest. <b>4.</b> Download the CSV and upload it. <b>5.</b> If the result repeats in another garden, tell us; if it does not repeat, <b>tell us too</b>." },
    fr: { fases: ["Nouvelle Lune", "Croissant", "Premier quartier", "Gibbeuse croissante", "Pleine Lune", "Gibbeuse décroissante", "Dernier quartier", "Décroissant"], signos: ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"], tipo: { fuego: "Fruit", tierra: "Racine", aire: "Fleur", agua: "Feuille" },
      meses: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], dsem: ["L", "M", "M", "J", "V", "S", "D"],
      luz: "lumière", hoy: "Aujourd'hui", trop: "tropical", zod_t: "Voir le zodiaque tropical", zod_s: "Voir le zodiaque sidéral", cap_t: "🟡 Soleil · 🌙 Lune. Zodiaque tropical, celui de l'horoscope : le type de jour n'est pas affiché ici, car la tradition biodynamique utilise le sidéral. Soleil en {t} tropical.", cap: "🟡 Soleil · 🌙 Lune sur l'anneau. Zodiaque sidéral (≈24° derrière le tropical). Soleil en {s} sidéral · {t} tropical.", en: "en", dia: "Jour de", n: "Il faut environ {n} parcelles par groupe (puissance 80 %, α = 0,05).", nb: "Avec ce bruit, un effet de {e} % est invisible à l'œil nu : c'est pourquoi le seuil de détection vient avant de regarder.",
      play: "▶ Voir passer le mois", pausa: "⏸ Pause", hoyb: "Aujourd'hui", rueda: "Roue du zodiaque sidéral avec la Lune et le Soleil",
      sim_h: "Le simulateur du hasard : combien de fois « ça marche » sans effet réel ?", sim_p: "Ici <b>il n'y a aucun effet de la Lune</b> : toutes les parcelles rendent pareil en moyenne, avec le bruit choisi. Elles sont réparties au hasard entre jours « bons » et « mauvais » et l'on mesure la différence. Répétez des milliers de fois et voyez combien de fois le hasard seul fait <i>paraître</i> que ça marche.",
      sim_n: "Parcelles par groupe", sim_cv: "Bruit entre parcelles", sim_e: "On dit « ça semble marcher » quand la différence est d'au moins", sim_uno: "🌱 Semer une fois", sim_mil: "🎲 Répéter 1 000 fois",
      sim_r1: "Cette fois, les jours « bons » ont rendu {d} % {m} que les « mauvais », sans que la Lune fasse quoi que ce soit.", sim_mas: "de plus", sim_menos: "de moins",
      sim_rm: "Dans {p} % des 1 000 répétitions la différence a semblé ≥ {e} % <b>sans aucun effet réel</b>. Une seule petite expérience ne prouve rien : c'est pourquoi il faut des réplications.", sim_eje: "différence apparente entre jours « bons » et « mauvais » (%)", sim_ejey: "répétitions",
      lib_h: "Mon carnet de semis", lib_p: "Notez chaque semis et le carnet calcule la Lune à ce moment. Il reste seulement dans votre navigateur. Quand vous en avez quelques dizaines, <b>téléchargez-le en CSV</b> et testez-le dans le Laboratoire.",
      lib_f: "Date", lib_h2: "Heure locale", lib_u: "Décalage avec UTC (h)", lib_c: "Culture", lib_r: "Rendement (facultatif)", lib_la: "Latitude (facultatif)", lib_lo: "Longitude (facultatif)", lib_add: "➕ Noter un semis", lib_csv: "⬇ Télécharger le CSV", lib_borrar: "Tout effacer", lib_vacio: "Pas encore de semis. Notez le premier.", lib_conf: "Effacer tous les semis de ce carnet ?",
      lib_cab: ["Date UTC", "Culture", "Lune", "Signe", "Type", "Rend.", ""], lib_ej: "Culture, p. ex. radis",
      reto_h: "Défi : l'expérience du radis (6 semaines)", reto_p: "Une classe, une école ou un potager peuvent le faire. <b>1.</b> Préparez 40 pots identiques (même sol, arrosage et lumière) et numérotez-les. <b>2.</b> Tirez au sort 20 à semer un jour « bon » (lune croissante) et 20 un jour « mauvais » (décroissante), à des dates proches pour que la saison soit la même. <b>3.</b> Notez la date de semis, les jours jusqu'à la germination et le poids à la récolte. <b>4.</b> Téléchargez le CSV et envoyez-le. <b>5.</b> Si le résultat se répète dans un autre potager, dites-le-nous ; s'il ne se répète pas, <b>dites-le-nous aussi</b>." }
  };
  function L() { var l = document.documentElement.lang || "es"; return TX[l] || TX.es; }

  function dia(y, m, d, h) {
    var ms = Date.UTC(y, m, d, h === undefined ? 12 : h); return enMs(ms);
  }
  function enMs(ms) {
    var t = T(ms), ml = lunaLon(t), sl = solLon(t), fase = norm(ml - sl), luz = (1 - Math.cos(fase * R)) / 2, ay = ayanamsa(t);
    var f = Math.floor(((fase + 22.5) % 360) / 45), sgL = norm(ml - ay), sg = Math.floor(sgL / 30);
    return { f: f, luz: luz, sg: sg, el: ELEM[sg], lonL: sgL, lonS: norm(sl - ay), fase: fase, solT: Math.floor(sl / 30), lonLT: ml, lonST: sl, sgT: Math.floor(ml / 30) };
  }
  function pct(x) { return Math.round(x * 100); }

  /* ---------- calendario en cuadrícula ---------- */
  var sel = null, trop = false;
  function pintar() {
    var cont = $("ag_cal"); if (!cont) return; var t = L(), y = +$("ag_anio").value, m = +$("ag_mes").value, nd = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), h = new Date();
    var esHoy = h.getFullYear() === y && h.getMonth() === m ? h.getDate() : -1, primero = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, html = "";
    html += t.dsem.map(function (s) { return '<div class="agg-dh">' + s + "</div>"; }).join("");
    for (var i = 0; i < primero; i++) html += '<div class="agg-v"></div>';
    for (var d = 1; d <= nd; d++) {
      var r = dia(y, m, d);
      html += '<button type="button" class="agg-d ag-' + r.el + (d === esHoy ? " agg-hoy" : "") + (sel === d ? " agg-sel" : "") + '" data-d="' + d + '" aria-label="' + d + ": " + t.fases[r.f] + ", " + t.tipo[r.el] + '"><span class="agg-n">' + d + '</span><span class="agg-l">' + ICO[r.f] + '</span><span class="agg-t">' + t.tipo[r.el] + "</span></button>";
    }
    cont.innerHTML = html; detalle(y, m);
  }
  function detalle(y, m) {
    var cab = $("ag_det"); if (!cab) return; var t = L(); if (!sel) { cab.innerHTML = ""; return; } var r = dia(y, m, sel);
    cab.innerHTML = '<span class="ag-tipo2" style="background:' + COL[r.el] + '">' + t.tipo[r.el] + "</span> <b>" + sel + " " + t.meses[m] + "</b> — " + ICO[r.f] + " " + t.fases[r.f] + " (" + pct(r.luz) + " % " + t.luz + "), " + t.en + " " + GLIFO[r.sg] + " " + t.signos[r.sg];
  }
  function opciones() {
    var t = L(), ms = $("ag_mes"), ya = $("ag_anio"), mSel = ms.value === "" ? new Date().getMonth() : ms.value; ms.innerHTML = t.meses.map(function (n, i) { return '<option value="' + i + '">' + n + "</option>"; }).join(""); ms.value = mSel;
    if (!ya.options.length) { var y0 = new Date().getFullYear(); for (var y = y0 - 1; y <= y0 + 3; y++) ya.insertAdjacentHTML("beforeend", '<option value="' + y + '"' + (y === y0 ? " selected" : "") + ">" + y + "</option>"); }
  }

  /* ---------- calculadora de parcelas ---------- */
  function potencia() {
    var cv = +$("ag_cv").value, ef = +$("ag_ef").value, t = L(); $("ag_cv_v").textContent = cv + " %"; $("ag_ef_v").textContent = ef + " %";
    var n = Math.ceil(2 * Math.pow(1.96 + 0.8416, 2) * Math.pow(cv / ef, 2));
    $("ag_pot").innerHTML = "<b>" + t.n.replace("{n}", n) + "</b><br><span class=\"small muted\">" + t.nb.replace("{e}", ef) + "</span>";
  }

  /* ---------- rueda lunar animada ---------- */
  var cv, ctx, W = 0, H = 0, tms = Date.now(), playing = false, raf = 0, last = 0, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tamano() { var r = cv.getBoundingClientRect(); if (!r.width) return false; var d = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); return true; }
  function luna(x, y, r, fase) {
    // disco oscuro + medio disco iluminado + elipse del terminador (oscura en creciente fino, clara en gibosa)
    var k = Math.cos(fase * R), crece = fase < 180;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = "#26323a"; ctx.fill(); ctx.clip();
    ctx.beginPath(); if (crece) ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false); else ctx.arc(x, y, r, Math.PI / 2, 1.5 * Math.PI, false); ctx.closePath(); ctx.fillStyle = "#f4efd9"; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, Math.abs(k) * r), r, 0, 0, 6.2832); ctx.fillStyle = k > 0 ? "#26323a" : "#f4efd9"; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.2; ctx.stroke();
  }
  function dibujar() {
    if (!W) return; var r = enMs(tms), t = L(), lL = trop ? r.lonLT : r.lonL, lS = trop ? r.lonST : r.lonS, sgM = Math.floor(lL / 30), cx = W / 2, cy = H / 2, R0 = Math.min(W, H) / 2 - 6, R1 = R0 * 0.72, R2 = R0 * 0.5;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < 12; i++) {
      var a0 = (i * 30 - 90) * R, a1 = ((i + 1) * 30 - 90) * R, hot = i === sgM;
      ctx.beginPath(); ctx.arc(cx, cy, R0, a0, a1); ctx.arc(cx, cy, R1, a1, a0, true); ctx.closePath();
      ctx.globalAlpha = hot ? 1 : 0.55; ctx.fillStyle = COL[ELEM[i]]; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2; ctx.stroke();
      var am = (a0 + a1) / 2, gr = (R0 + R1) / 2; ctx.fillStyle = "#fff"; ctx.font = "700 " + Math.round(R0 * 0.11) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(GLIFO[i], cx + gr * Math.cos(am), cy + gr * Math.sin(am));
    }
    ctx.beginPath(); ctx.arc(cx, cy, R1 - 2, 0, 6.2832); ctx.fillStyle = "rgba(20,40,43,.92)"; ctx.fill();
    // Sol
    var as = (lS - 90) * R, sx = cx + (R1 - 14) * Math.cos(as), sy = cy + (R1 - 14) * Math.sin(as);
    var g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 18); g.addColorStop(0, "rgba(255,204,51,.55)"); g.addColorStop(1, "rgba(255,204,51,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 18, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 6.2832); ctx.fillStyle = "#ffcc33"; ctx.fill(); ctx.strokeStyle = "#fff6c9"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#7a4a00"; ctx.font = "700 11px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("☉", sx, sy + 0.5);
    // Luna orbitando sobre el anillo
    var al = (lL - 90) * R, lx = cx + (R1 + (R0 - R1) / 2) * Math.cos(al), ly = cy + (R1 + (R0 - R1) / 2) * Math.sin(al);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lx, ly); ctx.strokeStyle = "rgba(244,239,217,.35)"; ctx.lineWidth = 1; ctx.stroke();
    luna(lx, ly, Math.max(9, R0 * 0.09), r.fase);
    // centro: fase grande + texto
    luna(cx, cy - R2 * 0.18, R2 * 0.48, r.fase);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "700 " + Math.round(R0 * 0.085) + "px system-ui,sans-serif"; ctx.fillText(t.fases[r.f], cx, cy + R2 * 0.62);
    ctx.font = "600 " + Math.round(R0 * 0.07) + "px system-ui,sans-serif"; ctx.fillStyle = trop ? "#cfe3de" : COL[r.el]; ctx.fillText(trop ? t.signos[sgM] + " (" + t.trop + ")" : t.tipo[r.el] + " · " + t.signos[r.sg], cx, cy + R2 * 0.62 + R0 * 0.09);
    var cp = $("ag_cap"); if (cp) cp.textContent = (trop ? t.cap_t : t.cap).replace("{s}", t.signos[Math.floor(r.lonS / 30)]).replace("{t}", t.signos[r.solT]);
    var f = new Date(tms), e = $("ag_show_f"); if (e) e.textContent = f.toLocaleDateString(document.documentElement.lang || "es", { day: "numeric", month: "long", year: "numeric" });
  }
  function bucle(ts) { raf = 0; if (!playing) return; if (!last) last = ts; tms += (ts - last) / 1000 * 86400000 * 3; last = ts; dibujar(); raf = requestAnimationFrame(bucle); }
  function reproducir(on) { playing = on; last = 0; var b = $("ag_play"); if (b) b.textContent = on ? L().pausa : L().play; if (on && !raf) raf = requestAnimationFrame(bucle); }
  function montarShow() {
    var lead = document.querySelector("#agricultura > .tab-lead"); if (!lead || $("ag_show")) return;
    var d = document.createElement("div"); d.id = "ag_show"; d.className = "ag-show";
    d.innerHTML = '<div class="ag-show-txt"></div><div class="ag-show-rueda"><canvas id="ag_rueda" role="img"></canvas><div class="ag-show-ctl"><button type="button" class="act" id="ag_play"></button> <button type="button" class="ghost act" id="ag_hoyb"></button> <button type="button" class="ghost act" id="ag_zod"></button><span id="ag_show_f" class="small"></span></div><p id="ag_cap" class="small ag-cap"></p></div>';
    lead.insertAdjacentElement("afterend", d);
    var hero = document.querySelector("#agricultura .ag-hero"); if (hero) d.querySelector(".ag-show-txt").appendChild(hero);
    cv = $("ag_rueda"); ctx = cv.getContext("2d");
    $("ag_play").addEventListener("click", function () { reproducir(!playing); });
    $("ag_zod").addEventListener("click", function () { trop = !trop; textos(); dibujar(); });
    $("ag_hoyb").addEventListener("click", function () { tms = Date.now(); reproducir(false); dibujar(); });
    window.addEventListener("resize", function () { if (tamano()) dibujar(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting && tamano()) dibujar(); else reproducir(false); }).observe(cv);
    textos(); if (tamano()) dibujar();
  }
  function textos() { var t = L(), b = $("ag_play"); if (b) b.textContent = playing ? t.pausa : t.play; var h = $("ag_hoyb"); if (h) h.textContent = t.hoyb; var z = $("ag_zod"); if (z) z.textContent = trop ? t.zod_s : t.zod_t; if (cv) cv.setAttribute("aria-label", t.rueda); }

  /* ---------- simulador del azar ---------- */
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); }
  function unaVez(n, cv) { var a = 0, b = 0, i; for (i = 0; i < n; i++) { a += 100 * (1 + cv / 100 * gauss()); b += 100 * (1 + cv / 100 * gauss()); } return (a / n - b / n) / (b / n) * 100; }
  function simulador() {
    var t = L(), n = +$("sim_n").value, cvv = +$("sim_cv").value, e = +$("sim_e").value; $("sim_n_v").textContent = n; $("sim_cv_v").textContent = cvv + " %"; $("sim_e_v").textContent = e + " %";
    return { t: t, n: n, cv: cvv, e: e };
  }
  function simUno() { var s = simulador(), d = unaVez(s.n, s.cv); $("sim_res").innerHTML = s.t.sim_r1.replace("{d}", Math.abs(d).toFixed(1)).replace("{m}", d >= 0 ? s.t.sim_mas : s.t.sim_menos); }
  function simMil() {
    var s = simulador(), v = [], i, ok = 0; for (i = 0; i < 1000; i++) { var d = unaVez(s.n, s.cv); v.push(d); if (Math.abs(d) >= s.e) ok++; }
    $("sim_res").innerHTML = s.t.sim_rm.replace("{p}", (ok / 10).toFixed(1).replace(/\.0$/, "")).replace("{e}", s.e); histograma(v, s.e, s.t);
  }
  function histograma(v, e, t) {
    var c = $("sim_hist"), x = c.getContext("2d"), r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = r.width, h = 150; c.width = Math.round(w * d); c.height = Math.round(h * d); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    var lim = Math.max(e * 2, 10, Math.ceil(Math.max.apply(null, v.map(Math.abs)))), nb = 41, bins = new Array(nb).fill(0), pl = 8, pr = 8, pb = 30, pt = 8, bw = (w - pl - pr) / nb; v.forEach(function (z) { var k = Math.floor((z + lim) / (2 * lim) * nb); bins[Math.max(0, Math.min(nb - 1, k))]++; });
    var mx = Math.max.apply(null, bins) || 1;
    for (var i = 0; i < nb; i++) { var cen = -lim + (i + 0.5) * 2 * lim / nb, hh = bins[i] / mx * (h - pb - pt); x.fillStyle = Math.abs(cen) >= e ? "#e8743b" : "#9fc9bb"; x.fillRect(pl + i * bw + 1, h - pb - hh, bw - 2, hh); }
    var xe = function (val) { return pl + (val + lim) / (2 * lim) * (w - pl - pr); };
    x.strokeStyle = "rgba(20,40,43,.55)"; x.setLineDash([4, 3]); [-e, e].forEach(function (val) { x.beginPath(); x.moveTo(xe(val), pt); x.lineTo(xe(val), h - pb); x.stroke(); }); x.setLineDash([]);
    x.fillStyle = "#53696a"; x.font = "11px system-ui,sans-serif"; x.textAlign = "center"; [-lim, -e, 0, e, lim].forEach(function (val) { x.fillText((val > 0 ? "+" : "") + Math.round(val), xe(val), h - pb + 14); });
    x.fillText(t.sim_eje, w / 2, h - 4);
  }
  function montarSim(despues) {
    if ($("ag_sim")) return; var d = document.createElement("div"); d.className = "card"; d.id = "ag_sim"; var t = L();
    d.innerHTML = '<h2 id="sim_h"></h2><p class="small muted" id="sim_p"></p>' +
      '<div class="ag-ctl"><label class="small" for="sim_n" id="sim_nl"></label><input type="range" id="sim_n" min="5" max="100" step="1" value="20" style="flex:1;min-width:120px"><span id="sim_n_v" class="small"></span></div>' +
      '<div class="ag-ctl"><label class="small" for="sim_cv" id="sim_cvl"></label><input type="range" id="sim_cv" min="5" max="30" step="1" value="12" style="flex:1;min-width:120px"><span id="sim_cv_v" class="small"></span></div>' +
      '<div class="ag-ctl"><label class="small" for="sim_e" id="sim_el"></label><input type="range" id="sim_e" min="1" max="20" step="1" value="5" style="flex:1;min-width:120px"><span id="sim_e_v" class="small"></span></div>' +
      '<div class="ag-ctl"><button type="button" class="act" id="sim_b1"></button> <button type="button" class="act" id="sim_b2"></button></div><p id="sim_res" style="margin:8px 0"></p><canvas id="sim_hist" style="width:100%;height:150px" role="img"></canvas>';
    despues.insertAdjacentElement("afterend", d);
    $("sim_b1").addEventListener("click", simUno); $("sim_b2").addEventListener("click", simMil); ["sim_n", "sim_cv", "sim_e"].forEach(function (i) { $(i).addEventListener("input", simulador); });
    simUltimo = d; simulador();
  }
  var simUltimo = null;
  function textosSim() { var t = L(); if (!$("sim_h")) return; $("sim_h").textContent = t.sim_h; $("sim_p").innerHTML = t.sim_p; $("sim_nl").textContent = t.sim_n; $("sim_cvl").textContent = t.sim_cv; $("sim_el").textContent = t.sim_e; $("sim_b1").textContent = t.sim_uno; $("sim_b2").textContent = t.sim_mil; }

  /* ---------- libreta de siembras ---------- */
  var LS = "agricultura_libreta", libreta = [];
  function cargar() { try { libreta = JSON.parse(localStorage.getItem(LS) || "[]") || []; } catch (e) { libreta = []; } }
  function guardar() { try { localStorage.setItem(LS, JSON.stringify(libreta)); } catch (e) { /* sin almacenamiento */ } }
  function isoUTC(ms) { return new Date(ms).toISOString().replace(/\.\d+Z$/, "Z"); }
  function montarLibreta(despues) {
    if ($("ag_lib")) return; var d = document.createElement("div"); d.className = "card"; d.id = "ag_lib";
    d.innerHTML = '<h2 id="lib_h"></h2><p class="small muted" id="lib_p"></p><div class="ag-form">' +
      '<label><span id="lib_fl"></span><input type="date" id="lib_f"></label><label><span id="lib_h2l"></span><input type="time" id="lib_hh" value="08:00"></label><label><span id="lib_ul"></span><input type="number" id="lib_u" value="-5" min="-12" max="14" step="0.5"></label>' +
      '<label><span id="lib_cl"></span><input type="text" id="lib_c" maxlength="40"></label><label><span id="lib_rl"></span><input type="number" id="lib_r" step="any"></label><label><span id="lib_lal"></span><input type="number" id="lib_la" step="any" min="-90" max="90"></label><label><span id="lib_lol"></span><input type="number" id="lib_lo" step="any" min="-180" max="180"></label></div>' +
      '<div class="ag-ctl"><button type="button" class="act" id="lib_add"></button> <button type="button" class="ghost act" id="lib_csv"></button> <button type="button" class="ghost act" id="lib_del"></button></div><div class="ag-scroll"><table class="ag-tabla" id="lib_tab"></table></div>';
    despues.insertAdjacentElement("afterend", d);
    $("lib_f").value = new Date().toISOString().slice(0, 10);
    $("lib_add").addEventListener("click", function () {
      var f = $("lib_f").value, hh = $("lib_hh").value || "12:00", u = parseFloat($("lib_u").value) || 0, c = ($("lib_c").value || "").trim(); if (!f) return;
      var p = f.split("-").map(Number), hm = hh.split(":").map(Number), ms = Date.UTC(p[0], p[1] - 1, p[2], hm[0], hm[1]) - u * 3600000;
      var lat = $("lib_la").value, lon = $("lib_lo").value, rend = $("lib_r").value;
      libreta.push({ ms: ms, c: c || "—", r: rend === "" ? "" : +rend, la: lat === "" ? "" : +lat, lo: lon === "" ? "" : +lon }); guardar(); tablaLib(); $("lib_c").value = ""; $("lib_r").value = "";
    });
    $("lib_del").addEventListener("click", function () { if (libreta.length && confirm(L().lib_conf)) { libreta = []; guardar(); tablaLib(); } });
    $("lib_csv").addEventListener("click", function () {
      var rows = ["datetime_utc,latitude,longitude,domain,value,event_id"]; libreta.forEach(function (s, i) { rows.push([isoUTC(s.ms), s.la, s.lo, "agricultura", s.r, ("siembra_" + (i + 1) + "_" + s.c).replace(/[,"\n]/g, " ")].join(",")); });
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.join("\n") + "\n"], { type: "text/csv" })); a.download = "siembras_agricultura.csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
    libreta_ult = d; cargar(); tablaLib();
  }
  var libreta_ult = null;
  function tablaLib() {
    var tb = $("lib_tab"); if (!tb) return; var t = L(); if (!libreta.length) { tb.innerHTML = '<tbody><tr><td class="muted">' + t.lib_vacio + "</td></tr></tbody>"; return; }
    var html = "<thead><tr>" + t.lib_cab.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
    libreta.forEach(function (s, i) { var r = enMs(s.ms); html += '<tr class="ag-' + r.el + '"><td>' + isoUTC(s.ms).slice(0, 16).replace("T", " ") + "</td><td></td><td>" + ICO[r.f] + " " + t.fases[r.f] + "</td><td>" + GLIFO[r.sg] + " " + t.signos[r.sg] + '</td><td><span class="ag-tipo">' + t.tipo[r.el] + "</span></td><td>" + (s.r === "" ? "—" : s.r) + '</td><td><button type="button" class="ghost act" data-del="' + i + '" style="padding:1px 8px">✕</button></td></tr>'; });
    tb.innerHTML = html + "</tbody>";
    [].forEach.call(tb.querySelectorAll("tbody tr"), function (tr, i) { if (tr.children[1]) tr.children[1].textContent = libreta[i].c; });
    [].forEach.call(tb.querySelectorAll("[data-del]"), function (b) { b.addEventListener("click", function () { libreta.splice(+b.getAttribute("data-del"), 1); guardar(); tablaLib(); }); });
  }
  function textosLib() {
    var t = L(); if (!$("lib_h")) return; $("lib_h").textContent = t.lib_h; $("lib_p").innerHTML = t.lib_p; $("lib_fl").textContent = t.lib_f; $("lib_h2l").textContent = t.lib_h2; $("lib_ul").textContent = t.lib_u; $("lib_cl").textContent = t.lib_c; $("lib_c").placeholder = t.lib_ej; $("lib_rl").textContent = t.lib_r; $("lib_lal").textContent = t.lib_la; $("lib_lol").textContent = t.lib_lo; $("lib_add").textContent = t.lib_add; $("lib_csv").textContent = t.lib_csv; $("lib_del").textContent = t.lib_borrar; tablaLib();
  }
  function montarReto(despues) {
    if ($("ag_reto")) return; var d = document.createElement("div"); d.className = "card ag-reto"; d.id = "ag_reto"; d.innerHTML = '<h2 id="reto_h"></h2><p id="reto_p"></p>'; despues.insertAdjacentElement("afterend", d);
  }
  function textosReto() { var t = L(); if ($("reto_h")) { $("reto_h").textContent = t.reto_h; $("reto_p").innerHTML = t.reto_p; } }

  function todosTextos() { opciones(); pintar(); potencia(); textos(); textosSim(); textosLib(); textosReto(); if (W) dibujar(); }
  function iniciar() {
    if (!$("ag_cal")) return; var h = new Date(); $("ag_anio").innerHTML = ""; opciones(); $("ag_mes").value = h.getMonth();
    var cont = $("ag_cal").parentNode; cont.className = "ag-grid-wrap"; cont.innerHTML = '<div id="ag_cal" class="ag-grid"></div>'; cont.insertAdjacentHTML("afterend", '<p id="ag_det" class="ag-det" aria-live="polite"></p>');
    $("ag_cal").addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-d]"); if (!b) return; sel = +b.getAttribute("data-d"); pintar(); });
    ["ag_mes", "ag_anio"].forEach(function (i) { $(i).addEventListener("change", function () { sel = null; pintar(); }); });
    ["ag_cv", "ag_ef"].forEach(function (i) { $(i).addEventListener("input", potencia); });
    var potCard = $("ag_pot").closest(".card"); montarShow(); montarSim(potCard); montarLibreta($("ag_sim")); montarReto($("ag_lib"));
    sel = h.getDate(); todosTextos();
    new MutationObserver(todosTextos).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.querySelectorAll('nav button[data-tab="agricultura"]').forEach(function (b) { b.addEventListener("click", function () { setTimeout(function () { if (tamano()) dibujar(); }, 60); }); });
  }
  window.agriculturaDia = dia;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
