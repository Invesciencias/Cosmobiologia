# Cosmobiología — Fundación Invesciencias
## Plataforma generalizada de cartas de eventos + análisis estadístico falseable

Versión 0.1 — Fase 1: **Sismos** (arquitectura extensible a cualquier evento fechado).

---

## 1. Decisiones tomadas (y por qué)

| Tema | Decisión | Justificación |
|------|----------|---------------|
| **Enfoque inicial** | Solo sismos | Directiva de Invesciencias: concentrar a todos los investigadores en una línea. Esquema generalizado para luego añadir inundaciones, infartos, etc. |
| **Tiempo** | Se guarda el **instante UTC** + lat/lon + zona horaria IANA | Las longitudes planetarias dependen solo del instante absoluto; las **casas** dependen del instante + lugar. Mezclar UTC con zona local introduce errores de horas. |
| **Sistema de casas** | **Whole Sign** (primario), Placidus (secundario) | Whole Sign es estable en **todas las latitudes**, incluidas polares (>66°). Placidus se degenera cerca de los polos y los sismos ocurren en todo el planeta. |
| **Aspectos** | Mayores (conjunción, oposición, cuadratura, trígono, sextil) con orbes estándar; menores registrados aparte | Los aspectos mayores tienen base teórica más fuerte; separarlos evita inflar comparaciones múltiples. |
| **Base de datos** | **Supabase** (Postgres en la nube, capa gratuita, API REST + auth) | Multi-investigador, datos persistentes para la fundación, sin montar servidor propio. Alternativa rápida: Google Sheets. |
| **Cómputo de cartas** | Backend **Python + kerykeion (Swiss Ephemeris)** | Efemérides de precisión científica; reproducible y citable. |
| **Rigor** | Pre-registro de hipótesis (OSF) + corrección por comparaciones múltiples (FDR) | Sin esto ninguna revista seria acepta el trabajo. |

---

## 2. El punto crítico: **modelo nulo** (esto es lo que hace ciencia)

> ⚠️ El análisis actual (`analysis.ipynb`) cuenta los aspectos más frecuentes en sismos —
> p. ej. "sextil Neptuno–Plutón". **Esto NO es evidencia.** Neptuno y Plutón están en
> sextil durante **décadas**, para cualquier evento: sismos, bodas, partidos de fútbol.
> Un conteo crudo siempre destacará a los planetas lentos. **No es falseable.**

Las posiciones planetarias **no se distribuyen uniformemente**: Mercurio y Venus nunca se
alejan del Sol, los planetas lentos se mueven poco en años. Por eso hay que comparar lo
observado contra lo **esperado por azar**, generando un **modelo nulo**:

1. Para cada sismo real, se generan **K eventos de control** (p. ej. K=100) en **instantes
   aleatorios** dentro de la misma ventana temporal del estudio, manteniendo la **misma
   ubicación**. (Variante: barajar fechas y lugares entre sí.)
2. Se calcula **la misma carta** para reales y controles.
3. Para cada rasgo astrológico (un aspecto dentro de orbe, un planeta en una casa, etc.) se
   compara la **frecuencia observada** contra la **distribución nula**.
4. Significancia: **p-valor de Monte Carlo / binomial / χ²**, y se corrige por todas las
   pruebas con **Benjamini–Hochberg (FDR)**.
5. Se reporta **tamaño de efecto** (no solo p), e intervalos de confianza.

### ⚠⚠ Segundo artefacto crítico: densidad temporal del catálogo

La primera corrida con modelo nulo **uniforme** dio 24 rasgos "significativos"… y casi
todos eran aspectos de **planetas lentos** (Urano–Plutón, Urano–Neptuno, Neptuno–Plutón,
Júpiter–Saturno). **No es geofísica: es sesgo de muestreo.** El catálogo USGS tiene
muchísimos más sismos en décadas recientes (mejor instrumentación). Como los planetas
lentos marcan "qué época es", cualquiera de sus configuraciones correlaciona con los años
de mayor cobertura. Un nulo uniforme no controla esto.

**Solución — modelo nulo emparejado temporalmente** (`null_mode="matched"`, por defecto):
cada control se sortea **cerca de la fecha del evento real** (±30 días). Así los planetas
lentos quedan congelados (su efecto se cancela correctamente) y la prueba aísla solo lo que
varía rápido: **Luna, Mercurio, Venus, Sol, casas, Ascendente y MC** — que es donde una
hipótesis cosmobiológica es realmente falseable. El archivo
`resultados_uniforme_ARTEFACTO.csv` se conserva como ilustración didáctica del error.

