# Cosmobiología — Fundación Invesciencias

Plataforma de análisis estadístico falseable: carga eventos con fecha, hora y lugar, calcula automáticamente las posiciones astronómicas, y prueba si hay asociaciones significativas contra un **modelo nulo emparejado** con corrección FDR y validación cruzada.

**Estado actual:** 34.503 eventos en 11 dominios · 6.035 sismos con mecanismo focal · límite de detección caracterizado.

📄 Extiende el programa de investigación propuesto en: Serrano, D. (2026). El cosmos que habitamos: fuerzas lunares, geomagnéticas y circadianas — evidencia escalonada y un programa de investigación desde Invesciencias. Circular Astronómica RAC, N.º 1027, septiembre 2026, pp. 8–11. Red de Astronomía de Colombia.

🌐 **Sitio:** https://invesciencias.github.io/Cosmobiologia/

---

## Lo primero que hay que entender: qué puede y qué no puede ver

Antes que cualquier resultado, la pregunta es **cuál es el efecto más pequeño que este diseño detecta**. Se midió empíricamente: se aleatorizaron las fechas del catálogo (±365 días por evento) y se corrió el análisis completo; el máximo |z| que aparece entre los ~400 rasgos es lo que produce el puro azar.

- **Techo de ruido:** |z| = 3,22 ± 0,65 (5 réplicas; máximo 3,97)
- **Umbral práctico:** z = 3,88
- **Efecto mínimo detectable:** `RR_min = 1 + z·0,948·√((1−f)/(n·f))`

| n | RR mínimo detectable (f = 5%) |
|---|---|
| 3.730 (M≥6) | **1,263** |
| 6.035 (GCMT) | 1,206 |
| 44.390 (M≥5) | **1,076** |

| Tamaño del efecto | Eventos necesarios (f = 5%) |
|---|---|
| RR = 1,30 (grande) | 2.856 ✓ |
| RR = 1,20 (moderado) | 6.426 ✓ |
| RR = 1,10 (pequeño) | 25.706 ✓ |
| RR = 1,05 (muy pequeño) | 102.824 |
| **RR = 1,02 (escala de marea, Tanaka)** | **642.649** ✗ fuera de alcance |

**Consecuencia práctica:** los efectos sutiles (mareas, ~1-2%) no se pueden probar contando eventos discretos, por muchos que se acumulen. Requieren análisis espectral sobre series continuas, donde la potencia viene de la longitud de la serie.

> Advertencia medida, no teórica: **una de las cinco réplicas con fechas inventadas produjo 2 rasgos con FDR<0,05**. Ningún hallazgo aislado, por corregido que esté, sustituye la replicación en datos independientes.

---

## Demo rápida

```bash
pip install skyfield pandas numpy requests python-dateutil
python generar_data_js.py     # genera data.js
python compute_features.py    # genera features.js
```
Luego abre `index.html` con doble clic — funciona sin servidor.

---

## Qué hay en la web

| Sección | Contenido |
|---|---|
| **Empieza aquí** | Mapa Cósmico 3D · publicación en la RAC · los tres niveles de evidencia |
| **Captura de eventos** | Alta manual, importación CSV, sincronización con Supabase |
| **Tablero estadístico** | Volcano plot, barras de significancia, tabla FDR por dominio |
| **Mapa y grilla** | Mapa mundial + grilla lat/lon con estadística por celda |
| **Hipótesis y expansión** | Banco de hipótesis falseables + generador de texto para pre-registro OSF |
| **Fuentes de datos** | Descargadores automáticos por dominio |
| **Epidemiología** | Módulo de asociación con series de salud (datos aportados por el investigador) |
| **Metodología** | Conceptos estadísticos, **curva de potencia**, coordenadas precesionales, geodinámica de Llona |

### Mapa Cósmico 3D
Escena única a escala logarítmica real (Tierra → Sistema Solar → estrellas → centro galáctico):
- Movimientos de la Tierra con escala de tiempo ajustable (rotación, traslación, precesión, nutación, órbita galáctica)
- Eclipses solar y lunar
- Esfera celeste topocéntrica con **casas de Polich-Page** (exportable a pestaña aparte con fondo claro)
- **Límites oficiales IAU/Delporte** de las 88 constelaciones, precesados a J2000
- Ciclos planetarios por signo con elemento y modalidad
- Línea de tiempo 1900–2100
- Marco **LSR**: resta el movimiento propio del Sol para ver el movimiento real de las estrellas

