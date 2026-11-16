/* guia_datos.js — «Cómo traer tus propios datos»: de Excel o LibreOffice a la prueba, en español, inglés y francés.
   Inserta la guía al inicio de «Captura de eventos» y ofrece una plantilla y un ejemplo en CSV. */
(function () {
  "use strict";
  var COLS = ["event_id", "domain", "subtype", "datetime_utc", "latitude", "longitude", "place", "value", "value_kind", "source", "extra_json"];
  var PLANTILLA = COLS.join(",") + "\n" + ["mi_001", "mi_dominio", "", "2023-04-22T08:23:42Z", "-5.2697", "125.595", "ciudad o región", "6.0", "magnitud", "mi fuente", ""].join(",") + "\n";
  var EJEMPLO = COLS.join(",") + "\n" + [
    ["ej_01", "ejemplo", "", "2019-03-14T04:12:00Z", "4.71", "-74.07", "EJEMPLO inventado", "3.2", "severidad", "datos inventados para practicar", ""],
    ["ej_02", "ejemplo", "", "2019-07-02T17:45:30Z", "6.25", "-75.57", "EJEMPLO inventado", "4.1", "severidad", "datos inventados para practicar", ""],
    ["ej_03", "ejemplo", "", "2020-01-21T09:05:10Z", "7.12", "-73.12", "EJEMPLO inventado", "2.8", "severidad", "datos inventados para practicar", ""],
    ["ej_04", "ejemplo", "", "2020-11-08T22:30:00Z", "3.43", "-76.52", "EJEMPLO inventado", "5.0", "severidad", "datos inventados para practicar", ""],
    ["ej_05", "ejemplo", "", "2021-05-19T13:20:45Z", "10.96", "-74.78", "EJEMPLO inventado", "3.9", "severidad", "datos inventados para practicar", ""],
    ["ej_06", "ejemplo", "", "2022-09-30T06:00:00Z", "4.71", "-74.07", "EJEMPLO inventado", "4.4", "severidad", "datos inventados para practicar", ""]].map(function (f) { return f.join(","); }).join("\n") + "\n";
  var PY = 'import pandas as pd\n\nd = pd.read_excel("mis_datos.xlsx")          # o pd.read_csv("mis_datos.csv")\n# hora local -> UTC (cambia la zona por la tuya, p. ej. "America/Bogota", "Europe/Madrid")\nd["datetime_utc"] = (pd.to_datetime(d["fecha_hora_local"]).dt.tz_localize("America/Bogota")\n                       .dt.tz_convert("UTC").dt.strftime("%Y-%m-%dT%H:%M:%SZ"))\nd = d.rename(columns={"lat": "latitude", "lon": "longitude"})\nd["domain"] = "mi_dominio"\nd[["datetime_utc", "latitude", "longitude", "domain"]].to_csv("tu_catalogo.csv", index=False)';
  var CMD = "pip install -r codigo/requirements.txt\npython codigo/nullmodel.py tu_catalogo.csv 200";

  var X = {
    es: {
      t: "Cómo traer tus propios datos (de Excel o LibreOffice a la prueba)",
      intro: "Necesitas una tabla con <b>una fila por evento</b>. Lo mínimo son tres columnas: la fecha y hora en <b>UTC</b>, la latitud y la longitud. Lo demás es opcional. Tus datos se quedan en <b>tu navegador</b>; solo salen si tú conectas la nube compartida.",
      b1: "Descargar la plantilla (CSV)", b2: "Descargar un ejemplo con 6 filas inventadas",
      h1: "1. Arma la hoja con estas columnas",
      th: ["Columna", "Qué es", "Ejemplo", "¿Hace falta?"],
      filas: [["datetime_utc", "fecha y hora del evento en UTC, formato ISO", "2023-04-22T08:23:42Z", "sí"], ["latitude", "grados decimales, norte +, sur −, con punto decimal", "-5.2697", "sí (para sismos, casas y réplicas)"], ["longitude", "grados decimales, este +, oeste −", "125.595", "sí (igual)"], ["domain", "tu tipo de evento, una sola palabra", "infarto", "recomendada"], ["value", "magnitud o severidad", "6.0", "opcional"], ["event_id, place, source", "identificador, lugar y fuente", "mi_001", "opcionales"]],
      h2: "2. Pasa la hora local a UTC",
      p2: "Si tu fecha y hora están en hora local, hay que restarles el desfase respecto de UTC (Colombia: −5; España en invierno: +1). Con la fecha y hora local en A2 y el desfase en B2:",
      f_en: "Excel o LibreOffice en inglés", f_es: "Excel o LibreOffice en español",
      p2b: "La página también acepta «2023-04-22 08:23:42» y «22/04/2023 08:23» (día/mes/año), pero los toma <b>como si ya fueran UTC</b>. Si solo tienes la fecha, la página usa las 12:00; entonces las casas y la Luna no tienen sentido, pero los planetas lentos sí.",
      h3: "3. Guarda como CSV",
      p3: "<b>Excel:</b> Archivo → Guardar como → «CSV UTF-8 (delimitado por comas)». <b>LibreOffice:</b> Archivo → Guardar como → «Texto CSV (.csv)» → marca «Editar configuración de filtros» → separador «,» y codificación UTF-8. Usa <b>punto decimal</b> en la latitud, la longitud y el valor (si quedan con coma, la página las corrige).",
      h4: "4. Súbelo aquí",
      p4: "Más abajo, en «Carga masiva» pulsa <b>Subir archivo CSV</b> (o pega las filas). La página te dice cuántas filas entraron y cuántas descartó, y por qué. Si tu fenómeno es global (como las tormentas solares) y no tiene lugar, pon 0 y 0 en latitud y longitud y usa solo los aspectos entre planetas.",
      h5: "5. Haz las pruebas: cuatro caminos",
      ruta: [["Ver dónde están", "Mapa y grilla: la distribución de tus eventos.", "mapa"], ["Explorar el cielo de tus eventos", "Cielo y eventos: elige tu dominio (mínimo 30 eventos) y compara con fechas control y cielos desplazados.", "cielo"], ["Probar una hipótesis en tres compuertas", "Laboratorio: carga tu archivo, mira si podías ver el efecto, si resiste el control y si se repite.", "lab"], ["Análisis completo con Python", "Modelo nulo y corrección FDR sobre todos los rasgos. Conviene para publicar.", ""]],
      py: "Python: de tu Excel al catálogo", cmd: "Python: correr el análisis completo", copiar: "Copiar", copiado: "Copiado ✓",
      h6: "Antes de creer algo",
      lista: ["Con pocos eventos no se puede concluir: busca cientos, y mira el piso de detección.", "Los eventos deben ser independientes: quita réplicas y duplicados, y cuenta una tormenta como un solo evento.", "Escribe y registra tu hipótesis antes de mirar los datos (pestaña «Hipótesis y expansión»).", "Un z alto es una pista, no un hallazgo: repítelo con datos independientes."],
      lab: "El Laboratorio también tiene su propia plantilla y datos de práctica." },
    en: {
      t: "How to bring your own data (from Excel or LibreOffice to the test)",
      intro: "You need a table with <b>one row per event</b>. The minimum is three columns: the date and time in <b>UTC</b>, latitude and longitude. Everything else is optional. Your data stays in <b>your browser</b>; it only leaves if you connect the shared cloud.",
      b1: "Download the template (CSV)", b2: "Download an example with 6 made-up rows",
      h1: "1. Build the sheet with these columns",
      th: ["Column", "What it is", "Example", "Required?"],
      filas: [["datetime_utc", "date and time of the event in UTC, ISO format", "2023-04-22T08:23:42Z", "yes"], ["latitude", "decimal degrees, north +, south −, with a decimal point", "-5.2697", "yes (for earthquakes, houses and replication)"], ["longitude", "decimal degrees, east +, west −", "125.595", "yes (same)"], ["domain", "your kind of event, one word", "heart_attack", "recommended"], ["value", "magnitude or severity", "6.0", "optional"], ["event_id, place, source", "identifier, place and source", "mi_001", "optional"]],
      h2: "2. Convert local time to UTC",
      p2: "If your date and time are in local time, subtract the offset from UTC (Colombia: −5; Spain in winter: +1). With the local date and time in A2 and the offset in B2:",
      f_en: "Excel or LibreOffice in English", f_es: "Excel or LibreOffice in Spanish",
      p2b: "The page also accepts «2023-04-22 08:23:42» and «22/04/2023 08:23» (day/month/year), but it takes them <b>as if they were already UTC</b>. If you only have the date, the page uses 12:00; houses and the Moon then make no sense, but slow planets still do.",
      h3: "3. Save as CSV",
      p3: "<b>Excel:</b> File → Save As → «CSV UTF-8 (comma delimited)». <b>LibreOffice:</b> File → Save As → «Text CSV (.csv)» → tick «Edit filter settings» → separator «,» and UTF-8 encoding. Use a <b>decimal point</b> in latitude, longitude and value (if they come with a comma, the page fixes them).",
      h4: "4. Upload it here",
      p4: "Further down, under «Bulk load», press <b>Upload CSV file</b> (or paste the rows). The page tells you how many rows came in and how many it dropped, and why. If your phenomenon is global (like solar storms) and has no place, put 0 and 0 in latitude and longitude and use only the aspects between planets.",
      h5: "5. Run the tests: four paths",
      ruta: [["See where they are", "Map and grid: the distribution of your events.", "mapa"], ["Explore the sky of your events", "Sky and events: pick your domain (at least 30 events) and compare with control dates and shifted skies.", "cielo"], ["Test a hypothesis through three gates", "Laboratory: load your file, see whether you could see the effect, whether it survives the control and whether it repeats.", "lab"], ["Full analysis with Python", "Null model and FDR correction over all features. Best for publishing.", ""]],
      py: "Python: from your Excel to the catalog", cmd: "Python: run the full analysis", copiar: "Copy", copiado: "Copied ✓",
      h6: "Before believing anything",
      lista: ["With few events you cannot conclude: look for hundreds, and check the detection floor.", "Events must be independent: remove aftershocks and duplicates, and count a storm as a single event.", "Write and register your hypothesis before looking at the data («Hypothesis and expansion» tab).", "A high z is a clue, not a finding: repeat it with independent data."],
      lab: "The Laboratory also has its own template and practice data." },
    fr: {
      t: "Comment apporter vos propres données (d'Excel ou LibreOffice au test)",
      intro: "Il vous faut un tableau avec <b>une ligne par événement</b>. Le minimum est de trois colonnes : la date et l'heure en <b>UTC</b>, la latitude et la longitude. Le reste est facultatif. Vos données restent dans <b>votre navigateur</b> ; elles ne sortent que si vous connectez le nuage partagé.",
      b1: "Télécharger le modèle (CSV)", b2: "Télécharger un exemple de 6 lignes inventées",
      h1: "1. Préparez la feuille avec ces colonnes",
      th: ["Colonne", "Ce que c'est", "Exemple", "Obligatoire ?"],
      filas: [["datetime_utc", "date et heure de l'événement en UTC, format ISO", "2023-04-22T08:23:42Z", "oui"], ["latitude", "degrés décimaux, nord +, sud −, avec un point décimal", "-5.2697", "oui (séismes, maisons et réplication)"], ["longitude", "degrés décimaux, est +, ouest −", "125.595", "oui (idem)"], ["domain", "votre type d'événement, un seul mot", "infarctus", "recommandée"], ["value", "magnitude ou gravité", "6.0", "facultative"], ["event_id, place, source", "identifiant, lieu et source", "mi_001", "facultatives"]],
      h2: "2. Convertissez l'heure locale en UTC",
      p2: "Si votre date et heure sont en heure locale, soustrayez le décalage par rapport à UTC (Colombie : −5 ; Espagne en hiver : +1). Avec la date et l'heure locales en A2 et le décalage en B2 :",
      f_en: "Excel ou LibreOffice en anglais", f_es: "Excel ou LibreOffice en espagnol",
      p2b: "La page accepte aussi « 2023-04-22 08:23:42 » et « 22/04/2023 08:23 » (jour/mois/année), mais les prend <b>comme si elles étaient déjà en UTC</b>. Si vous n'avez que la date, la page utilise 12:00 ; les maisons et la Lune n'ont alors pas de sens, mais les planètes lentes oui.",
      h3: "3. Enregistrez en CSV",
      p3: "<b>Excel :</b> Fichier → Enregistrer sous → « CSV UTF-8 (délimité par des virgules) ». <b>LibreOffice :</b> Fichier → Enregistrer sous → « Texte CSV (.csv) » → cochez « Modifier les paramètres du filtre » → séparateur « , » et encodage UTF-8. Utilisez un <b>point décimal</b> pour la latitude, la longitude et la valeur (avec une virgule, la page les corrige).",
      h4: "4. Chargez-le ici",
      p4: "Plus bas, dans « Chargement en masse », appuyez sur <b>Charger un fichier CSV</b> (ou collez les lignes). La page indique combien de lignes sont entrées et combien ont été écartées, et pourquoi. Si votre phénomène est global (comme les tempêtes solaires) et n'a pas de lieu, mettez 0 et 0 en latitude et longitude et n'utilisez que les aspects entre planètes.",
      h5: "5. Faites les tests : quatre chemins",
      ruta: [["Voir où ils sont", "Carte et grille : la distribution de vos événements.", "mapa"], ["Explorer le ciel de vos événements", "Ciel et événements : choisissez votre domaine (au moins 30 événements) et comparez avec des dates témoins et des ciels décalés.", "cielo"], ["Tester une hypothèse en trois portes", "Laboratoire : chargez votre fichier, voyez si vous pouviez voir l'effet, s'il résiste au contrôle et s'il se répète.", "lab"], ["Analyse complète avec Python", "Modèle nul et correction FDR sur tous les traits. Idéal pour publier.", ""]],
      py: "Python : de votre Excel au catalogue", cmd: "Python : lancer l'analyse complète", copiar: "Copier", copiado: "Copié ✓",
      h6: "Avant de croire quoi que ce soit",
      lista: ["Avec peu d'événements on ne peut pas conclure : cherchez des centaines, et regardez le plancher de détection.", "Les événements doivent être indépendants : retirez répliques et doublons, et comptez une tempête comme un seul événement.", "Écrivez et enregistrez votre hypothèse avant de regarder les données (onglet « Hypothèse et expansion »).", "Un z élevé est une piste, pas une découverte : répétez-le avec des données indépendantes."],
      lab: "Le Laboratoire a aussi son propre modèle et des données d'entraînement." }
  };
  var F_EN = '=TEXT(A2-B2/24,"yyyy-mm-dd")&"T"&TEXT(A2-B2/24,"hh:mm:ss")&"Z"', F_ES = '=TEXTO(A2-B2/24;"aaaa-mm-dd")&"T"&TEXTO(A2-B2/24;"hh:mm:ss")&"Z"';

  function idioma() { var l = document.documentElement.lang || "es"; return X[l] ? l : "es"; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function bloque(titulo, codigo, t) { return '<div class="gd-codigo"><div class="gd-cab"><b>' + esc(titulo) + '</b><button type="button" class="ghost act" data-gd-copiar>' + t.copiar + '</button></div><pre>' + esc(codigo) + "</pre></div>"; }

  function pintar() {
    var cont = document.getElementById("guiaDatos"); if (!cont) return; var t = X[idioma()], h = "";
    h += "<h2>" + t.t + "</h2><p>" + t.intro + '</p><p><button type="button" class="act" data-gd-desc="plantilla">⬇ ' + t.b1 + '</button> <button type="button" class="ghost act" data-gd-desc="ejemplo">⬇ ' + t.b2 + "</button></p>";
    h += "<h3>" + t.h1 + '</h3><div style="overflow-x:auto"><table class="small"><thead><tr>' + t.th.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr></thead><tbody>" + t.filas.map(function (f) { return "<tr><td><code>" + esc(f[0]) + "</code></td><td>" + esc(f[1]) + "</td><td><code>" + esc(f[2]) + "</code></td><td>" + esc(f[3]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    h += "<h3>" + t.h2 + "</h3><p>" + t.p2 + "</p>" + bloque(t.f_en, F_EN, t) + bloque(t.f_es, F_ES, t) + '<p class="small muted">' + t.p2b + "</p>";
    h += "<h3>" + t.h3 + "</h3><p>" + t.p3 + "</p><h3>" + t.h4 + "</h3><p>" + t.p4 + "</p>";
    h += "<h3>" + t.h5 + '</h3><div class="gd-ruta">' + t.ruta.map(function (r, i) { return '<div class="gd-paso"><b>' + (i + 1) + ". " + r[0] + "</b><p>" + r[1] + "</p>" + (r[2] ? '<button type="button" class="ghost act" data-gd-ir="' + r[2] + '">→ ' + r[0] + "</button>" : "") + "</div>"; }).join("") + "</div>";
    h += bloque(t.py, PY, t) + bloque(t.cmd, CMD, t);
    h += "<h3>" + t.h6 + "</h3><ul>" + t.lista.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul><p class="small muted">' + t.lab + "</p>";
    cont.innerHTML = h;
  }
  function descargar(que) {
    var a = document.createElement("a"); a.download = que === "plantilla" ? "plantilla_eventos.csv" : "ejemplo_eventos_inventados.csv";
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + (que === "plantilla" ? PLANTILLA : EJEMPLO)); document.body.appendChild(a); a.click(); a.remove();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-gd-desc],[data-gd-copiar],[data-gd-ir]"); if (!b) return;
    if (b.hasAttribute("data-gd-desc")) descargar(b.getAttribute("data-gd-desc"));
    else if (b.hasAttribute("data-gd-ir")) { var d = b.getAttribute("data-gd-ir"); if (d === "lab") location.href = "laboratorio/index.html"; else { var n = document.querySelector('nav button[data-tab="' + d + '"]'); if (n) n.click(); window.scrollTo({ top: 0, behavior: "smooth" }); } }
    else { var txt = b.closest(".gd-codigo").querySelector("pre").textContent, t = X[idioma()], ok = function () { var v = b.textContent; b.textContent = t.copiado; setTimeout(function () { b.textContent = t.copiar; }, 1500); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok); }
  });
  function iniciar() { pintar(); new MutationObserver(pintar).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  window.guiaDatosPlantilla = descargar;
})();
