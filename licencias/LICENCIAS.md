# Licencias de este repositorio

Este proyecto usa **dos licencias** propias, una para cada tipo de material, más las condiciones de los datos de terceros y la reserva del logo.

**Titular de los derechos:** David Auresy Serrano Suárez, con afiliación a la Fundación Invesciencias.

| Qué | Licencia | Qué significa |
|---|---|---|
| **Código**: `*.py`, `*.html`, `*.js` propios, plantillas de `.github/` | [MIT](../LICENSE) | Se puede usar, copiar, modificar y distribuir, también en proyectos propios o comerciales. Hay que conservar el aviso de copyright. Sin garantía. |
| **Textos, figuras y tablas propias**: `README.md`, `docs/`, `laboratorio/LEEME.md`, documentos de metodología y preregistros, y las tablas de `resultados/` | [CC BY 4.0](LICENSE-CC-BY-4.0.txt) ([resumen](https://creativecommons.org/licenses/by/4.0/deed.es)) | Se puede copiar, adaptar y compartir, incluso con fines comerciales, **siempre que se dé crédito** (ver abajo), se enlace la licencia y se indique si se hicieron cambios. |
| **Datos de terceros** | **La licencia o los términos originales de cada fuente** | Esta licencia **no** cambia las condiciones de esos datos. Ver la tabla de abajo. |
| **Citas de otras obras** (por ejemplo, la *Teoría Científica de la Cosmobiología*, 1976, y los artículos citados) | Derechos de sus autores | Las citas breves se incluyen con fines académicos y de referencia; no quedan bajo CC BY. |
| **Logo y nombre de Invesciencias** (`imagenes/`: logo, favicon e íconos) | **Propiedad de la Fundación Invesciencias. Todos los derechos reservados.** | Se muestran en este sitio solo para identificarlo. No se pueden reutilizar, modificar ni usar para sugerir respaldo de la fundación sin su permiso. La licencia MIT y la CC BY **no** cubren el logo. |

## Cómo citar (atribución exigida por CC BY)

> Serrano Suárez, D. A. (2026). *Cosmobiología — plataforma de análisis estadístico falseable* [Software y textos]. Fundación Invesciencias. https://github.com/Invesciencias/Cosmobiologia · Código bajo licencia MIT; textos bajo CC BY 4.0.

Para citar el programa de investigación, usa también:
> Serrano, D. (2026). El cosmos que habitamos: fuerzas lunares, geomagnéticas y circadianas — evidencia escalonada y un programa de investigación desde Invesciencias. *Circular Astronómica RAC*, N.º 1027, septiembre 2026, pp. 8–11.

## Fuentes y créditos de los datos

Los eventos de `js/data.js`, `js/features.js`, `datos/` y `resultados/` vienen de catálogos públicos. Cada fuente tiene sus propias condiciones; **esta licencia no las modifica**. Aquí se indica de dónde sale cada conjunto y cómo citarlo.

| Fuente | Qué contiene | Dónde conseguirla | Cómo citarla | Dónde aparece aquí |
|---|---|---|---|---|
| **USGS ComCat** | Sismos | [earthquake.usgs.gov](https://earthquake.usgs.gov/earthquakes/search/) | U.S. Geological Survey, Earthquake Hazards Program, *ANSS Comprehensive Earthquake Catalog (ComCat)* | `js/data.js` (13.870 eventos) |
| **NOAA NCEI** | Sismos significativos | [ncei.noaa.gov](https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/earthquakes) | NOAA National Centers for Environmental Information, *Significant Earthquake Database* | `js/data.js` (4.080) |
| **NOAA HURDAT2** | Huracanes del Atlántico y Pacífico | [nhc.noaa.gov/data](https://www.nhc.noaa.gov/data/#hurdat) | Landsea, C. W. y Franklin, J. L. (2013), *Atlantic Hurricane Database Uncertainty and Presentation of a New Database Format*, Monthly Weather Review | `js/data.js` (2.494) |
| **NASA DONKI** | Tormentas solares y geomagnéticas | [ccmc.gsfc.nasa.gov/tools/DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | NASA CCMC, *Space Weather Database of Notifications, Knowledge, Information (DONKI)* | `js/data.js` (3.469) |
| **NASA EONET** | Eventos naturales (inundaciones, sequías) | [eonet.gsfc.nasa.gov](https://eonet.gsfc.nasa.gov/) | NASA, *Earth Observatory Natural Event Tracker (EONET)* | `js/data.js` (750) |
| **Catálogo GCMT** | Mecanismos focales, Mw ≥ 6 | [globalcmt.org](https://www.globalcmt.org/) | Dziewonski, A. M., Chou, T.-A. y Woodhouse, J. H. (1981), *JGR*, 86(B4), 2825–2852; Ekström, G., Nettles, M. y Dziewoński, A. M. (2012), *PEPI*, 200–201, 1–9 | `datos/eventos_gcmt_*.csv`, `resultados/` |
| **EM-DAT** | Desastres naturales: inundaciones, tormentas, sequías, incendios, erupciones, temperaturas extremas, deslizamientos y otros | [emdat.be](https://www.emdat.be/) | Delforge, D., Wathelet, V., Below, R., Lanfredi Sofia, C., Tonnelier, M., van Loenhout, J. A. F. y Speybroeck, N. (2025). *EM-DAT: The Emergency Events Database*. International Journal of Disaster Risk Reduction, 124, 105509. https://doi.org/10.1016/j.ijdrr.2025.105509 · *EM-DAT, UCLouvain / CRED, Bruselas, Bélgica, consultada el 2026-06-27, https://www.emdat.be/* | **Los eventos no se redistribuyen aquí.** Solo se publican resultados agregados del análisis |
| **Lichess** | Partidas de ajedrez de torneos (Campeonato Mundial, Candidatos, Norway Chess) | [lichess.org/broadcast](https://lichess.org/broadcast) · [database.lichess.org](https://database.lichess.org/) | Lichess.org, base de datos abierta de partidas (CC0) | `datos/chess_games/` |
| **USGS (Oklahoma)** | Sismos de Oklahoma con posiciones astronómicas calculadas | [earthquake.usgs.gov](https://earthquake.usgs.gov/earthquakes/search/) | Igual que USGS ComCat | `datos/oklahoma_game_data.json` |

- Los datos de **USGS, NOAA y NASA** son de organismos públicos de EE. UU. y de uso libre con cita de la fuente.
- **EM-DAT** (UCLouvain / CRED) es de acceso gratuito para instituciones académicas y de investigación sin ánimo de lucro, tras aceptar sus [condiciones de uso](https://doc.emdat.be/docs/legal/terms-of-use/). Esas condiciones **no permiten redistribuir la base ni una parte sustancial, ni crear bases derivadas**. Por eso este repositorio **no incluye los eventos individuales de EM-DAT**: el análisis los usó (descarga del 27 de junio de 2026) y aquí solo se publican resultados agregados, con la cita oficial de [su política de atribución](https://doc.emdat.be/docs/legal/citation-policy/). Si necesitas esos datos, obtenlos directamente en [public.emdat.be](https://public.emdat.be/).
- Los datos de **Lichess** se publican con licencia CC0 (dominio público).
- Las **tablas de resultados** calculadas por este proyecto (z, RR, q de FDR) quedan bajo CC BY 4.0, aunque partan de datos de terceros.

### Procedencia exacta de cada conjunto

Cómo se obtuvo cada fuente, para poder reproducirla. Las fechas son las de los archivos de descarga del proyecto.

| Conjunto | Cómo se obtuvo | Detalle |
|---|---|---|
| **USGS ComCat** | API FDSN `https://earthquake.usgs.gov/fdsnws/event/1/query` | Sismos de magnitud ≥ 6 de 1900 a 2023 en `js/data.js` |
| **NOAA NCEI** | API HazEL del NGDC: `https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes` | Base de sismos significativos |
| **NOAA HURDAT2** | Archivos de texto del NHC: `hurdat2-1851-2023-051124.txt` (Atlántico) y `hurdat2-nepac-1949-2023-042624.txt` (Pacífico nororiental), en `https://www.nhc.noaa.gov/data/hurdat/` | Descarga de junio de 2026 |
| **NASA DONKI** | API `https://api.nasa.gov/DONKI` | Descarga de junio de 2026 |
| **NASA EONET** | API v3 `https://eonet.gsfc.nasa.gov/api/v3/events` | 750 eventos; descarga de junio de 2026 |
| **GCMT** | Catálogo del proyecto Global CMT (`https://www.globalcmt.org/`), formato NDK | 6.035 sismos Mw ≥ 6, 1976–2026; mecanismo clasificado con Frohlich (1992) |
| **EM-DAT** | Descarga manual en `https://public.emdat.be` (requiere cuenta gratuita), archivo Excel hoja «EM-DAT Data» | 9.840 eventos usados en el análisis; descarga del 27 de junio de 2026. No se redistribuyen en este repositorio |
| **Lichess** | API pública de transmisiones (*broadcast*) de `https://lichess.org`, partidas en PGN con la hora UTC de cada jugada | El análisis usa 348 partidas de 7 torneos; este repositorio incluye 20 de Candidatos 2024, Norway Chess 2024 y 2025 y los Campeonatos Mundiales FIDE 2021 y 2023 |

Antes de volver a publicar cualquier archivo de datos, revisa los términos de su fuente.