---

## El corpus

| Fuente | Eventos |
|---|---|
| **Total (11 dominios)** | **34.503** |
| Sismos (todas las fuentes) | 18.648 |
| Inundaciones | 5.016 |
| Tormentas solares | 3.469 |
| Tormentas | 2.877 |
| Huracanes | 2.494 |
| Otros (sequía, incendio, erupción, deslizamiento, temperatura extrema, desastre) | 1.999 |

**Desglose sísmico M≥6:** USGS 13.870 (1900–2023) · NOAA NCEI 2.437 · EM-DAT 675 · **total 16.982**.
Subconjunto de análisis principal: **3.730** sismos M≥6 de USGS (2000–2024).
**GCMT con mecanismo focal:** 6.035 sismos Mw≥6 (1976–2026), clasificados por tipo de falla.

---

## Resultados actuales

### Mercurio–Urano en sismos M≥6 — positivo, no replicado

| Prueba | n | z | RR | q (FDR) |
|---|---|---|---|---|
| Descubrimiento — USGS 2000–2024 | 3.730 | +5,27 | 1,315 | 0,000047 ✓ |
| GCMT 2000–2024, solo inversas | 1.351 | +3,21 | 1,364 | 0,177 ✗ |
| GCMT 2000–2024 (ventana igual) | 3.133 | +2,35 | 1,170 | 0,567 ✗ |
| **GCMT 1976–1999 (independiente)** | 2.731 | **+0,61** | **1,044** | 1,0 ✗ |

El z=5,27 original **supera el techo de ruido medido** (máx. 3,97): no era un artefacto trivial de las 398 pruebas. Pero **no replica** en el único periodo que no comparte terremotos con el descubrimiento. Conclusión: no generaliza.

### Disparo mareal (hipótesis de Tanaka) — sin potencia para concluir

Se calculó el esfuerzo de Coulomb mareal resuelto sobre el plano de falla de cada sismo (`marea_tensor.py`) y se probó agrupamiento de fase. En el estrato exacto de Tanaka (inversas superficiales, n=2.262): **z = +0,03**.

**Este negativo no refuta a Tanaka.** Su efecto reportado es de ~1-2%; con esa muestra daría z ≈ 0,23. La prueba nunca pudo salir positiva. Además el modelo es de **marea sólida terrestre sin carga oceánica**, que en zonas de subducción puede ser del mismo orden.

### Negativos que sí valen

Con el catálogo actual se puede afirmar cuantitativamente: **no existen efectos de RR ≥ 1,26 en rasgos con frecuencia base del 5%** en sismos M≥6.

---

## Estratificación

| Dimensión | Estado |
|---|---|
| Magnitud | ✅ `estratificar_sismos.py --por magnitud` |
| Profundidad focal | ✅ `--por profundidad` (superficial / intermedio / profundo) |
| Causa (tectónico / volcánico / inducido) | ✅ `--por causa` — los inducidos son control negativo |
| Región tectónica | ✅ conjuntos por anillo pacífico, Sudamérica, Asia central, Mediterráneo, Atlántico |
| **Tipo de falla** (inversa / normal / desgarre) | ✅ `mecanismo_focal.py` — 6.035 sismos clasificados |

El tipo de falla es el requisito de diseño que señala el artículo publicado: Tanaka et al. (2002) hallaron correlación mareal **solo en fallas inversas de subducción**, no en el catálogo global.

Distribución obtenida (Frohlich 1992): inversa 43,9% · desgarre 22,9% · normal 17,5% · oblicua 15,6%.

---

## Estructura del repositorio

