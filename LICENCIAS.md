# Licencias de este repositorio

Este proyecto usa **dos licencias** propias, una para cada tipo de material, más las condiciones de los datos de terceros y la reserva del logo.

**Titular de los derechos:** David Auresy Serrano Suárez, con afiliación a la Fundación Invesciencias.

| Qué | Licencia | Qué significa |
|---|---|---|
| **Código**: `*.py`, `*.html`, `*.js` propios, plantillas de `.github/` | [MIT](LICENSE) | Se puede usar, copiar, modificar y distribuir, también en proyectos propios o comerciales. Hay que conservar el aviso de copyright. Sin garantía. |
| **Textos, figuras y tablas propias**: `README.md`, `docs/`, `laboratorio/LEEME.md`, documentos de metodología y preregistros, y las tablas de `resultados/` | [CC BY 4.0](LICENSE-CC-BY-4.0.txt) ([resumen](https://creativecommons.org/licenses/by/4.0/deed.es)) | Se puede copiar, adaptar y compartir, incluso con fines comerciales, **siempre que se dé crédito** (ver abajo), se enlace la licencia y se indique si se hicieron cambios. |
| **Datos de terceros** | **La licencia o los términos originales de cada fuente** | Esta licencia **no** cambia las condiciones de esos datos. Ver la tabla de abajo. |
| **Citas de otras obras** (por ejemplo, la *Teoría Científica de la Cosmobiología*, 1976, y los artículos citados) | Derechos de sus autores | Las citas breves se incluyen con fines académicos y de referencia; no quedan bajo CC BY. |
| **Logo y nombre de Invesciencias** (`logo-invesciencias.png`, favicon e íconos) | **Propiedad de la Fundación Invesciencias. Todos los derechos reservados.** | Se muestran en este sitio solo para identificarlo. No se pueden reutilizar, modificar ni usar para sugerir respaldo de la fundación sin su permiso. La licencia MIT y la CC BY **no** cubren el logo. |

## Cómo citar (atribución exigida por CC BY)

> Serrano Suárez, D. A. (2026). *Cosmobiología — plataforma de análisis estadístico falseable* [Software y textos]. Fundación Invesciencias. https://github.com/Invesciencias/Cosmobiologia · Código bajo licencia MIT; textos bajo CC BY 4.0.

Para citar el programa de investigación, usa también:
> Serrano, D. (2026). El cosmos que habitamos: fuerzas lunares, geomagnéticas y circadianas — evidencia escalonada y un programa de investigación desde Invesciencias. *Circular Astronómica RAC*, N.º 1027, septiembre 2026, pp. 8–11.

## Fuentes y créditos de los datos

Los eventos de `data.js`, `features.js`, `datos/` y `resultados/` vienen de catálogos públicos. Cada fuente tiene sus propias condiciones; **esta licencia no las modifica**. Aquí se indica de dónde sale cada conjunto y cómo citarlo.

| Fuente | Qué contiene | Dónde conseguirla | Cómo citarla | Dónde aparece aquí |
|---|---|---|---|---|
| **USGS ComCat** | Sismos | [earthquake.usgs.gov](https://earthquake.usgs.gov/earthquakes/search/) | U.S. Geological Survey, Earthquake Hazards Program, *ANSS Comprehensive Earthquake Catalog (ComCat)* | `data.js` (13.870 eventos) |
| **NOAA NCEI** | Sismos significativos | [ncei.noaa.gov](https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/earthquakes) | NOAA National Centers for Environmental Information, *Significant Earthquake Database* | `data.js` (4.080) |
| **NOAA HURDAT2** | Huracanes del Atlántico y Pacífico | [nhc.noaa.gov/data](https://www.nhc.noaa.gov/data/#hurdat) | Landsea, C. W. y Franklin, J. L. (2013), *Atlantic Hurricane Database Uncertainty and Presentation of a New Database Format*, Monthly Weather Review | `data.js` (2.494) |
| **NASA DONKI** | Tormentas solares y geomagnéticas | [ccmc.gsfc.nasa.gov/tools/DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | NASA CCMC, *Space Weather Database of Notifications, Knowledge, Information (DONKI)* | `data.js` (3.469) |
| **NASA EONET** | Eventos naturales (inundaciones, sequías) | [eonet.gsfc.nasa.gov](https://eonet.gsfc.nasa.gov/) | NASA, *Earth Observatory Natural Event Tracker (EONET)* | `data.js` (750) |
| **Catálogo GCMT** | Mecanismos focales, Mw ≥ 6 | [globalcmt.org](https://www.globalcmt.org/) | Dziewonski, A. M., Chou, T.-A. y Woodhouse, J. H. (1981), *JGR*, 86(B4), 2825–2852; Ekström, G., Nettles, M. y Dziewoński, A. M. (2012), *PEPI*, 200–201, 1–9 | `datos/eventos_gcmt_*.csv`, `resultados/` |
| **EM-DAT** | Desastres naturales: inundaciones, tormentas, sequías, incendios, erupciones, temperaturas extremas, deslizamientos y otros | [emdat.be](https://www.emdat.be/) | EM-DAT: The Emergency Events Database, Université catholique de Louvain (UCLouvain), CRED, D. Guha-Sapir, www.emdat.be, Bruselas, Bélgica | `data.js` (9.840 eventos) |
| **Lichess** | Partidas de ajedrez de torneos (Campeonato Mundial, Candidatos, Norway Chess) | [database.lichess.org](https://database.lichess.org/) · [lichess.org/broadcast](https://lichess.org/broadcast) | Lichess.org, base de datos abierta de partidas (CC0) | `datos/chess_games/` |
| **USGS (Oklahoma)** | Sismos de Oklahoma con posiciones astronómicas calculadas | [earthquake.usgs.gov](https://earthquake.usgs.gov/earthquakes/search/) | Igual que USGS ComCat | `datos/oklahoma_game_data.json` |

- Los datos de **USGS, NOAA y NASA** son de organismos públicos de EE. UU. y de uso libre con cita de la fuente.
- Los datos de **EM-DAT** se rigen por sus términos de uso (registro y uso no comercial; la redistribución de la base está restringida). Para uso comercial o para volver a distribuirlos, consulta [emdat.be](https://www.emdat.be/) y sus condiciones.
- Los datos de **Lichess** se publican con licencia CC0 (dominio público).
- Las **tablas de resultados** calculadas por este proyecto (z, RR, q de FDR) quedan bajo CC BY 4.0, aunque partan de datos de terceros.

Antes de volver a publicar cualquier archivo de datos, revisa los términos de su fuente.
