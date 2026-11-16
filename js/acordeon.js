/* acordeon.js — convierte las tarjetas largas de «Empieza aquí» y «Principios y Métodos» en secciones plegables con un resumen de una línea.
   El contenido no se copia ni se reescribe: se mueve a un contenedor, así que los gráficos, los deslizadores y los ids siguen funcionando.
   Al abrir una sección se vuelven a dibujar los gráficos (dibujados con la sección cerrada salen sin tamaño). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var TX = {
    es: { abrir: "Abrir todas las secciones", cerrar: "Cerrar todas", pista: "Toca un título para abrirlo" },
    en: { abrir: "Open all sections", cerrar: "Close all", pista: "Tap a title to open it" },
    fr: { abrir: "Ouvrir toutes les sections", cerrar: "Tout fermer", pista: "Touchez un titre pour l'ouvrir" }
  };
  /* resúmenes escritos a mano de las tarjetas más largas (clave: id de la tarjeta o data-i18n de su título) */
  var RES = {
    paper1_h2: { es: "El caso Mercurio–Urano parecía el primer resultado positivo (z = +5,2), pero no sobrevive: la señal venía de las réplicas. Los cinco candidatos GCMT quedan en suspenso.", en: "The Mercury–Uranus case looked like the first positive result (z = +5.2), but it does not survive: the signal came from aftershocks. The five GCMT candidates are on hold.", fr: "Le cas Mercure–Uranus semblait le premier résultat positif (z = +5,2), mais il ne survit pas : le signal venait des répliques. Les cinq candidats GCMT sont en suspens." },
    faq_h2: { es: "Qué es un modelo nulo, por qué se prueban tantas configuraciones, si los datos astronómicos son automáticos y si esto es astrología.", en: "What a null model is, why so many configurations are tested, whether the astronomical data are automatic and whether this is astrology.", fr: "Ce qu'est un modèle nul, pourquoi tant de configurations sont testées, si les données astronomiques sont automatiques et si c'est de l'astrologie." },
    ciencia_h2: { es: "Cualquier campo que registre cuándo y dónde ocurrió algo puede usar el método: sismos, huracanes, salud, ajedrez…", en: "Any field that records when and where something happened can use the method: earthquakes, hurricanes, health, chess…", fr: "Tout domaine qui enregistre quand et où quelque chose s'est produit peut utiliser la méthode : séismes, ouragans, santé, échecs…" },
    met_marco: { es: "Qué hace y qué no hace la plataforma: usa posiciones astronómicas exactas para poner a prueba hipótesis; no predice ni interpreta a nadie.", en: "What the platform does and does not do: it uses exact astronomical positions to test hypotheses; it does not predict or interpret anyone.", fr: "Ce que la plateforme fait et ne fait pas : elle utilise des positions astronomiques exactes pour tester des hypothèses ; elle ne prédit ni n'interprète personne." },
    met_principios: { es: "Los siete principios de la TCC; el resto de la pestaña son los procedimientos para ponerlos a prueba.", en: "The seven principles of the TCC; the rest of the tab are the procedures to put them to the test.", fr: "Les sept principes de la TCC ; le reste de l'onglet présente les procédures pour les mettre à l'épreuve." },
    met_duplas: { es: "Calculadora: cuántos eventos tienen dos o tres rasgos a la vez, frente a lo que daría el azar.", en: "Calculator: how many events have two or three features at once, compared with what chance would give.", fr: "Calculateur : combien d'événements ont deux ou trois traits à la fois, face à ce que donnerait le hasard." },
    met_potencia: { es: "La curva de potencia: qué tamaño de efecto puede ver cada diseño, y por qué un resultado nulo no siempre refuta algo.", en: "The power curve: what effect size each design can see, and why a null result does not always refute something.", fr: "La courbe de puissance : quelle taille d'effet chaque dispositif peut voir, et pourquoi un résultat nul ne réfute pas toujours quelque chose." },
    met_llona: { es: "La curva (cicloide) que traza un punto de la corteza al combinar la rotación y la traslación de la Tierra.", en: "The curve (cycloid) traced by a point of the crust combining the Earth's rotation and revolution.", fr: "La courbe (cycloïde) tracée par un point de l'écorce en combinant la rotation et la révolution de la Terre." },
    publicacion_rac: { es: "El diseño de investigación se publicó en la Circular Astronómica RAC 1027 (septiembre de 2026).", en: "The research design was published in the Circular Astronómica RAC 1027 (September 2026).", fr: "Le plan de recherche a été publié dans la Circular Astronómica RAC 1027 (septembre 2026)." },
    niveles_evidencia: { es: "No todo tiene el mismo respaldo: Nivel I (física establecida), Nivel II (asociación reproducible) y Nivel III (hipótesis por probar).", en: "Not everything has the same backing: Level I (established physics), Level II (reproducible association) and Level III (hypotheses to be tested).", fr: "Tout n'a pas le même appui : Niveau I (physique établie), Niveau II (association reproductible) et Niveau III (hypothèses à tester)." }
  };
  var ABIERTAS = { como_h2: 1 };            // «¿Cómo funciona el método?» arranca abierta
  var OBJETIVOS = { guia: { desde: 3, hasta: 9 }, ayuda: { desde: 2, hasta: 999 } };   // posición entre las tarjetas de la sección
  var REDIBUJAR = ["renderDensidadHallazgo", "llonaSimular", "precesionSimular", "actualizarEraPrecesional", "potenciaGrafico"];

  function lang() { var l = document.documentElement.lang || "es"; return TX[l] ? l : "es"; }
  function recortar(t, n) { t = t.replace(/\s+/g, " ").trim(); if (t.length <= n) return t; var c = t.slice(0, n); c = c.slice(0, Math.max(c.lastIndexOf(" "), 60)); return c.replace(/[,.;:\s]+$/, "") + "…"; }
  function claveDe(det) { var h = det.querySelector("summary h2"); return det.id || (h && h.getAttribute("data-i18n")) || (h && h.getAttribute("data-i18n-html")) || ""; }
  function teaser(det) {
    var k = claveDe(det), l = lang();
    if (RES[k]) return RES[k][l] || RES[k].es;
    var ps = det.querySelectorAll(".ac-cuerpo p, .ac-cuerpo li"); for (var i = 0; i < ps.length; i++) { var t = ps[i].textContent.replace(/\s+/g, " ").trim(); if (t.length >= 45) return recortar(t, 170); }
    return "";
  }
  function pintarTeasers() { document.querySelectorAll("details.acordeon").forEach(function (d) { var s = d.querySelector("summary .ac-teaser"); if (s) s.textContent = teaser(d); }); }

  function convertir(card) {
    var h2 = card.querySelector(":scope > h2"); if (!h2 || card.tagName === "DETAILS") return null;
    var det = document.createElement("details"); det.className = card.className + " acordeon"; if (card.id) det.id = card.id; if (card.getAttribute("style")) det.setAttribute("style", card.getAttribute("style"));
    var sum = document.createElement("summary"), tz = document.createElement("span"); tz.className = "ac-teaser"; sum.appendChild(h2); sum.appendChild(tz);
    var cuerpo = document.createElement("div"); cuerpo.className = "ac-cuerpo"; while (card.firstChild) cuerpo.appendChild(card.firstChild);
    det.appendChild(sum); det.appendChild(cuerpo); card.parentNode.replaceChild(det, card);
    if (ABIERTAS[h2.getAttribute("data-i18n")]) det.open = true;
    return det;
  }
  function controles(sec) {
    if (sec.querySelector(":scope > .ac-ctl")) return; var t = TX[lang()], d = document.createElement("div"); d.className = "ac-ctl";
    d.innerHTML = '<button type="button" class="ghost act" data-ac="abrir"></button> <button type="button" class="ghost act" data-ac="cerrar"></button> <span class="small muted ac-pista"></span>';
    var primero = sec.querySelector(":scope > details.acordeon"); if (primero) sec.insertBefore(d, primero);
  }
  function textoControles() { var t = TX[lang()]; document.querySelectorAll(".ac-ctl").forEach(function (d) { d.querySelector('[data-ac=abrir]').textContent = "▾ " + t.abrir; d.querySelector('[data-ac=cerrar]').textContent = "▴ " + t.cerrar; d.querySelector(".ac-pista").textContent = t.pista; }); }

  function iniciar() {
    Object.keys(OBJETIVOS).forEach(function (id) {
      var sec = $(id); if (!sec) return; var o = OBJETIVOS[id];
      var tarjetas = [].filter.call(sec.children, function (c) { return c.classList && c.classList.contains("card"); });
      tarjetas.forEach(function (c, i) { if (i >= o.desde && i <= o.hasta && c.id !== "registro_card" && c.id !== "guiaDatos" && c.querySelector(":scope > h2")) convertir(c); });
      controles(sec);
    });
    pintarTeasers(); textoControles();
    new MutationObserver(function () { pintarTeasers(); textoControles(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  /* abrir las secciones que contienen un elemento (para enlaces, índice y buscador) */
  window.abrirDetalles = function (el) { for (var p = el; p; p = p.parentElement) if (p.tagName === "DETAILS" && !p.open) p.open = true; };
  function redibujar(det) {
    setTimeout(function () {
      REDIBUJAR.forEach(function (f) { try { if (typeof window[f] === "function" && det.closest("#ayuda")) window[f](); } catch (e) { /* un gráfico que falla no debe afectar al resto */ } });
      try { det.querySelectorAll(".js-plotly-plot").forEach(function (g) { if (window.Plotly) window.Plotly.Plots.resize(g); }); } catch (e) {}
      window.dispatchEvent(new Event("resize"));
    }, 60);
  }
  document.addEventListener("toggle", function (e) { var d = e.target; if (d && d.classList && d.classList.contains("acordeon") && d.open) redibujar(d); }, true);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ac]"); if (!b) return; var sec = b.closest("section"), abrir = b.getAttribute("data-ac") === "abrir";
    sec.querySelectorAll(":scope > details.acordeon").forEach(function (d) { d.open = abrir; });
  });
  /* irA(tab, id): abre la sección que contiene el destino */
  var _irA = null;
  function envolverIrA() { if (_irA || typeof window.irA !== "function") return; _irA = window.irA; window.irA = function (tab, id) { _irA(tab, id); setTimeout(function () { var el = $(id); if (el) { window.abrirDetalles(el); el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 120); }; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { iniciar(); envolverIrA(); }); else { iniciar(); envolverIrA(); }
})();
