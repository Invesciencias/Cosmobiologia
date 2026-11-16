/* navegacion.js — ayudas de navegación del explorador:
   1) selector de idioma ES / EN / FR (sin ciclar);
   2) camino sugerido de cinco pasos con «Siguiente»;
   3) botón «Copiar enlace» en cada pestaña;
   4) guardar como imagen las figuras dibujadas en SVG;
   5) recorrido guiado de seis paradas (también con explorador.html#recorrido). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    es: { camino: "Camino sugerido", paso: "Paso", de: "de", sig: "Siguiente", lab: "Laboratorio", copiar: "Copiar enlace", copiado: "Enlace copiado", guardar: "Guardar imagen", idioma: "Idioma",
      pasos: ["Principios y métodos", "Cielo y eventos", "Tablero", "Tu hipótesis", "Laboratorio"],
      tour: "Recorrido guiado", tourMin: "Recorrido guiado (3 min)", parada: "Parada", prev: "Anterior", next: "Siguiente", cerrar: "Cerrar", fin: "Terminar",
      steps: [
        { t: "La pregunta", d: "¿Cuándo puedo creer que un patrón entre los eventos de la Tierra y el cielo es real? Casi todo lo que se ve en una rueda de cartas es azar. En seis paradas vas a aprender a distinguirlo.", a: "" },
        { t: "Mira el cielo de miles de eventos", d: "Dibujamos una carta por cada terremoto de magnitud 6 o más entre 2000 y 2024, sin réplicas, y las ponemos todas en una sola rueda. Tarda unos segundos en calcularse.", a: "Calcular el ejemplo" },
        { t: "Compáralo con el azar", d: "Cada cuerda une dos planetas cuyo aspecto aparece más (azul) o menos (naranja) de lo esperado. Parecen señales, pero mira el histograma: cielos desplazados en el tiempo dan un número parecido de cuerdas. Ver cuerdas no es hallar una relación.", a: "Ver las cuerdas y el azar" },
        { t: "Las tres compuertas", d: "Un hallazgo avanza solo si pasa tres preguntas: ¿se podía ver? (piso de detección), ¿resiste el control? (fechas control, réplicas, comparaciones múltiples) y ¿se repite con datos independientes?", a: "Ver cómo se prueba (modelo nulo)" },
        { t: "Un caso que no sobrevivió", d: "Mercurio–Urano daba z = +5,2 y parecía el primer resultado positivo. Al quitar las réplicas bajó a z = +1,3, y con 48.000 sismos nuevos de magnitud 5 desapareció. El método detectó su propio falso positivo.", a: "Ver el caso completo" },
        { t: "Ahora tú", d: "Prueba tu propia hipótesis: el Laboratorio te lleva por las tres compuertas, o arma un enunciado para pre-registrar antes de mirar los datos.", a: "Ir al Laboratorio" }] },
    en: { camino: "Suggested path", paso: "Step", de: "of", sig: "Next", lab: "Laboratory", copiar: "Copy link", copiado: "Link copied", guardar: "Save image", idioma: "Language",
      pasos: ["Principles and methods", "Sky and events", "Dashboard", "Your hypothesis", "Laboratory"],
      tour: "Guided tour", tourMin: "Guided tour (3 min)", parada: "Stop", prev: "Back", next: "Next", cerrar: "Close", fin: "Finish",
      steps: [
        { t: "The question", d: "When can I believe that a pattern between events on Earth and the sky is real? Almost everything you see in a wheel of charts is chance. In six stops you will learn to tell the difference.", a: "" },
        { t: "See the sky of thousands of events", d: "We draw one chart for each earthquake of magnitude 6 or more between 2000 and 2024, without aftershocks, and put them all in one wheel. It takes a few seconds to compute.", a: "Compute the example" },
        { t: "Compare it with chance", d: "Each chord joins two planets whose aspect appears more (blue) or less (orange) than expected. They look like signals, but look at the histogram: skies shifted in time give a similar number of chords. Seeing chords is not finding a relationship.", a: "See the chords and chance" },
        { t: "The three gates", d: "A finding moves on only if it passes three questions: could it be seen? (detection floor), does it survive the control? (control dates, aftershocks, multiple comparisons) and does it repeat with independent data?", a: "See how it is tested (null model)" },
        { t: "A case that did not survive", d: "Mercury–Uranus gave z = +5.2 and looked like the first positive result. Removing aftershocks dropped it to z = +1.3, and with 48,000 new magnitude 5 earthquakes it vanished. The method caught its own false positive.", a: "See the whole case" },
        { t: "Now you", d: "Test your own hypothesis: the Laboratory takes you through the three gates, or build a statement to pre-register before looking at the data.", a: "Go to the Laboratory" }] },
    fr: { camino: "Parcours suggéré", paso: "Étape", de: "sur", sig: "Suivant", lab: "Laboratoire", copiar: "Copier le lien", copiado: "Lien copié", guardar: "Enregistrer l'image", idioma: "Langue",
      pasos: ["Principes et méthodes", "Ciel et événements", "Tableau", "Votre hypothèse", "Laboratoire"],
      tour: "Visite guidée", tourMin: "Visite guidée (3 min)", parada: "Arrêt", prev: "Précédent", next: "Suivant", cerrar: "Fermer", fin: "Terminer",
      steps: [
        { t: "La question", d: "Quand puis-je croire qu'un schéma entre les événements de la Terre et le ciel est réel ? Presque tout ce que l'on voit dans une roue de thèmes est du hasard. En six arrêts, vous apprendrez à les distinguer.", a: "" },
        { t: "Voir le ciel de milliers d'événements", d: "Nous dessinons un thème pour chaque séisme de magnitude 6 ou plus entre 2000 et 2024, sans répliques, et nous les mettons tous dans une seule roue. Le calcul prend quelques secondes.", a: "Calculer l'exemple" },
        { t: "Comparer avec le hasard", d: "Chaque corde relie deux planètes dont l'aspect apparaît plus (bleu) ou moins (orange) que prévu. Elles ressemblent à des signaux, mais regardez l'histogramme : des ciels décalés dans le temps donnent un nombre de cordes semblable. Voir des cordes n'est pas trouver une relation.", a: "Voir les cordes et le hasard" },
        { t: "Les trois portes", d: "Une découverte n'avance que si elle passe trois questions : pouvait-on la voir ? (plancher de détection), résiste-t-elle au contrôle ? (dates témoins, répliques, comparaisons multiples) et se répète-t-elle avec des données indépendantes ?", a: "Voir comment on teste (modèle nul)" },
        { t: "Un cas qui n'a pas survécu", d: "Mercure–Uranus donnait z = +5,2 et semblait le premier résultat positif. En retirant les répliques, il est tombé à z = +1,3, et avec 48 000 nouveaux séismes de magnitude 5 il a disparu. La méthode a détecté son propre faux positif.", a: "Voir le cas complet" },
        { t: "À vous", d: "Testez votre propre hypothèse : le Laboratoire vous guide à travers les trois portes, ou construisez un énoncé à pré-enregistrer avant de regarder les données.", a: "Aller au Laboratoire" }] }
  };
  function L() { var l = document.documentElement.lang || "es"; return T[l] || T.es; }
  function irTab(t) { var b = document.querySelector('nav button[data-tab="' + t + '"]'); if (b) b.click(); }

  /* ---------- 1) selector de idioma ---------- */
  function sincronizarIdioma() {
    var l = document.documentElement.lang || "es";
    document.querySelectorAll("#lang-sel button").forEach(function (b) { var on = b.getAttribute("data-l") === l; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("on", on); });
  }
  function ponerIdioma(l) { if (typeof applyLang === "function") applyLang(l); sincronizarIdioma(); pintarCamino(); pintarCopiar(); if (panel) pintarParada(); }

  /* ---------- 2) camino sugerido ---------- */
  var CAMINO = ["ayuda", "cielo", "tablero", "hipotesis", "lab"];
  function pintarCamino() {
    var t = L();
    CAMINO.slice(0, 4).forEach(function (tab, i) {
      var sec = $(tab); if (!sec) return; var barra = sec.querySelector(":scope > .camino");
      if (!barra) { barra = document.createElement("div"); barra.className = "camino"; barra.setAttribute("role", "navigation"); sec.insertBefore(barra, sec.firstChild); }
      barra.setAttribute("aria-label", t.camino);
      var h = '<span class="camino-t">' + t.camino + '</span>';
      CAMINO.forEach(function (d, k) {
        var n = t.pasos[k], cur = k === i;
        h += (k ? '<span class="camino-sep" aria-hidden="true">›</span>' : "") + '<a href="' + (d === "lab" ? "laboratorio/index.html" : "#" + d) + '" data-camino="' + d + '"' + (cur ? ' aria-current="step" class="cur"' : "") + '><b>' + (k + 1) + "</b> " + n + "</a>";
      });
      var sig = CAMINO[i + 1];
      h += '<a class="camino-sig" href="' + (sig === "lab" ? "laboratorio/index.html" : "#" + sig) + '" data-camino="' + sig + '">' + t.sig + " → " + "</a>";
      barra.innerHTML = h;
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-camino]"); if (!a) return; var d = a.getAttribute("data-camino");
    if (d === "lab") return; e.preventDefault(); irTab(d); window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- 3) copiar enlace ---------- */
  function pintarCopiar() {
    var t = L();
    document.querySelectorAll("main > section[id]").forEach(function (sec) {
      var lead = sec.querySelector(".tab-lead"); if (!lead) return; var b = sec.querySelector(":scope > .copiar-enlace");
      if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "copiar-enlace"; b.addEventListener("click", function () { copiar(sec.id, b); }); lead.insertAdjacentElement("afterend", b); }
      b.textContent = "🔗 " + t.copiar;
    });
  }
  function copiar(tab, btn) {
    var url = location.origin + location.pathname + "#" + tab, t = L();
    function ok() { var v = btn.textContent; btn.textContent = "✓ " + t.copiado; setTimeout(function () { btn.textContent = "🔗 " + t.copiar; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt(t.copiar, url); }); else { prompt(t.copiar, url); }
  }

  /* ---------- 4) guardar SVG como imagen ---------- */
  window.guardarImagen = function (contenedorId, nombre) {
    var svg = document.querySelector("#" + contenedorId + " svg"); if (!svg) return;
    var vb = svg.viewBox.baseVal, W = vb && vb.width ? vb.width : svg.clientWidth, H = vb && vb.height ? vb.height : svg.clientHeight, esc = 2;
    var c = svg.cloneNode(true); c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", W); c.setAttribute("height", H);
    var fondo = document.createElementNS("http://www.w3.org/2000/svg", "rect"); fondo.setAttribute("x", vb ? vb.x : 0); fondo.setAttribute("y", vb ? vb.y : 0); fondo.setAttribute("width", W); fondo.setAttribute("height", H); fondo.setAttribute("fill", "#ffffff"); c.insertBefore(fondo, c.firstChild);
    var fuente = new XMLSerializer().serializeToString(c), img = new Image();
    img.onload = function () { var cv = document.createElement("canvas"); cv.width = W * esc; cv.height = H * esc; var g = cv.getContext("2d"); g.scale(esc, esc); g.drawImage(img, 0, 0, W, H);
      var a = document.createElement("a"); a.download = nombre + ".png"; a.href = cv.toDataURL("image/png"); document.body.appendChild(a); a.click(); a.remove(); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fuente);
  };

  /* ---------- 5) recorrido guiado ---------- */
  var panel = null, paso = 0;
  function crearPanel() {
    panel = document.createElement("div"); panel.id = "tour"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-live", "polite"); document.body.appendChild(panel);
  }
  function pintarParada() {
    if (!panel) return; var t = L(), s = t.steps[paso], n = t.steps.length, pts = "";
    for (var i = 0; i < n; i++) pts += '<span class="tour-punto' + (i === paso ? " on" : "") + '"></span>';
    panel.setAttribute("aria-label", t.tour);
    panel.innerHTML = '<div class="tour-cab"><span>' + t.parada + " " + (paso + 1) + " " + t.de + " " + n + '</span><button type="button" class="tour-x" aria-label="' + t.cerrar + '" data-tour="x">✕</button></div>' +
      '<h3>' + s.t + '</h3><p>' + s.d + '</p>' + (s.a ? '<button type="button" class="act tour-act" data-tour="act">' + s.a + "</button>" : "") +
      '<div class="tour-pie"><div class="tour-puntos">' + pts + '</div><div><button type="button" class="ghost" data-tour="prev"' + (paso === 0 ? " disabled" : "") + ">← " + t.prev + '</button> <button type="button" class="act" data-tour="next">' + (paso === n - 1 ? t.fin : t.next + " →") + "</button></div></div>";
  }
  function accionParada() {
    if (paso === 1) { irTab("cielo"); setTimeout(function () { if (window.cieloEjemplo) cieloEjemplo(); }, 150); }
    else if (paso === 2) { irTab("cielo"); var el = $("cielo_aspectos"); setTimeout(function () { if (el && $("cielo_res").style.display !== "none") el.scrollIntoView({ behavior: "smooth", block: "center" }); else if (window.cieloEjemplo) cieloEjemplo(); }, 150); }
    else if (paso === 3) { if (typeof irA === "function") irA("ayuda", "met_nulo"); else irTab("ayuda"); }
    else if (paso === 4) { irTab("hipotesis"); setTimeout(function () { var h = document.querySelector("#hipotesis .card"); if (h) h.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150); }
    else if (paso === 5) { location.href = "laboratorio/index.html"; }
  }
  window.iniciarRecorrido = function (desde) { if (!panel) crearPanel(); paso = desde || 0; panel.style.display = "block"; pintarParada(); if (paso === 0) { irTab("guia"); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-tour]"); if (!b || !panel) return; var a = b.getAttribute("data-tour"), n = L().steps.length;
    if (a === "x") panel.style.display = "none";
    else if (a === "act") accionParada();
    else if (a === "prev" && paso > 0) { paso--; pintarParada(); }
    else if (a === "next") { if (paso >= n - 1) panel.style.display = "none"; else { paso++; pintarParada(); } }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel && panel.style.display !== "none") panel.style.display = "none"; });

  function botonesRecorrido() {
    var t = L(); document.querySelectorAll("[data-tour-btn]").forEach(function (b) { b.textContent = "▶ " + t.tourMin; }); document.querySelectorAll("[data-guardar]").forEach(function (b) { b.textContent = "⬇ " + t.guardar; });
  }
  function iniciar() {
    document.querySelectorAll("#lang-sel button").forEach(function (b) { b.addEventListener("click", function () { ponerIdioma(b.getAttribute("data-l")); botonesRecorrido(); }); });
    sincronizarIdioma(); pintarCamino(); pintarCopiar(); botonesRecorrido();
    new MutationObserver(function () { sincronizarIdioma(); pintarCamino(); pintarCopiar(); botonesRecorrido(); if (panel) pintarParada(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    if (location.hash === "#recorrido") setTimeout(function () { window.iniciarRecorrido(0); }, 600);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
