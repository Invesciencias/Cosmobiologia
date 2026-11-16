/* cielo_ui.js — interfaz de la pestaña «Cielo y eventos». Usa Cielo (js/cielo.js) y la lista `events` del explorador.
   Textos en español, inglés y francés; los resultados se redibujan al cambiar de idioma. Recuerda la última selección. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", VERDE = "#4f9f8c", NAR = "#ffb454", AZUL = "#2f80b8", INK = "#14282b", MUT = "#53696a";
  var corriendo = false, ultimo = null, restaurado = false, CLAVE = "cielo_prefs";

  var PLAN = { es: ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"], en: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"], fr: ["Soleil", "Lune", "Mercure", "Vénus", "Mars", "Jupiter", "Saturne", "Uranus", "Neptune", "Pluton"] };
  var ASPN = { es: ["conjunción", "sextil", "cuadratura", "trígono", "oposición"], en: ["conjunction", "sextile", "square", "trine", "opposition"], fr: ["conjonction", "sextile", "carré", "trigone", "opposition"] };
  var TX = {
    es: {
      cargando: "Cargando efemérides…", quitando: "Quitando réplicas…", calculando: "Calculando las 225 comparaciones…", azar: function (k, N) { return "Cielos desplazados (azar): " + k + " de " + N; },
      pocos: function (n) { return "Hay solo " + n + " eventos con esos filtros; se necesitan al menos 30."; }, fallo: "No se pudo calcular: ",
      resumen: function (n, b, m) { return n + " eventos usados de " + b + " seleccionados · " + m + " · efemérides de 1970 a 2033: los eventos fuera de ese rango se omiten."; },
      m_sim: "sin réplicas (Gardner–Knopoff, ventana simétrica)", m_des: "sin réplicas (solo posteriores)", m_no: "sin declusterizar",
      notaDom: "Este dominio puede tener estacionalidad o varios registros por evento (por ejemplo, una tormenta con muchas lecturas). Las fechas control de ±18 a 30 días caen en otra estación, así que muchas comparaciones salen «significativas» solo por la estación: es un control positivo del método, no un hallazgo. El declusterizado de Gardner–Knopoff solo se aplica a sismos.",
      avisoEst: "Ojo: este dominio tiene estacionalidad (por ejemplo, los huracanes se concentran de agosto a octubre) y a veces varios registros por evento. Las fechas control caen en otra estación, así que el Sol y los planetas cercanos salen «significativos» solo por la estación. Por eso los cielos desplazados se hicieron con años enteros (conservan la estación). Si aun así la real queda muy por encima del azar, sospecha del diseño antes que del cielo: para concluir hace falta un nulo que conserve la estación y contar una tormenta como un solo evento.",
      avisoAlto: "La real queda por encima del 95 % del azar. Antes de creerlo: comprueba que quitaste las réplicas, que el catálogo es independiente, y repite el cálculo en otro periodo o catálogo (compuerta 3).",
      rueda: function (f, p, n, z, pl, a, b) { return "Casillas fuera de ±1,96: " + f + " (" + p + " verdes y " + n + " naranjas); el azar da unas 18 de 360. El mayor |z| es " + z + " (" + pl + ", " + a + "°–" + b + "°). Verde: más eventos que en fechas control; naranja: menos. Los planetas lentos (Júpiter hacia afuera) salen casi blancos porque no distinguen un evento de otro; Sol, Mercurio y Venus se mueven juntos, así que sus casillas vecinas no son pruebas independientes."; },
      anillo1: "Cada anillo es un planeta;", anillo2: "el Sol está al centro.", aRueda: "Rueda de cartas: un anillo por planeta, 36 sectores de 10 grados, coloreados por z", aAsp: "Rueda de aspectos: cuerdas entre los planetas cuyo aspecto se aparta del azar", aHist: "Cuántas cuerdas da el azar",
      real: function (n) { return "la real: " + n; }, fuera: "(fuera de escala, muy por encima del azar)", ejeX: "cuerdas fuera de ±1,96 en cada cielo desplazado",
      menosDel: function (x) { return "menos del " + x + " %"; }, el: function (x) { return "el " + x + " %"; },
      asp1: function (n, m, a, b, pc, z, pz) { return n + " cuerdas fuera de ±1,96; el azar da " + m + " (95 % entre " + a + " y " + b + "). Ese número o más lo da el azar " + pc + " de las veces; el z más alto (" + z + ") lo iguala " + pz + "."; },
      asp2: function (n, piso, N) { return "Con " + n + " eventos y una frecuencia base de 10 %, el piso de detección es RR ≈ " + piso + ": un efecto menor no se distingue del azar. Las 225 comparaciones no son independientes; el p-valor global sale de " + N + " cielos desplazados (cada evento corrido, misma hora y lugar)."; },
      ninguna: "Ninguna comparación pasa ±1,96.", csvNombre: "cielo_comparaciones" },
    en: {
      cargando: "Loading ephemerides…", quitando: "Removing aftershocks…", calculando: "Computing the 225 comparisons…", azar: function (k, N) { return "Shifted skies (chance): " + k + " of " + N; },
      pocos: function (n) { return "Only " + n + " events match those filters; at least 30 are needed."; }, fallo: "Could not compute: ",
      resumen: function (n, b, m) { return n + " events used out of " + b + " selected · " + m + " · ephemerides from 1970 to 2033: events outside that range are skipped."; },
      m_sim: "aftershocks removed (Gardner–Knopoff, symmetric window)", m_des: "aftershocks removed (later events only)", m_no: "not declustered",
      notaDom: "This domain may be seasonal or have several records per event (for example, a storm with many readings). Control dates of ±18 to 30 days fall in another season, so many comparisons come out «significant» only because of the season: it is a positive control of the method, not a finding. Gardner–Knopoff declustering only applies to earthquakes.",
      avisoEst: "Careful: this domain is seasonal (for example, hurricanes concentrate from August to October) and sometimes has several records per event. Control dates fall in another season, so the Sun and nearby planets come out «significant» only because of the season. That is why the shifted skies were made with whole years (they keep the season). If the real one is still far above chance, suspect the design before the sky: to conclude you need a null that keeps the season and counts a storm as a single event.",
      avisoAlto: "The real one is above 95 % of chance. Before believing it: check that you removed aftershocks, that the catalog is independent, and repeat the computation in another period or catalog (gate 3).",
      rueda: function (f, p, n, z, pl, a, b) { return "Cells outside ±1.96: " + f + " (" + p + " green and " + n + " orange); chance gives about 18 of 360. The largest |z| is " + z + " (" + pl + ", " + a + "°–" + b + "°). Green: more events than on control dates; orange: fewer. Slow planets (Jupiter outward) look almost white because they cannot tell one event from another; the Sun, Mercury and Venus move together, so their neighbouring cells are not independent tests."; },
      anillo1: "Each ring is a planet;", anillo2: "the Sun is at the centre.", aRueda: "Wheel of charts: one ring per planet, 36 sectors of 10 degrees, coloured by z", aAsp: "Aspect wheel: chords between planets whose aspect departs from chance", aHist: "How many chords chance gives",
      real: function (n) { return "the real one: " + n; }, fuera: "(off scale, far above chance)", ejeX: "chords outside ±1.96 in each shifted sky",
      menosDel: function (x) { return "less than " + x + " %"; }, el: function (x) { return x + " %"; },
      asp1: function (n, m, a, b, pc, z, pz) { return n + " chords outside ±1.96; chance gives " + m + " (95 % between " + a + " and " + b + "). That number or more happens by chance " + pc + " of the time; the highest z (" + z + ") is matched " + pz + " of the time."; },
      asp2: function (n, piso, N) { return "With " + n + " events and a base frequency of 10 %, the detection floor is RR ≈ " + piso + ": a smaller effect cannot be told from chance. The 225 comparisons are not independent; the global p-value comes from " + N + " shifted skies (each event shifted, same time of day and place)."; },
      ninguna: "No comparison passes ±1.96.", csvNombre: "sky_comparisons" },
    fr: {
      cargando: "Chargement des éphémérides…", quitando: "Retrait des répliques…", calculando: "Calcul des 225 comparaisons…", azar: function (k, N) { return "Ciels décalés (hasard) : " + k + " sur " + N; },
      pocos: function (n) { return "Il n'y a que " + n + " événements avec ces filtres ; il en faut au moins 30."; }, fallo: "Calcul impossible : ",
      resumen: function (n, b, m) { return n + " événements utilisés sur " + b + " sélectionnés · " + m + " · éphémérides de 1970 à 2033 : les événements hors de cette plage sont ignorés."; },
      m_sim: "répliques retirées (Gardner–Knopoff, fenêtre symétrique)", m_des: "répliques retirées (événements postérieurs seulement)", m_no: "sans déclustering",
      notaDom: "Ce domaine peut être saisonnier ou avoir plusieurs enregistrements par événement (par exemple, une tempête avec de nombreuses lectures). Les dates témoins de ±18 à 30 jours tombent dans une autre saison, donc beaucoup de comparaisons sortent « significatives » uniquement à cause de la saison : c'est un contrôle positif de la méthode, pas une découverte. Le déclustering de Gardner–Knopoff ne s'applique qu'aux séismes.",
      avisoEst: "Attention : ce domaine est saisonnier (par exemple, les ouragans se concentrent d'août à octobre) et a parfois plusieurs enregistrements par événement. Les dates témoins tombent dans une autre saison, donc le Soleil et les planètes proches sortent « significatifs » uniquement à cause de la saison. C'est pourquoi les ciels décalés ont été faits par années entières (ils conservent la saison). Si le réel reste très au-dessus du hasard, méfiez-vous du dispositif avant du ciel : pour conclure il faut un nul qui conserve la saison et compte une tempête comme un seul événement.",
      avisoAlto: "Le réel dépasse 95 % du hasard. Avant d'y croire : vérifiez que vous avez retiré les répliques, que le catalogue est indépendant, et refaites le calcul sur une autre période ou un autre catalogue (porte 3).",
      rueda: function (f, p, n, z, pl, a, b) { return "Cases hors de ±1,96 : " + f + " (" + p + " vertes et " + n + " oranges) ; le hasard en donne environ 18 sur 360. Le plus grand |z| est " + z + " (" + pl + ", " + a + "°–" + b + "°). Vert : plus d'événements qu'aux dates témoins ; orange : moins. Les planètes lentes (de Jupiter vers l'extérieur) sont presque blanches car elles ne distinguent pas un événement d'un autre ; le Soleil, Mercure et Vénus bougent ensemble, donc leurs cases voisines ne sont pas des tests indépendants."; },
      anillo1: "Chaque anneau est une planète ;", anillo2: "le Soleil est au centre.", aRueda: "Roue de thèmes : un anneau par planète, 36 secteurs de 10 degrés, colorés selon z", aAsp: "Roue des aspects : cordes entre les planètes dont l'aspect s'écarte du hasard", aHist: "Combien de cordes donne le hasard",
      real: function (n) { return "le réel : " + n; }, fuera: "(hors échelle, très au-dessus du hasard)", ejeX: "cordes hors de ±1,96 dans chaque ciel décalé",
      menosDel: function (x) { return "moins de " + x + " %"; }, el: function (x) { return x + " %"; },
      asp1: function (n, m, a, b, pc, z, pz) { return n + " cordes hors de ±1,96 ; le hasard en donne " + m + " (95 % entre " + a + " et " + b + "). Ce nombre ou plus se produit par hasard " + pc + " du temps ; le z le plus haut (" + z + ") est égalé " + pz + " du temps."; },
      asp2: function (n, piso, N) { return "Avec " + n + " événements et une fréquence de base de 10 %, le plancher de détection est RR ≈ " + piso + " : un effet plus petit ne se distingue pas du hasard. Les 225 comparaisons ne sont pas indépendantes ; la p-valeur globale vient de " + N + " ciels décalés (chaque événement décalé, même heure et même lieu)."; },
      ninguna: "Aucune comparaison ne dépasse ±1,96.", csvNombre: "ciel_comparaisons" }
  };
  function idioma() { var l = document.documentElement.lang || "es"; return TX[l] ? l : "es"; }
  function tx() { return TX[idioma()]; }
  function nombres() { return PLAN[idioma()]; }
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, texto) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (texto != null) n.textContent = texto; return n; }
  function fmt(x, d) { var l = idioma(), t = Number(x).toFixed(d || 0).split("."); t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, l === "en" ? "," : (l === "fr" ? " " : ".")); return t.join(l === "en" ? "." : ","); }
  function mezcla(c1, c2, t) { var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16), r = [16, 8, 0].map(function (s) { return Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); }); return "rgb(" + r[0] + "," + r[1] + "," + r[2] + ")"; }
  function colorZ(z, vmax) { var t = Math.max(-1, Math.min(1, z / vmax)); return t >= 0 ? mezcla("#ffffff", VERDE, t) : mezcla("#ffffff", NAR, -t); }
  function pol(cx, cy, r, th) { var a = th * Math.PI / 180; return [cx - r * Math.cos(a), cy - r * Math.sin(a)]; }   // 0° al oeste, sentido horario (como la rueda del Laboratorio)

  /* ---------- recordar la selección ---------- */
  function guardarPrefs() { try { localStorage.setItem(CLAVE, JSON.stringify({ d: $("cielo_dominio").value, v: $("cielo_vmin").value, a: $("cielo_y0").value, b: $("cielo_y1").value, r: $("cielo_declust").value, m: $("cielo_modo").value, p: $("cielo_placebos").value })); } catch (e) {} }
  function leerPrefs() { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { return null; } }

  function iniciar() {
    var sel = $("cielo_dominio"); if (!sel) return;
    var cuenta = {}; (typeof events !== "undefined" ? events : []).forEach(function (e) { var d = String(e.domain || ""); if (d) cuenta[d] = (cuenta[d] || 0) + 1; });
    var previo = sel.value; sel.innerHTML = "";
    Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).forEach(function (d) { var o = document.createElement("option"); o.value = d; o.textContent = d + " (" + fmt(cuenta[d]) + ")"; sel.appendChild(o); });
    var pr = leerPrefs();
    if (pr && cuenta[pr.d] && !restaurado) { restaurado = true; sel.value = pr.d; alCambiarDominio(); $("cielo_vmin").value = pr.v; $("cielo_y0").value = pr.a; $("cielo_y1").value = pr.b; if (!$("cielo_declust").disabled) $("cielo_declust").value = pr.r; $("cielo_modo").value = pr.m; $("cielo_placebos").value = pr.p; return; }
    if (previo && cuenta[previo]) sel.value = previo; else if (cuenta["sismo"]) sel.value = "sismo";
    alCambiarDominio();
  }
  function alCambiarDominio() {
    var esSismo = $("cielo_dominio").value === "sismo";
    $("cielo_vmin").value = esSismo ? 6 : ""; $("cielo_declust").disabled = !esSismo; if (!esSismo) $("cielo_declust").value = "no"; else if ($("cielo_declust").value === "no") $("cielo_declust").value = "simetrica"; $("cielo_modo").value = esSismo ? "dias" : "anios";
    $("cielo_nota_dom").textContent = esSismo ? "" : tx().notaDom;
  }

  function seleccionar() {
    var dom = $("cielo_dominio").value, vmin = parseFloat($("cielo_vmin").value), y0 = parseInt($("cielo_y0").value, 10), y1 = parseInt($("cielo_y1").value, 10), out = [];
    (typeof events !== "undefined" ? events : []).forEach(function (e) {
      if (String(e.domain || "") !== dom) return;
      var t = Date.parse(e.datetime_utc), v = parseFloat(e.value), la = parseFloat(e.latitude), lo = parseFloat(e.longitude);
      if (!(t === t)) return;
      var y = new Date(t).getUTCFullYear(); if (y0 === y0 && y < y0) return; if (y1 === y1 && y > y1) return;
      if (vmin === vmin && !(v >= vmin)) return;
      out.push({ t: t, mag: v, lat: la, lon: lo });
    });
    return out;
  }

  function calcular() {
    if (corriendo) return; var msg = $("cielo_msg"), barra = $("cielo_barra"); guardarPrefs();
    msg.textContent = tx().cargando; $("cielo_res").style.display = "none";
    corriendo = true; $("cielo_ir").disabled = true;
    var lista = seleccionar(), bruto = lista.length, modo = $("cielo_declust").value;
    var prep = (window.__efem ? Promise.resolve() : Cielo.cargarEfemerides("").then(function () { window.__efem = true; }));
    prep.then(function () {
      if (modo !== "no") { msg.textContent = tx().quitando; lista = Cielo.declusterizar(lista, modo); }
      var tiempos = lista.map(function (e) { return e.t; });
      if (tiempos.length < 30) throw new Error(tx().pocos(tiempos.length));
      msg.textContent = tx().calculando;
      return new Promise(function (r) { setTimeout(r, 20); }).then(function () {
        var asp = Cielo.tablaAspectos(tiempos, 0), sec = Cielo.tablaSectores(tiempos, 36), N = parseInt($("cielo_placebos").value, 10);
        barra.style.display = "block"; barra.max = N; barra.value = 0; msg.textContent = tx().azar(0, N);
        return Cielo.placebos(tiempos, N, 2026, function (k) { barra.value = k; msg.textContent = tx().azar(k, N); }, $("cielo_modo").value).then(function (pl) {
          ultimo = { n: asp.n, bruto: bruto, modo: modo, asp: asp, sec: sec, pl: pl, N: N, dom: $("cielo_dominio").value, desp: $("cielo_modo").value }; dibujar(ultimo);
        });
      });
    }).catch(function (e) { msg.textContent = tx().fallo + (e && e.message ? e.message : e); })
      .then(function () { corriendo = false; $("cielo_ir").disabled = false; barra.style.display = "none"; });
  }

  function pct(p, n) { var t = tx(); return p === 0 ? t.menosDel(100 / n < 1 ? "1" : Math.round(100 / n)) : t.el(Math.round(p * 100)); }
  function dibujar(u) {
    var t = tx(), PL = nombres(), AN = ASPN[idioma()], dec = function (x, d) { var s = Number(x).toFixed(d); return idioma() === "en" ? s : s.replace(".", ","); };
    $("cielo_msg").textContent = ""; $("cielo_res").style.display = "block";
    var ch = Cielo.cuerdas(u.asp.z), cnt = u.pl.cnt, media = cnt.reduce(function (s, x) { return s + x; }, 0) / cnt.length, p25 = Cielo.percentil(cnt, 0.025), p975 = Cielo.percentil(cnt, 0.975);
    var Pcu = cnt.filter(function (x) { return x >= ch.length; }).length / cnt.length, zmax = 0; for (var m = 0; m < 225; m++) zmax = Math.max(zmax, Math.abs(u.asp.z[m]));
    var Pmx = u.pl.mx.filter(function (x) { return x >= zmax; }).length / u.pl.mx.length;
    var modoTxt = u.modo === "simetrica" ? t.m_sim : (u.modo === "despues" ? t.m_des : t.m_no);
    var av = $("cielo_aviso"); av.style.display = "none"; av.textContent = "";
    if (u.dom !== "sismo") { av.style.display = "block"; av.textContent = t.avisoEst; }
    else if (ch.length > p975 + 3 && Pcu < 0.05) { av.style.display = "block"; av.textContent = t.avisoAlto; }
    $("cielo_resumen").textContent = t.resumen(fmt(u.n), fmt(u.bruto), modoTxt);
    // rueda de cartas
    var cont = $("cielo_rueda"); cont.innerHTML = ""; var W = 740, H = 560, cx = 250, cy = 280, r0 = 56, dr = 16.5, vmax = 2.6, svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": t.aRueda }); svg.style.maxWidth = "740px";
    var nSec = 36, fuera = 0, pos = 0, neg = 0;
    for (var p = 0; p < 10; p++) for (var s = 0; s < nSec; s++) {
      var z = u.sec.Z[p][s]; if (Math.abs(z) > 1.96) { fuera++; if (z > 0) pos++; else neg++; }
      var a0 = s * 10, a1 = a0 + 10, ri = r0 + p * dr, ro = ri + dr, P1 = pol(cx, cy, ri, a0), P2 = pol(cx, cy, ro, a0), P3 = pol(cx, cy, ro, a1), P4 = pol(cx, cy, ri, a1);
      svg.appendChild(el("path", { d: "M" + P1 + " L" + P2 + " A" + ro + " " + ro + " 0 0 1 " + P3 + " L" + P4 + " A" + ri + " " + ri + " 0 0 0 " + P1 + "Z", fill: colorZ(z, vmax), stroke: "#fff", "stroke-opacity": ".3", "stroke-width": ".4" }, null)).appendChild(el("title", {}, PL[p] + " · " + (s * 10) + "°–" + (s * 10 + 10) + "° · z = " + dec(z, 2)));
    }
    for (var k = 0; k < 12; k++) {
      var Pa = pol(cx, cy, r0, k * 30), Pb = pol(cx, cy, r0 + 10 * dr + 4, k * 30), Pg = pol(cx, cy, r0 + 10 * dr + 20, k * 30 + 15);
      svg.appendChild(el("line", { x1: Pa[0], y1: Pa[1], x2: Pb[0], y2: Pb[1], stroke: "#007a60", "stroke-width": "1.8" }));
      svg.appendChild(el("text", { x: Pg[0], y: Pg[1], "text-anchor": "middle", "dominant-baseline": "central", "font-size": "17", fill: "#007a60" }, Cielo.SIGNOS[k]));
    }
    for (var q = 0; q < 10; q++) svg.appendChild(el("text", { x: 530, y: cy + (q - 4.5) * 24, "font-size": "13", fill: INK, "dominant-baseline": "central" }, Cielo.GLIFOS[q] + "  " + PL[q]));
    svg.appendChild(el("text", { x: 530, y: 118, "font-size": "12", fill: "#007a60", "font-weight": "700" }, t.anillo1));
    svg.appendChild(el("text", { x: 530, y: 134, "font-size": "12", fill: "#007a60", "font-weight": "700" }, t.anillo2));
    cont.appendChild(svg);
    var zmaxS = 0, pS = 0, sS = 0; for (var p2 = 0; p2 < 10; p2++) for (var s2 = 0; s2 < nSec; s2++) { var zz = Math.abs(u.sec.Z[p2][s2]); if (zz > zmaxS) { zmaxS = zz; pS = p2; sS = s2; } }
    $("cielo_rueda_txt").textContent = t.rueda(fuera, pos, neg, dec(zmaxS, 2), PL[pS], sS * 10, sS * 10 + 10);
    // rueda de aspectos
    var c2 = $("cielo_aspectos"); c2.innerHTML = ""; var R = 150, cx2 = 190, cy2 = 190, sv2 = el("svg", { viewBox: "-40 0 460 390", width: "100%", role: "img", "aria-label": t.aAsp }); sv2.style.maxWidth = "460px";
    sv2.appendChild(el("circle", { cx: cx2, cy: cy2, r: R, fill: "none", stroke: "#007a60", "stroke-width": "2" }));
    var pts = PL.map(function (_, i) { var a = (-90 + 36 * i) * Math.PI / 180; return [cx2 + R * Math.cos(a), cy2 + R * Math.sin(a)]; });
    ch.slice().sort(function (a, b) { return Math.abs(a.z) - Math.abs(b.z); }).forEach(function (c) {
      var P = pts[c.i], Q = pts[c.j], mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, cxp = cx2 + (mx - cx2) * 0.35, cyp = cy2 + (my - cy2) * 0.35, col = c.z > 0 ? AZUL : NAR;
      var pa = el("path", { d: "M" + P + " Q" + cxp + " " + cyp + " " + Q, fill: "none", stroke: col, "stroke-width": (1.5 + Math.abs(c.z) / 1.5).toFixed(1), "stroke-linecap": "round", opacity: ".9" }); pa.appendChild(el("title", {}, PL[c.i] + " " + Cielo.ASP_GLIFO[c.a] + " " + PL[c.j] + " · z = " + dec(c.z, 2))); sv2.appendChild(pa);
      var mxp = 0.25 * P[0] + 0.5 * cxp + 0.25 * Q[0], myp = 0.25 * P[1] + 0.5 * cyp + 0.25 * Q[1];
      sv2.appendChild(el("circle", { cx: mxp, cy: myp, r: 10, fill: "#fff", stroke: col, "stroke-width": "2" })); sv2.appendChild(el("text", { x: mxp, y: myp + 1, "text-anchor": "middle", "dominant-baseline": "central", "font-size": "12", fill: INK }, Cielo.ASP_GLIFO[c.a]));
    });
    pts.forEach(function (P, i) { sv2.appendChild(el("circle", { cx: P[0], cy: P[1], r: 6, fill: "#005743" })); var a = (-90 + 36 * i) * Math.PI / 180; sv2.appendChild(el("text", { x: cx2 + (R + 26) * Math.cos(a), y: cy2 + (R + 26) * Math.sin(a), "text-anchor": "middle", "dominant-baseline": "central", "font-size": "11", fill: "#005743" }, Cielo.GLIFOS[i] + " " + PL[i])); });
    c2.appendChild(sv2);
    // histograma de placebos
    var c3 = $("cielo_hist"); c3.innerHTML = ""; var topeP = Math.max.apply(null, cnt), fuera_escala = ch.length > topeP + 4, mxv = (fuera_escala ? topeP : Math.max(topeP, ch.length)) + 2, h = new Array(mxv + 1).fill(0); cnt.forEach(function (x) { h[x]++; }); var hm = Math.max.apply(null, h), sv3 = el("svg", { viewBox: "0 0 420 250", width: "100%", role: "img", "aria-label": t.aHist }); sv3.style.maxWidth = "420px";
    var bw = 380 / (mxv + 1);
    for (var i2 = 0; i2 <= mxv; i2++) { var hh = 150 * h[i2] / hm, dentro = i2 >= p25 && i2 <= p975; sv3.appendChild(el("rect", { x: 20 + i2 * bw + 1, y: 190 - hh, width: bw - 2, height: hh, fill: dentro ? "#9fb9b2" : "#cfd9d6" })); if (i2 % 2 === 0 || mxv < 12) sv3.appendChild(el("text", { x: 20 + i2 * bw + bw / 2, y: 206, "text-anchor": "middle", "font-size": "10", fill: MUT }, String(i2))); }
    if (fuera_escala) { sv3.appendChild(el("text", { x: 400, y: 60, "text-anchor": "end", "font-size": "12", fill: AZUL, "font-weight": "700" }, t.real(ch.length) + " →")); sv3.appendChild(el("text", { x: 400, y: 76, "text-anchor": "end", "font-size": "10", fill: AZUL }, t.fuera)); }
    else { sv3.appendChild(el("line", { x1: 20 + ch.length * bw + bw / 2, x2: 20 + ch.length * bw + bw / 2, y1: 24, y2: 190, stroke: AZUL, "stroke-width": "3" })); sv3.appendChild(el("text", { x: 24 + ch.length * bw + bw / 2, y: 34, "font-size": "12", fill: AZUL, "font-weight": "700" }, t.real(ch.length))); }
    sv3.appendChild(el("text", { x: 210, y: 232, "text-anchor": "middle", "font-size": "11", fill: MUT }, t.ejeX));
    c3.appendChild(sv3);
    var tt = $("cielo_aspectos_txt"); tt.innerHTML = "";
    var l1 = document.createElement("p"); var b1 = document.createElement("b"); b1.textContent = t.asp1(ch.length, dec(media, 1), Math.round(p25), Math.round(p975), pct(Pcu, cnt.length), dec(zmax, 2), pct(Pmx, cnt.length)); l1.appendChild(b1); tt.appendChild(l1);
    var l2 = document.createElement("p"); l2.className = "small muted"; l2.textContent = t.asp2(fmt(u.n), dec(Cielo.piso(u.n, 0.1), 2), fmt(u.N)); tt.appendChild(l2);
    var tb = $("cielo_tabla").tBodies[0]; tb.innerHTML = "";
    ch.forEach(function (c) { var m2 = c.q * 5 + c.a, tr = tb.insertRow(), vals = [PL[c.i] + " " + Cielo.ASP_GLIFO[c.a] + " " + PL[c.j], AN[c.a], fmt(u.asp.obs[m2]), fmt(u.asp.esp[m2], 1), (c.z > 0 ? "+" : "") + dec(c.z, 2)]; vals.forEach(function (v) { tr.insertCell().textContent = v; }); });
    if (!ch.length) { var tr0 = tb.insertRow(), cc = tr0.insertCell(); cc.colSpan = 5; cc.textContent = t.ninguna; }
  }

  /* ---------- descargar las 225 comparaciones ---------- */
  function csv() {
    if (!ultimo) return; var PL = PLAN.en, AN = ASPN.en, f = ["body_a,body_b,aspect,events,expected,z,outside_1.96"], u = ultimo, q, a;
    for (q = 0; q < 45; q++) for (a = 0; a < 5; a++) { var m = q * 5 + a, pr = Cielo.PARES[q]; f.push([PL[pr[0]], PL[pr[1]], AN[a], u.asp.obs[m], u.asp.esp[m].toFixed(2), u.asp.z[m].toFixed(3), Math.abs(u.asp.z[m]) > 1.96 ? 1 : 0].join(",")); }
    var blob = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + f.join("\n")), ar = document.createElement("a");
    ar.download = "cielo_comparaciones_" + u.dom + "_n" + u.n + ".csv"; ar.href = blob; document.body.appendChild(ar); ar.click(); ar.remove();
  }

  function ejemplo() {
    var d = $("cielo_dominio"); if (!d.options.length) iniciar(); d.value = "sismo"; alCambiarDominio();
    $("cielo_vmin").value = 6; $("cielo_y0").value = 2000; $("cielo_y1").value = 2024; $("cielo_declust").value = "simetrica"; $("cielo_modo").value = "dias"; $("cielo_placebos").value = "100";
    calcular(); var m = $("cielo_msg"); if (m && m.scrollIntoView) m.scrollIntoView({ block: "center" });
  }
  new MutationObserver(function () { if (ultimo && $("cielo_res").style.display !== "none") dibujar(ultimo); var d = $("cielo_dominio"); if (d && d.value !== "sismo") $("cielo_nota_dom").textContent = tx().notaDom; }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.cieloInit = iniciar; window.cieloEjemplo = ejemplo; window.cieloCalcular = calcular; window.cieloAlCambiarDominio = alCambiarDominio; window.cieloCSV = csv;
})();