**Hipótesis falseable (ejemplo de pre-registro):**
> "La frecuencia de la cuadratura Marte–Saturno dentro de 6° de orbe en el momento de
> sismos M≥6 es **mayor** que la esperada bajo el modelo nulo, con p<0.05 corregido por FDR."

Si los datos no la sostienen, la hipótesis se **rechaza**. Eso es ciencia.

---

## 3. Esquema generalizado de eventos (`eventos_template.csv`)

| Columna | Obligatoria | Ejemplo | Notas |
|---------|-------------|---------|-------|
| `event_id` | sí | `us6000k1x2` | único |
| `domain` | sí | `sismo` | sismo / inundacion / infarto / ... |
| `subtype` | no | `tectonico` | |
| `datetime_utc` | sí | `2023-04-22T08:23:42Z` | ISO-8601 en UTC |
| `latitude` | sí | `-5.2697` | grados decimales |
| `longitude` | sí | `125.5950` | grados decimales |
| `place` | no | `Banda Sea` | texto libre |
| `value` | no | `6.0` | magnitud / intensidad / severidad genérica |
| `value_kind` | no | `mag_mww` | qué mide `value` |
| `extra_json` | no | `{"depth_km":7.27}` | campos específicos del dominio |
| `source` | no | `USGS` | trazabilidad |

---

## 4. Pipeline

```
eventos.csv ──charts.py──> features ──nullmodel.py──> resultados_estadisticos.csv
     │                                                                      │
     ├── generar_data_js.py ─────────> data.js (eventos + resultados)       │
     ├── compute_features.py ────────> features.js (carta por evento)       │
     ▼                                                                      ▼
  index.html  (Captura · Tablero · Mapa+grilla · Hipótesis)  ── Supabase (nube)
```

**Regenerar la página tras nuevas corridas:**
```bash
python nullmodel.py eventos.csv 1000   # estadística global
python generar_data_js.py              # embebe eventos + resultados
python compute_features.py             # embebe carta de cada evento (para el mapa interactivo)
```

### Capa interactiva del Mapa (zona vs. resto)

La pestaña **Mapa y grilla** permite seleccionar una celda lat/lon (y un rango de
años) y comparar al vuelo las configuraciones astrológicas de esa zona contra el
**resto** del mundo (prueba z de proporciones + FDR, en el navegador). Es
**exploratorio**: las diferencias entre zonas pueden reflejar *cuándo* se registró
cada región, así que sirve para **generar** hipótesis que luego se confirman con el
modelo nulo emparejado. Ejemplo de validación: el rasgo más fuerte por zona suele
ser la cuadratura Asc–MC, porque la latitud determina geométricamente ese ángulo.

---

## 5. Nube compartida — Supabase

1. Crear proyecto gratis en https://supabase.com
2. SQL Editor → ejecutar:

```sql
create table eventos (
  event_id     text primary key,
  domain       text,
  subtype      text,
  datetime_utc timestamptz,
  latitude     double precision,
  longitude    double precision,
  place        text,
  value        double precision,
  value_kind   text,
  source       text,
  extra_json   jsonb,
  created_at   timestamptz default now()
);
alter table eventos enable row level security;
-- aporte abierto a investigadores (ajustar a auth si se requiere moderación):
create policy "lectura"  on eventos for select using (true);
create policy "insercion" on eventos for insert with check (true);
```
3. En `index.html` → pestaña Captura → pegar **URL** y clave **anon**. Subir/traer eventos.

---

## 6. Selección de cuerpos (opción del análisis)

`run_null_test(..., include_node=True, include_angles=True)`:
- **10 clásicos** (por defecto): Sol→Plutón. Menos pruebas = más potencia.
- **+ Nodo lunar medio**: `include_node=True`.
- **+ Ascendente y MC como puntos de aspecto**: `include_angles=True`.
- *Quirón*: requiere efeméride de asteroides (kernel adicional); pendiente.

---

## 7. Diseño exploratorio + confirmatorio (anti p-hacking)

Estándar de oro para publicar. `nullmodel.run_split_validation(eventos, k=500)`:
1. Parte la muestra en **exploración** y **confirmación**.
2. Descubre candidatos (FDR<0.05) en exploración.
3. Re-testea SOLO esos en confirmación.
4. Un rasgo es **sólido** únicamente si replica con la **misma dirección**.

```bash
python -c "import pandas as pd, nullmodel; \
  ev=pd.read_csv('eventos.csv'); \
  exp,con=nullmodel.run_split_validation(ev,k=500,include_node=True); \
  con.to_csv('confirmados.csv',index=False)"
```