```
cosmobiologia/
├── index.html                    # Aplicación web completa
├── translations.js               # Textos ES/EN
│
├── MOTOR ASTRONÓMICO
│   ├── charts.py                 # Cartas de eventos (Skyfield + JPL DE421)
│   ├── precession_engine.py      # Precesión IAU 2006 + nutación IAU 2000A
│   ├── directions.py             # Direcciones primarias (ARMC)
│   ├── duplas.py                 # Duplas y tripletas (TCC)
│   └── cycloidal_engine.py       # Geodinámica cicloidal de Llona
│
├── GEOFÍSICA
│   ├── mecanismo_focal.py        # Tensor de momento GCMT → tipo de falla (Frohlich 1992)
│   ├── marea_tensor.py           # Esfuerzo de Coulomb mareal sobre el plano de falla
│   └── decluster.py              # Declusterización Gardner-Knopoff
│
├── ESTADÍSTICA
│   ├── nullmodel.py              # Modelo nulo emparejado + FDR + split validation
│   ├── mixed_models.py           # LMM / GLMM
│   ├── estratificar_sismos.py    # Análisis por subgrupos
│   ├── epidemiology.py           # Módulo epidemiológico
│   └── interpretacion_diversificada.py
│
├── VISUALIZACIÓN
│   └── topocentric_polich_page_3d.py   # Esfera topocéntrica Polich-Page (Plotly)
│
├── DESCARGA Y CONVERSIÓN
│   ├── descargar_sismos_masivo.py, descargar_gcmt.py, descargar_solar.py,
│   │   descargar_huracanes.py, descargar_eonet.py, descargar_volcanes.py,
│   │   descargar_sismos_impacto.py
│   └── convertir_sismos.py, convertir_emdat.py, convertir_inundaciones.py,
│       convertir_gauquelin.py
│
├── GENERACIÓN WEB
│   ├── generar_data_js.py        # → data.js
│   └── compute_features.py       # → features.js
│
└── DOCUMENTACIÓN
    ├── README.md                 # Este archivo
    ├── README_METODOLOGIA.md     # Decisiones técnicas detalladas
    ├── COMPARABILIDAD_EVENTOS.md # Qué rasgos valen para cada dominio
    ├── FUENTES_DATOS.md          # Guía de fuentes por dominio
    ├── OSF_PREREGISTRO.md        # Plantillas de pre-registro
    └── SETUP_SUPABASE.md         # Nube compartida
```

`data.js`, `features.js`, `eventos.csv` y `de421.bsp` **no están en el repositorio** — se generan localmente.

---

## Metodología

### Modelo nulo emparejado
Para cada evento real, K controles ficticios sorteados ±30 días en el mismo lugar. Congela los planetas lentos y aísla lo que varía rápido (Luna, Mercurio, Venus, Sol, Ascendente, MC). Sin esto, un catálogo con más eventos en años recientes mostraría siempre los aspectos de planetas lentos como "frecuentes".

### Corrección por comparaciones múltiples
Se prueban ~400 rasgos simultáneamente. Sin corrección, ~20 saldrían significativos por azar. Se aplica **Benjamini-Hochberg FDR** al 5%.

### Validación exploratoria + confirmatoria
División 50/50: los candidatos del set exploratorio se prueban **solo** en el confirmatorio. Estándar contra p-hacking.

### Replicación externa
El paso que ningún split interno sustituye: probar en un catálogo que no compartió eventos con el descubrimiento (aquí, GCMT 1976–1999).

### Los tres niveles de evidencia
Marco del artículo publicado, aplicado también a los resultados propios:
- **Nivel I** — física establecida (mareas terrestres de 20–55 cm; sin controversia)
- **Nivel II** — señal sugerente, asociación estadística **reproducible**, alcance limitado
- **Nivel III** — hipótesis mecanicista con evidencia mixta, requiere estudios pre-registrados grandes

---

## Reproducir los análisis principales

```bash
# 1. Mecanismo focal desde GCMT
python mecanismo_focal.py archivo.ndk        # autoverificación incluida

# 2. Modelo nulo estratificado por tipo de falla
python -c "
import pandas as pd, nullmodel
df = pd.read_csv('eventos_gcmt_mecanismo.csv')
for t in ['inversa','normal','desgarre']:
    r = nullmodel.run_null_test(df[df.tipo_falla==t], k=200, verbose=False)
    r.to_csv(f'resultados_falla_{t}.csv', index=False)
"

# 3. Esfuerzo mareal de Coulomb (validaciones físicas en el módulo)
python -c "import marea_tensor as mt; print(mt.serie_dcff_rapida(35,140,200,15,90,__import__('datetime').datetime(2011,3,11,5,46)))"

# 4. Esfera topocéntrica Polich-Page → HTML interactivo
python topocentric_polich_page_3d.py
```

