/* tour_mapa.js — recorrido guiado del Mapa Cósmico 3D: entra a pantalla completa y muestra, vista por vista, qué se puede hacer.
   El panel vive DENTRO de #map_shell: en pantalla completa real el navegador solo pinta ese subárbol. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    es: { boton: "▶ Recorrido por el mapa 3D (1 min)", parada: "Parada", de: "de", prev: "Anterior", next: "Siguiente", fin: "Terminar y salir", cerrar: "Cerrar", zooms: "Ver los tres zooms",
      pasos: [
        { t: "Un mapa que puedes girar y acercar", d: "Arrastra con el mouse (o con un dedo) para girar el mapa y usa la rueda (o dos dedos) para acercar. Los íconos de la izquierda cambian de vista. En siete paradas verás qué se puede hacer.", obj: ["hud_rail"] },
        { t: "🌍 Tierra: sus movimientos", d: "Rotación, traslación, precesión y nutación, aceleradas para poder verlas. Pulsa ▶ abajo, o mueve la barra de tiempo, y la Tierra se mueve.", obj: ["hud_tierra", "three_play_btn"] },
        { t: "🌌 Sistema Solar, estrellas y galaxia", d: "Es el mismo mapa con distinto zoom: desde los planetas hasta las estrellas y la Vía Láctea. Las distancias son esquemáticas; lo que importa es la geometría de los ángulos.", obj: ["hud_cosmos"], accion: "zooms" },
        { t: "🔮 Carta astral", d: "Los planetas, los signos y los aspectos de cualquier fecha, hora y lugar, en una rueda 2D o en una escena 3D. Cambia la fecha en el panel de abajo y la carta se recalcula.", obj: ["hud_carta"] },
        { t: "🏛️ Topocentrismo", d: "La misma carta, pero mostrando por qué tu latitud y tu longitud exactas cambian las casas: la esfera 3D del sistema de Polich y Page que usa toda esta plataforma.", obj: ["hud_page"] },
        { t: "🌀 Cicloide de Llona", d: "La curva real que traza un punto de la corteza al combinar la rotación y la traslación de la Tierra. La velocidad es esquemática para que puedas ver cómo se forma.", obj: ["hud_llona"] },
        { t: "Los controles de la derecha", d: "Ese riel cambia según la vista: capas, escala de tiempo, velocidad y más. El botón ⛶ entra y sale de pantalla completa. Ya conoces lo básico: explora con calma.", obj: ["mov_rail", "mc_fullscreen_btn"] }] },
    en: { boton: "▶ 3D map tour (1 min)", parada: "Stop", de: "of", prev: "Back", next: "Next", fin: "Finish and exit", cerrar: "Close", zooms: "See the three zooms",
      pasos: [
        { t: "A map you can rotate and zoom", d: "Drag with the mouse (or a finger) to rotate the map and use the wheel (or two fingers) to zoom. The icons on the left change the view. In seven stops you will see what you can do.", obj: ["hud_rail"] },
        { t: "🌍 Earth: its motions", d: "Rotation, revolution, precession and nutation, sped up so you can see them. Press ▶ below, or move the time bar, and the Earth moves.", obj: ["hud_tierra", "three_play_btn"] },
        { t: "🌌 Solar System, stars and galaxy", d: "It is the same map at different zoom: from the planets to the stars and the Milky Way. Distances are schematic; what matters is the geometry of the angles.", obj: ["hud_cosmos"], accion: "zooms" },
        { t: "🔮 Birth chart", d: "The planets, signs and aspects for any date, time and place, in a 2D wheel or a 3D scene. Change the date in the panel below and the chart is recomputed.", obj: ["hud_carta"] },
        { t: "🏛️ Topocentrism", d: "The same chart, showing why your exact latitude and longitude change the houses: the 3D sphere of the Polich–Page system used across this platform.", obj: ["hud_page"] },
        { t: "🌀 Llona's cycloid", d: "The real curve traced by a point of the crust combining the Earth's rotation and revolution. The speed is schematic so you can watch it form.", obj: ["hud_llona"] },
        { t: "The controls on the right", d: "That rail changes with the view: layers, time scale, speed and more. The ⛶ button enters and leaves full screen. You know the basics now: explore at your own pace.", obj: ["mov_rail", "mc_fullscreen_btn"] }] },
    fr: { boton: "▶ Visite de la carte 3D (1 min)", parada: "Arrêt", de: "sur", prev: "Précédent", next: "Suivant", fin: "Terminer et quitter", cerrar: "Fermer", zooms: "Voir les trois zooms",
      pasos: [
        { t: "Une carte que vous pouvez tourner et agrandir", d: "Faites glisser avec la souris (ou un doigt) pour tourner la carte et utilisez la molette (ou deux doigts) pour zoomer. Les icônes de gauche changent la vue. En sept arrêts vous verrez ce que l'on peut faire.", obj: ["hud_rail"] },
        { t: "🌍 Terre : ses mouvements", d: "Rotation, révolution, précession et nutation, accélérées pour pouvoir les voir. Appuyez sur ▶ en bas, ou déplacez la barre de temps, et la Terre bouge.", obj: ["hud_tierra", "three_play_btn"] },
        { t: "🌌 Système solaire, étoiles et galaxie", d: "C'est la même carte avec un autre zoom : des planètes aux étoiles et à la Voie lactée. Les distances sont schématiques ; ce qui compte, c'est la géométrie des angles.", obj: ["hud_cosmos"], accion: "zooms" },
        { t: "🔮 Thème astral", d: "Les planètes, signes et aspects de n'importe quelle date, heure et lieu, en roue 2D ou en scène 3D. Changez la date dans le panneau du bas et le thème est recalculé.", obj: ["hud_carta"] },
        { t: "🏛️ Topocentrisme", d: "Le même thème, montrant pourquoi votre latitude et votre longitude exactes changent les maisons : la sphère 3D du système de Polich et Page utilisé dans toute cette plateforme.", obj: ["hud_page"] },
        { t: "🌀 Cycloïde de Llona", d: "La courbe réelle tracée par un point de l'écorce en combinant la rotation et la révolution de la Terre. La vitesse est schématique pour que vous voyiez la courbe se former.", obj: ["hud_llona"] },
        { t: "Les commandes de droite", d: "Ce rail change selon la vue : couches, échelle de temps, vitesse et plus. Le bouton ⛶ entre et sort du plein écran. Vous connaissez l'essentiel : explorez à votre rythme.", obj: ["mov_rail", "mc_fullscreen_btn"] }] }
  };
  function L() { var l = document.documentElement.lang || "es"; return T[l] || T.es; }
  var panel = null, paso = 0, timers = [], marcados = [];
  function llamar(fn) { try { if (typeof window[fn] === "function") window[fn].apply(null, [].slice.call(arguments, 1)); } catch (e) { /* una vista que falla no debe romper el recorrido */ } }
  function limpiarTimers() { timers.forEach(clearTimeout); timers = []; }
  function limpiarMarcas() { marcados.forEach(function (e) { e.classList.remove("tm-pulse"); }); marcados = []; }
  function marcar(ids) { limpiarMarcas(); (ids || []).forEach(function (id) { var e = $(id); if (e) { e.classList.add("tm-pulse"); marcados.push(e); } }); }
  function crear() { var sh = $("map_shell"); if (!sh) return false; if (!panel) { panel = document.createElement("div"); panel.id = "tourMapa"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-live", "polite"); } if (panel.parentNode !== sh) sh.appendChild(panel); return true; }
  function enFullscreen() { var sh = $("map_shell"); return !!(sh && sh.classList.contains("mc-fullscreen")); }

  function accionDe(i) {
    limpiarTimers();
    if (i === 0) { llamar("threeHudGo", "tierra"); }
    else if (i === 1) { llamar("threeHudGo", "tierra"); }
    else if (i === 2) { llamar("threeHudGo", "sistema"); }
    else if (i === 3) { llamar("threeHudGo", "carta"); }
    else if (i === 4) { llamar("threeHudGo", "carta"); timers.push(setTimeout(function () { llamar("threeAtajoPage"); $("map_shell").scrollIntoView({ block: "start" }); }, 250)); }
    else if (i === 6) { llamar("threeHudGo", "tierra"); }
    else if (i === 5) { llamar("threeAtajoLlona"); timers.push(setTimeout(function () { llamar("threeLlonaAnimar"); $("map_shell").scrollIntoView({ block: "start" }); }, 700)); }
  }
  function zooms() {
    limpiarTimers(); llamar("threeHudGo", "sistema");
    timers.push(setTimeout(function () { llamar("threeHudGo", "estrellas"); }, 2600));
    timers.push(setTimeout(function () { llamar("threeHudGo", "galaxia"); }, 5200));
  }
  function pintar() {
    if (!panel) return; var t = L(), s = t.pasos[paso], n = t.pasos.length, pts = "";
    for (var i = 0; i < n; i++) pts += '<span class="tm-punto' + (i === paso ? " on" : "") + '"></span>';
    panel.setAttribute("aria-label", t.boton);
    panel.innerHTML = '<div class="tm-cab"><span>' + t.parada + " " + (paso + 1) + " " + t.de + " " + n + '</span><button type="button" class="tm-x" aria-label="' + t.cerrar + '" data-tm="x">✕</button></div><h3>' + s.t + "</h3><p>" + s.d + "</p>" +
      (s.accion === "zooms" ? '<button type="button" class="act tm-act" data-tm="zooms">' + t.zooms + "</button>" : "") +
      '<div class="tm-pie"><div class="tm-puntos">' + pts + '</div><div><button type="button" class="ghost" data-tm="prev"' + (paso === 0 ? " disabled" : "") + ">← " + t.prev + '</button> <button type="button" class="act" data-tm="next">' + (paso === n - 1 ? t.fin : t.next + " →") + "</button></div></div>";
    marcar(s.obj);
  }
  function ir(i) {
    paso = i; pintar(); accionDe(i);
    /* la página reescribe las clases de los botones al cambiar de vista: se vuelve a marcar después */
    [160, 700, 1500].forEach(function (ms) { timers.push(setTimeout(function () { if (panel && panel.style.display !== "none") marcar(L().pasos[paso].obj); }, ms)); });
  }
  function cerrar(salir) { limpiarTimers(); limpiarMarcas(); if (panel) panel.style.display = "none"; if (salir && enFullscreen() && typeof window.threeToggleFullscreen === "function") window.threeToggleFullscreen(); }

  window.iniciarRecorridoMapa = function () {
    var g = document.querySelector('nav button[data-tab="guia"]'); if (g) g.click();
    if (!crear()) return;
    var sh = $("map_shell"); if (sh && sh.scrollIntoView) sh.scrollIntoView({ block: "start" });
    llamar("threeHudGo", "tierra");
    if (!enFullscreen()) llamar("threeToggleFullscreen");
    panel.style.display = "block"; setTimeout(function () { ir(0); }, 350);
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-tm],[data-mapa-tour]"); if (!b) return;
    if (b.hasAttribute("data-mapa-tour")) { window.iniciarRecorridoMapa(); return; }
    var a = b.getAttribute("data-tm"), n = L().pasos.length;
    if (a === "x") cerrar(false);
    else if (a === "prev" && paso > 0) ir(paso - 1);
    else if (a === "next") { if (paso >= n - 1) cerrar(true); else ir(paso + 1); }
    else if (a === "zooms") zooms();
  });
  function textoBoton() { document.querySelectorAll("[data-mapa-tour]").forEach(function (b) { b.textContent = L().boton; }); }
  function iniciar() {
    textoBoton(); new MutationObserver(function () { textoBoton(); if (panel && panel.style.display !== "none") pintar(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    if (location.hash === "#recorrido-mapa") setTimeout(window.iniciarRecorridoMapa, 800);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
