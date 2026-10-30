# Dónde conseguir los datos para ampliar dominios

Para entrar a la plataforma, un evento necesita: **fecha + hora + latitud/longitud**
(la hora exacta es imprescindible para las casas y los ángulos Asc/MC).

---

## 🧑‍🔬 Natalidad / efecto Gauquelin  ← el más recomendado para Invesciencias

El "efecto Marte" de Gauquelin (planeta en ciertos **sectores diurnos** —tras salir
o culminar— en personas eminentes) es la afirmación astro-estadística más estudiada
y debatida. Es el mejor segundo dominio porque la plataforma **ya calcula** casas y
ángulos. Requiere **hora de nacimiento exacta**, que es lo difícil de conseguir.

| Fuente | Qué tiene | Acceso |
|--------|-----------|--------|
| **AstroDatabank** (Astrodienst) | Miles de cartas con hora y **fiabilidad Rodden** (busca calidad **AA** = del registro civil). Incluye muchos registros de Gauquelin. | `astro.com/astro-databank`. Hubo una versión liberada (volcados XML/SQL circulan en GitHub, busca "astrodatabank"). |
| **Datos originales de Gauquelin (LERRCP)** | Las series originales de deportistas, científicos, etc., con hora y lugar. | Publicadas por el *Laboratoire d'Étude des Relations entre Rythmes Cosmiques et Psychophysiologiques*. Algunas digitalizadas por escépticos (Comité Para / CSICOP) para sus réplicas; pídelas citando investigación. |
| **Réplicas publicadas** | Tablas de las réplicas (CSICOP 1979, Comité Para, Ertel) suelen incluir los datos crudos en apéndices. | Artículos en *Journal of Scientific Exploration*, *Skeptical Inquirer*, *Correlation*. |

> Empieza pidiendo un **subconjunto AA de AstroDatabank por profesión** (p. ej.
> deportistas de élite vs. población general) — replica el diseño clásico de Gauquelin.
> Cuando tengas el CSV con hora/lugar, lo conviertes al esquema y lo cargas.

---

## 🌋 Naturales (fáciles, datos abiertos con hora exacta)

| Dominio | Fuente | Acceso |
|---------|--------|--------|
| **Sismos** (ya cargado) | USGS FDSN | `earthquake.usgs.gov/fdsnws/event/1/` · ISC `isc.ac.uk` · EMSC `seismicportal.eu` |
| **Erupciones volcánicas** | Smithsonian GVP | `volcano.si.edu` (descarga del Volcanoes of the World) |
| **Huracanes / ciclones** | NOAA HURDAT2 | `nhc.noaa.gov/data/#hurdat` |
| **Tornados / granizo** | NOAA Storm Events | `ncdc.noaa.gov/stormevents` |
| **Inundaciones** | Dartmouth Flood Observatory | `floodobservatory.colorado.edu` |
| **Desastres (multi)** | EM-DAT | `emdat.be` (registro gratis) — ojo: a veces solo fecha, no hora |
| **Clima espacial** (fulguraciones, tormentas geomagnéticas) | NOAA SWPC · NASA | `swpc.noaa.gov` · `hesperia.gsfc.nasa.gov` |

---

## 🫀 Biomédicos (alto interés, acceso restringido por privacidad)

| Dominio | Fuente | Acceso |
|---------|--------|--------|
| **Infartos / arritmias** | MIMIC-IV, PhysioNet | `physionet.org` — **acceso acreditado** (curso de ética + solicitud). Tiene marca temporal de eventos. |
| **Crisis epilépticas / EEG** | CHB-MIT, PhysioNet | `physionet.org` |
| **Mortalidad (fecha, a veces hora)** | CDC WONDER · OMS | `wonder.cdc.gov` · `who.int/data/mortality` |
| **Ingresos psiquiátricos / urgencias** | datasets hospitalarios abiertos | varía por país; buscar "open hospital admissions dataset" |

> ⚠ Para datos de personas: usar solo fuentes **anonimizadas o con consentimiento**,
> y conseguir aprobación ética (IRB/comité) antes de publicar. La hora de nacimiento o
> de inicio del evento debe estar registrada para que el análisis tenga sentido.

---

## 🛩️ Sociales / otros (fecha-hora-lugar precisos, muestras grandes)

| Dominio | Fuente | Acceso |
|---------|--------|--------|
| **Accidentes aéreos** | NTSB · Aviation Safety Network | `ntsb.gov` · `aviation-safety.net` |
| **Atentados / conflictos** | GTD · ACLED | `start.umd.edu/gtd` · `acleddata.com` (registro) |
| **Crashes de mercado** | Yahoo Finance · FRED | `finance.yahoo.com` · `fred.stlouisfed.org` |

---

## Cómo cargar un dominio nuevo

1. Consigue un CSV con al menos: identificador, fecha-hora (con zona o UTC), lat, lon.
2. Mapéalo al esquema (`event_id, domain, subtype, datetime_utc, latitude, longitude,
   place, value, value_kind, source`). Para sismos USGS ya existe `convertir_sismos.py`
   como plantilla; te puedo hacer el conversor del dominio que elijas.
3. Cárgalo en `index.html` (pegar/subir) o súbelo a Supabase.
4. Corre `nullmodel.py` (para natalidad usaremos el **test de sectores de Gauquelin**,
   no aspectos) y regenera `data.js` / `features.js`.