---

## Verificaciones que pasan los módulos

Cada módulo trae autoverificación contra hechos conocidos, no solo tests de humo:

- **`mecanismo_focal.py`** — Tohoku 2011: Mw calculado 9,08 (aceptado 9,0–9,1), clasificado *inversa* ✓ · réplica outer-rise *normal* ✓ · Sagaing *desgarre* ✓ · ortogonalidad de ejes exacta en 6.035 eventos
- **`marea_tensor.py`** — componente diurna exactamente 0 en el ecuador (predicción teórica sin 2φ) · amplitud 0,72 kPa (rango documentado 0,1–10) · ortogonalidad falla 10⁻¹⁷ · derivada numérica estable a tres pasos
- **`topocentric_polich_page_3d.py`** — ASC/DSC exactos en el horizonte · MC/IC exactos en el meridiano · casas opuestas antípodas
- **Límites IAU** — punto vernal J2000 dentro de Piscis ✓ · recorrido de la eclíptica suma exactamente 360,00° ✓ · año de cruce a Acuario derivado (2597,7) coincide con el citado (~2597) dentro de 0,7 años

---

## Limitaciones declaradas

- **Carga oceánica no incluida** en el cálculo mareal. En zonas de subducción puede ser del mismo orden que la marea sólida.
- **Efemérides DE421** cubren 1899–2053. Eventos anteriores deben filtrarse.
- **Modelo orbital del navegador** (mapa 3D) es kepleriano elíptico simplificado; los cálculos de análisis usan Skyfield + DE421 con precisión sub-arcosegundo.
- **Límites de constelaciones** vienen precesados a J2000 por la fuente; no se partió del catálogo Delporte B1875 en crudo.
- Corrección conocida al artículo publicado: la cobertura del conjunto USGS M≥6 es **1900–2023**, no 1973–2024 como aparece impreso. La cifra ("más de 10.000") es correcta: son 13.870.

---

## Citar este trabajo

**Artículo:**
> Serrano, D. (2026). El cosmos que habitamos: fuerzas lunares, geomagnéticas y circadianas — evidencia escalonada y un programa de investigación desde Invesciencias. *Circular Astronómica RAC*, N.º 1027, septiembre 2026, pp. 8–11. Red de Astronomía de Colombia.

**Software (APA 7):**
> Serrano Suárez, D. (2026). *Cosmobiología — plataforma generalizada de cartas de eventos y análisis estadístico falseable* [Software]. Fundación Invesciencias. https://github.com/invesciencias/cosmobiologia

---

## Referencias clave del método

- **Tanaka, S., Ohtake, M., & Sato, H.** (2002). Evidence for tidal triggering of earthquakes. *JGR Solid Earth*, 107(B10), 2211. [doi](https://doi.org/10.1029/2001JB001577)
- **Frohlich, C.** (1992). Triangle diagrams: ternary graphs to display similarity and diversity of earthquake focal mechanisms. *PEPI*, 75, 193–198.
- **Melchior, P.** (1983). *The Tides of the Planet Earth* (2.ª ed.). Pergamon Press.
- **Agnew, D. C.** (2015). Earth tides. En *Treatise on Geophysics* (2.ª ed., vol. 3, pp. 151–178). Elsevier.
- **Benjamini, Y., & Hochberg, Y.** (1995). Controlling the false discovery rate. *JRSS B*, 57(1), 289–300.
- **Gardner, J. K., & Knopoff, L.** (1974). Is the sequence of earthquakes in Southern California, with aftershocks removed, Poissonian? *BSSA*, 64(5), 1363–1367.
- **Rhodes, B.** (2019). *Skyfield*. Astrophysics Source Code Library, ascl:1907.024.
- **Ferríz Olivares, D.** (1976). *Teoría Científica de la Cosmobiología*. Actas de Ciencias I. Fundación Invesciencias y Universidad Nacional de Trujillo.

---

## Licencia

MIT — libre para uso académico y de investigación. Al publicar resultados obtenidos con esta herramienta, citar el repositorio y el artículo de la Circular RAC.

---

*Fundación Invesciencias · 2026*
