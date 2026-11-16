/* agricultura.js — calendario lunar (fase y signo sidéreo) y calculadora de parcelas para la pestaña «Agricultura».
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
  var TX = {
    es: { fases: ["Luna nueva", "Creciente", "Cuarto creciente", "Gibosa creciente", "Luna llena", "Gibosa menguante", "Cuarto menguante", "Menguante"], signos: ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"], tipo: { fuego: "Fruto", tierra: "Raíz", aire: "Flor", agua: "Hoja" }, cab: ["Día", "Fase", "Luz", "Luna en (sidéreo)", "Día según la tradición"], meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], hoy: "hoy", n: "Se necesitan unas {n} parcelas por grupo (con potencia 80 % y α = 0,05).", nb: "Con ese ruido, un efecto de {e} % es invisible a simple vista: por eso se necesita el piso de detección antes de mirar." },
    en: { fases: ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"], signos: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"], tipo: { fuego: "Fruit", tierra: "Root", aire: "Flower", agua: "Leaf" }, cab: ["Day", "Phase", "Light", "Moon in (sidereal)", "Day by tradition"], meses: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], hoy: "today", n: "About {n} plots per group are needed (80 % power, α = 0.05).", nb: "With that noise, a {e} % effect is invisible to the naked eye: that is why the detection floor comes before looking." },
    fr: { fases: ["Nouvelle Lune", "Croissant", "Premier quartier", "Gibbeuse croissante", "Pleine Lune", "Gibbeuse décroissante", "Dernier quartier", "Décroissant"], signos: ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"], tipo: { fuego: "Fruit", tierra: "Racine", aire: "Fleur", agua: "Feuille" }, cab: ["Jour", "Phase", "Lumière", "Lune en (sidéral)", "Jour selon la tradition"], meses: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], hoy: "aujourd'hui", n: "Il faut environ {n} parcelles par groupe (puissance 80 %, α = 0,05).", nb: "Avec ce bruit, un effet de {e} % est invisible à l'œil nu : c'est pourquoi le seuil de détection vient avant de regarder." }
  };
  var ELEM = ["fuego", "tierra", "aire", "agua", "fuego", "tierra", "aire", "agua", "fuego", "tierra", "aire", "agua"];
  var ICO = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  function L() { var l = document.documentElement.lang || "es"; return TX[l] || TX.es; }
  function dia(y, m, d) {
    var ms = Date.UTC(y, m, d, 12), t = T(ms), ml = lunaLon(t), sl = solLon(t), fase = norm(ml - sl), luz = (1 - Math.cos(fase * R)) / 2;
    var f = Math.floor(((fase + 22.5) % 360) / 45), sg = Math.floor(norm(ml - ayanamsa(t)) / 30);
    return { f: f, luz: luz, sg: sg, el: ELEM[sg] };
  }
  function pintar() {
    var cuerpo = $("ag_cal"); if (!cuerpo) return; var t = L(), y = +$("ag_anio").value, m = +$("ag_mes").value, nd = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), h = new Date(), esHoy = h.getFullYear() === y && h.getMonth() === m ? h.getDate() : -1;
    var html = "<thead><tr>" + t.cab.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
    for (var d = 1; d <= nd; d++) { var r = dia(y, m, d); html += '<tr class="ag-' + r.el + (d === esHoy ? " ag-hoy" : "") + '"><td>' + d + (d === esHoy ? " <small>(" + t.hoy + ")</small>" : "") + "</td><td>" + ICO[r.f] + " " + t.fases[r.f] + "</td><td>" + Math.round(r.luz * 100) + " %</td><td>" + t.signos[r.sg] + '</td><td><span class="ag-tipo">' + t.tipo[r.el] + "</span></td></tr>"; }
    cuerpo.innerHTML = html + "</tbody>";
  }
  function opciones() {
    var t = L(), ms = $("ag_mes"), ya = $("ag_anio"), mSel = ms.value || new Date().getMonth(); ms.innerHTML = t.meses.map(function (n, i) { return '<option value="' + i + '">' + n + "</option>"; }).join(""); ms.value = mSel;
    if (!ya.options.length) { var y0 = new Date().getFullYear(); for (var y = y0 - 1; y <= y0 + 3; y++) ya.insertAdjacentHTML("beforeend", '<option value="' + y + '"' + (y === y0 ? " selected" : "") + ">" + y + "</option>"); }
  }
  function potencia() {
    var cv = +$("ag_cv").value, ef = +$("ag_ef").value, t = L(); $("ag_cv_v").textContent = cv + " %"; $("ag_ef_v").textContent = ef + " %";
    var n = Math.ceil(2 * Math.pow(1.96 + 0.8416, 2) * Math.pow(cv / ef, 2));
    $("ag_pot").innerHTML = "<b>" + t.n.replace("{n}", n) + "</b><br><span class=\"small muted\">" + t.nb.replace("{e}", ef) + "</span>";
  }
  function iniciar() {
    if (!$("ag_cal")) return; var h = new Date(); $("ag_anio").innerHTML = ""; $("ag_mes").value = h.getMonth(); opciones(); $("ag_mes").value = h.getMonth();
    ["ag_mes", "ag_anio"].forEach(function (i) { $(i).addEventListener("change", pintar); });
    ["ag_cv", "ag_ef"].forEach(function (i) { $(i).addEventListener("input", potencia); });
    pintar(); potencia();
    new MutationObserver(function () { opciones(); pintar(); potencia(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  window.agriculturaDia = dia;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
