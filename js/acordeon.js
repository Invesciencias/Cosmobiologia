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
  var TEXTO_LARGO = { captura: { formularios: true, abierta: /Registrar/i }, fuentes: {}, hipotesis: {}, epidemiologia: {}, historia_social: {}, sismos: {}, eras_precesionales: {} };
  var REDIBUJAR =["renderDensidadHallazgo", "llonaSimular", "precesionSimular", "actualizarEraPrecesional", "potenciaGrafico"];

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
    var primero = sec.querySelector(":scope > .ac-grupo, :scope > details.acordeon"); if (primero) sec.insertBefore(d, primero);
  }
  function textoControles() { var t = TX[lang()]; document.querySelectorAll(".ac-ctl").forEach(function (d) { d.querySelector('[data-ac=abrir]').textContent = "▾ " + t.abrir; d.querySelector('[data-ac=cerrar]').textContent = "▴ " + t.cerrar; d.querySelector(".ac-pista").textContent = t.pista; }); }


  /* ---------- grupos de «Principios y Métodos» ---------- */
  var GRUPOS = [
    { id: "marco", color: "var(--accent2)", ico: "🔭", orden: ["met_marco", "met_casas_h2", "met_precesion", "met_cineticos", "met_params_h2", "met_codigos", "met_notacion", "met_glosario"],
      es: ["Marco científico (astronomía)", "Qué calculamos y con qué: posiciones, casas, precesión, notación y glosario."], en: ["Scientific framework (astronomy)", "What we compute and with what: positions, houses, precession, notation and glossary."], fr: ["Cadre scientifique (astronomie)", "Ce que nous calculons et avec quoi : positions, maisons, précession, notation et glossaire."] },
    { id: "principios", color: "#8e44ad", ico: "★", orden: ["met_principios", "met_tcc_expertos", "met_diversificada", "met_llona", "met_gauquelin", "ref_ferriz"],
      es: ["Principios de la Cosmobiología", "Qué dice la TCC y cómo se lee: los principios, la geodinámica de Llona, Gauquelin y las referencias."], en: ["Principles of Cosmobiology", "What the TCC says and how to read it: the principles, Llona's geodynamics, Gauquelin and the references."], fr: ["Principes de la Cosmobiologie", "Ce que dit la TCC et comment la lire : les principes, la géodynamique de Llona, Gauquelin et les références."] },
    { id: "estadistica", color: "var(--verde)", ico: "📐", orden: ["met_nulo", "met_fdr", "met_split", "met_estrat", "met_artefactos", "met_potencia", "met_lmm", "met_flujo"],
      es: ["Estadística (matemática)", "Cómo se pone a prueba una idea: modelo nulo, comparaciones múltiples, validación, artefactos, potencia y flujo de trabajo."], en: ["Statistics (mathematics)", "How an idea is put to the test: null model, multiple comparisons, validation, artefacts, power and workflow."], fr: ["Statistiques (mathématiques)", "Comment une idée est mise à l'épreuve : modèle nul, comparaisons multiples, validation, artefacts, puissance et flux de travail."] },
    { id: "herramientas", color: "var(--oro)", ico: "🧮", orden: ["__antes_de_calcular", "met_duplas"],
      es: ["Herramientas interactivas", "Calculadoras reales, no solo lectura."], en: ["Interactive tools", "Real calculators, not just reading."], fr: ["Outils interactifs", "De vrais calculateurs, pas seulement de la lecture."] }
  ];
  var NSEC = { es: "secciones", en: "sections", fr: "sections" };
  function claveGrupo(d) {
    var h = d.querySelector("summary h2"); if (d.id) return d.id;
    if (d.querySelector(".ac-cuerpo img[src*='dupletas_tripletas']")) return "__antes_de_calcular";
    return (h && (h.id || h.getAttribute("data-i18n") || h.getAttribute("data-i18n-html"))) || "";
  }
  function ultimoGrupo(sec) { var g = sec.querySelectorAll(":scope > .ac-grupo"); return g.length ? g[g.length - 1] : null; }
  function agrupar(sec) {
    if (sec.querySelector(":scope > .ac-grupo")) return; var det = {}, quedan = [];
    [].forEach.call(sec.querySelectorAll(":scope > details.acordeon"), function (d) { var k = claveGrupo(d); if (k && !det[k]) det[k] = d; else quedan.push(d); });
    var ref = sec.querySelector(":scope > details.acordeon"); if (!ref) return;
    var marcador = document.createComment("grupos"); ref.parentNode.insertBefore(marcador, ref);
    GRUPOS.forEach(function (g) {
      var caja = document.createElement("div"); caja.className = "ac-grupo"; caja.id = "grupo_" + g.id; caja.style.setProperty("--gc", g.color);
      caja.innerHTML = '<div class="ac-grupo-cab"><span class="ac-grupo-ico" aria-hidden="true">' + g.ico + '</span><div class="ac-grupo-txt"><h2 class="ac-grupo-t"></h2><p class="ac-grupo-d"></p></div><span class="ac-grupo-n"></span><span class="ac-grupo-flecha" aria-hidden="true">▾</span></div>';
      marcador.parentNode.insertBefore(caja, marcador); var n = 0; var cab = caja.firstChild; cab.setAttribute("role", "button"); cab.setAttribute("tabindex", "0"); cab.setAttribute("aria-expanded", "false"); caja.classList.add("plegado");
      g.orden.forEach(function (k) { if (det[k]) { caja.appendChild(det[k]); delete det[k]; n++; } }); caja.setAttribute("data-n", n);
    });
    marcador.remove();
    Object.keys(det).forEach(function (k) { var u = ultimoGrupo(sec); if (u) u.appendChild(det[k]); });
    quedan.forEach(function (d) { var u = ultimoGrupo(sec); if (u) u.appendChild(d); });
    /* las tarjetas del índice llevan a su grupo */
    [["met_marco", "marco"], ["met_principios", "principios"], ["met_nulo", "estadistica"], ["met_duplas", "herramientas"]].forEach(function (par) { sec.querySelectorAll('.navquick-card[onclick*="' + par[0] + '"]').forEach(function (c) { c.setAttribute("onclick", "var g=document.getElementById('grupo_" + par[1] + "');g.classList.remove('plegado');g.firstChild.setAttribute('aria-expanded','true');g.scrollIntoView({behavior:'smooth',block:'start'})"); }); });
  }
  function pintarGrupos() {
    var l = lang();
    GRUPOS.forEach(function (g) {
      var caja = $("grupo_" + g.id); if (!caja) return; var t = g[l] || g.es;
      caja.querySelector(".ac-grupo-t").textContent = t[0]; caja.querySelector(".ac-grupo-d").textContent = t[1]; caja.querySelector(".ac-grupo-n").textContent = caja.getAttribute("data-n") + " " + NSEC[l];
    });
  }
  function plegarGrupo(cab, cerrar) { var caja = cab.parentNode; var c = cerrar === undefined ? !caja.classList.contains("plegado") : cerrar; caja.classList.toggle("plegado", c); cab.setAttribute("aria-expanded", c ? "false" : "true"); }
  document.addEventListener("click", function (e) { var cab = e.target.closest && e.target.closest(".ac-grupo-cab"); if (cab) plegarGrupo(cab); });
  document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("ac-grupo-cab")) { e.preventDefault(); plegarGrupo(e.target); } });
  /* enlaces internos (#id) que apuntan dentro de una sección plegada: se abre antes de saltar */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.hasAttribute("data-camino") || a.hasAttribute("data-toc")) return;
    var id = a.getAttribute("href").slice(1); if (!id) return; var el = $(id); if (!el) return; var cerrado = false; for (var p = el.parentElement; p; p = p.parentElement) if (p.tagName === "DETAILS" && !p.open) cerrado = true;
    for (var q = el.parentElement; q; q = q.parentElement) if (q.classList && q.classList.contains("plegado")) cerrado = true;
    if (cerrado) { window.abrirDetalles(el); setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }
  });

  function iniciar() {
    Object.keys(OBJETIVOS).forEach(function (id) {
      var sec = $(id); if (!sec) return; var o = OBJETIVOS[id];
      var tarjetas = [].filter.call(sec.children, function (c) { return c.classList && c.classList.contains("card"); });
      tarjetas.forEach(function (c, i) { if (i >= o.desde && i <= o.hasta && c.id !== "registro_card" && c.id !== "guiaDatos" && c.querySelector(":scope > h2")) convertir(c); });
      if (id === "ayuda") agrupar(sec);
      controles(sec);
    });
    /* otras pestañas con texto largo: se pliegan las tarjetas de lectura; las que tienen gráficos o tablas se dejan abiertas */
    Object.keys(TEXTO_LARGO).forEach(function (id) {
      var sec = $(id); if (!sec) return; var f = TEXTO_LARGO[id], n = 0;
      [].filter.call(sec.children, function (c) { return c.classList && c.classList.contains("card") && c.tagName !== "DETAILS"; }).forEach(function (c) {
        var guia = c.id === "guiaDatos" || c.querySelector("#guiaDatos");
        if (!c.querySelector(":scope > h2") || c.textContent.length < 500 || (!guia && c.querySelector("canvas,svg,table,.js-plotly-plot,[id^=plot],[id$=plot]"))) return;
        if (!f.formularios && c.querySelector("input,select,textarea")) return;
        var d = convertir(c); if (d && f.abierta && f.abierta.test(d.querySelector("summary h2").textContent)) d.open = true; if (d) n++;
      });
      if (n > 1) controles(sec);
    });
    pintarTeasers(); textoControles(); pintarGrupos();
    new MutationObserver(function () { pintarTeasers(); textoControles(); pintarGrupos(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  /* abrir las secciones que contienen un elemento (para enlaces, índice y buscador) */
  window.abrirDetalles = function (el) { for (var p = el; p; p = p.parentElement) { if (p.tagName === "DETAILS" && !p.open) p.open = true; if (p.classList && p.classList.contains("plegado")) plegarGrupo(p.firstChild, false); } };
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
    sec.querySelectorAll("details.acordeon").forEach(function (d) { d.open = abrir; }); if (abrir) sec.querySelectorAll(".ac-grupo.plegado > .ac-grupo-cab").forEach(function (c) { plegarGrupo(c, false); });
  });
  /* irA(tab, id): abre la sección que contiene el destino */
  var _irA = null;
  function envolverIrA() { if (_irA || typeof window.irA !== "function") return; _irA = window.irA; window.irA = function (tab, id) { _irA(tab, id); setTimeout(function () { var el = $(id); if (el) { window.abrirDetalles(el); el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 120); }; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { iniciar(); envolverIrA(); }); else { iniciar(); envolverIrA(); }
})();
