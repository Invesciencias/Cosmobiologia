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

## Datos de terceros que contiene el repositorio

Los eventos de `data.js`, `features.js`, `datos/` y `resultados/` vienen de catálogos públicos. Cada fuente tiene sus propias condiciones; esta tabla resume cómo se tratan aquí.

| Fuente | Dónde aparece | Condiciones (resumen) | Estado |
|---|---|---|---|
| **USGS ComCat** (sismos) | `data.js` (13.870 eventos), `features.js` | Datos del gobierno de EE. UU., de uso libre; se pide citar a la fuente | Se mantiene |
| **NOAA NCEI** (sismos significativos) | `data.js` (4.080) | Datos abiertos de NOAA; se pide citar | Se mantiene |
| **NOAA HURDAT2** (huracanes) | `data.js` (2.494) | Datos abiertos de NOAA; se pide citar | Se mantiene |
| **NASA DONKI** (tormentas solares) | `data.js` (3.469) | Datos abiertos de NASA; se pide citar | Se mantiene |
| **NASA EONET** (eventos naturales) | `data.js` (750) | Datos abiertos de NASA; se pide citar | Se mantiene |
| **Catálogo GCMT** (mecanismos focales) | `datos/eventos_gcmt_*.csv`, `resultados/` | Libre para investigación con cita (Dziewonski et al. 1981; Ekström et al. 2012) | Se mantiene, con cita |
| **EM-DAT** (CRED/UCLouvain: desastres) | `data.js` (9.840 eventos: inundaciones, tormentas, sequías, incendios, etc.) | Exige registro y uso no comercial, y restringe la redistribución de la base. **Hay que revisar sus términos y pedir permiso antes de seguir publicándola.** | **Pendiente de decisión** |
| **Partidas de ajedrez** | `datos/chess_games/` | Registros de partidas de torneos públicos (FIDE, Candidates, Norway Chess); confirmar la fuente exacta de descarga | Se mantiene; confirmar fuente |
| **Eventos de Oklahoma** | `datos/oklahoma_game_data.json` | Derivados de sismos USGS más posiciones astronómicas calculadas | Se mantiene |

Las **tablas de resultados** calculadas por este proyecto (z, RR, q de FDR) sí quedan bajo CC BY 4.0, aunque partan de datos de terceros.

> **Aviso sobre EM-DAT.** Es la fuente con más restricciones y representa unos 9.840 de los 34.503 eventos de `data.js`. Antes de mantenerla pública conviene consultar los términos en `emdat.be`, pedir permiso a CRED o sustituir esos eventos por una fuente abierta.

Antes de volver a publicar cualquier archivo de datos, revisa los términos de su fuente.

## Decisiones pendientes

- Qué hacer con los eventos EM-DAT de `data.js` (pedir permiso, retirarlos o sustituirlos).
- Confirmar la fuente exacta de las partidas de ajedrez de `datos/chess_games/`.
