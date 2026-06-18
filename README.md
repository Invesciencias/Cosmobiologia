# Cosmobiología — Fundación Invesciencias

Plataforma de análisis estadístico falseable para cosmobiología: carga eventos con fecha, hora y lugar, calcula automáticamente la carta astral, y prueba si hay asociaciones significativas usando un modelo nulo emparejado con corrección FDR.

**Fase 1:** Sismos (13,870 eventos M≥5, 2000–2023). Arquitectura extensible a volcanes, huracanes, natalidad y cualquier evento fechado.

---

## Demo rápida

1. Descarga este repositorio (botón verde **Code → Download ZIP**)
2. Genera los datos embebidos:
   ```bash
   pip install skyfield pandas requests python-dateutil
   python generar_data_js.py
   python compute_features.py
   ```
3. Abre `index.html` con doble clic — funciona sin servidor ni instalación

---

## Qué hace la plataforma

| Pestaña | Función |
|---------|---------|
| **📝 Captura** | Registrar eventos manualmente, importar CSV, sincronizar con Supabase |
| **📊 Tablero** | Volcano plot, barras de significancia, tabla de resultados FDR |
| **🗺 Mapa y grilla** | Mapa mundial + grilla lat/lon; selecciona una zona y compara su estadística astrológica vs. el resto |
| **🔭 Hipótesis** | Banco de hipótesis falseables con generador de texto para pre-registro en OSF |
| **🌍 Fuentes** | Descarga volcanes (GVP), huracanes (HURDAT2), conversor genérico de CSV |
| **📖 Metodología** | Explicación interactiva de todos los conceptos estadísticos con definiciones al hacer clic |

---

## Estructura del repositorio

```
cosmobiologia/
├── index.html                  # Aplicación web completa (sin dependencias externas)
│
├── charts.py                   # Motor de cartas astrales (Skyfield + JPL DE421)
├── nullmodel.py                # Modelo nulo emparejado + FDR + split validation
├── generar_data_js.py          # Genera data.js (eventos + resultados embebidos)
├── compute_features.py         # Genera features.js (carta por evento para el mapa)
│
├── convertir_sismos.py         # Conversor USGS CSV → esquema unificado
├── descargar_sismos_masivo.py  # Descarga M≥4 por lotes (~200,000 eventos)
├── descargar_volcanes.py       # Descarga Smithsonian GVP erupciones
├── descargar_huracanes.py      # Descarga NOAA HURDAT2 ciclones
│
├── resultados_estadisticos.csv # Resultados del análisis actual (sismos M≥5)
├── resultados_uniforme_ARTEFACTO.csv  # Ejemplo didáctico de falsos positivos
│
├── README.md                   # Este archivo
├── README_METODOLOGIA.md       # Decisiones técnicas y científicas detalladas
├── REPORTE_INVESCIENCIAS.md    # Reporte completo + estrategias de publicación
├── FUENTES_DATOS.md            # Guía de fuentes de datos por dominio
└── SETUP_SUPABASE.md           # Configuración de la nube compartida
```

Los archivos `data.js`, `features.js`, `eventos.csv` y `de421.bsp` **no están en el repositorio** — se generan localmente (ver instrucciones abajo).

---

## Instalación y pipeline completo

### Requisitos

```bash
pip install skyfield pandas requests python-dateutil
```

Python 3.9+ en Windows, Mac o Linux. No requiere compiladores ni dependencias C.

### 1. Obtener datos de sismos

```bash
# Opción A — descargar desde USGS (recomendado)
python descargar_sismos_masivo.py              # M≥4, 2000-2024 (~200,000 eventos)
python descargar_sismos_masivo.py --minmag 5   # solo M≥5 (más rápido)

# Opción B — convertir un CSV descargado de earthquake.usgs.gov
python convertir_sismos.py query.csv
```

### 2. Correr el análisis estadístico

```bash
# Análisis global (modelo nulo emparejado, k=200 controles por evento)
python nullmodel.py eventos.csv 200

# Análisis con más controles (más preciso, más lento)
python nullmodel.py eventos.csv 1000

# Con validación exploratoria + confirmatoria (para publicar)
python -c "
import pandas as pd, nullmodel
ev = pd.read_csv('eventos.csv')
exp, con = nullmodel.run_split_validation(ev, k=500, include_node=True, include_angles=True)
con.to_csv('confirmados.csv', index=False)
"
```

### 3. Regenerar la página web

```bash
python generar_data_js.py     # embebe eventos + resultados en data.js
python compute_features.py    # embebe carta por evento en features.js
# Abrir index.html
```

### 4. Agregar dominios nuevos

```bash
# Volcanes (Smithsonian GVP)
python descargar_volcanes.py --local GVP_Eruption_Results.csv
# → eventos_volcanes.csv

# Huracanes (NOAA HURDAT2)
python descargar_huracanes.py
# → eventos_huracanes.csv

# Cargar en la página: pestaña "Fuentes de datos" → botón de importar
```

---

## Metodología estadística

### Por qué el modelo nulo es crítico

Contar los aspectos más frecuentes en sismos **no es evidencia**: Neptuno y Plutón están en sextil durante décadas, para cualquier evento. Un catálogo con más sismos en años recientes (mejor instrumentación) siempre mostrará los aspectos de planetas lentos como "frecuentes".

**Solución — modelo nulo emparejado:** para cada evento real, K controles ficticios sorteados ±30 días en el mismo lugar. Los planetas lentos quedan congelados; la prueba aísla solo lo que varía rápido: Luna, Mercurio, Venus, Sol, Ascendente, MC.

### Corrección por comparaciones múltiples

Se prueban 522 características simultáneamente (aspectos + planetas en casas). Sin corrección, ~26 saldrían "significativas" por azar. Se aplica **Benjamini-Hochberg FDR** para controlar la tasa de falsos descubrimientos al 5%.

### Validación exploratoria + confirmatoria

Los datos se dividen 50/50. Los candidatos del set exploratorio se testean **solo** en el confirmatorio. Un resultado es sólido únicamente si replica en la misma dirección. Estándar de oro contra p-hacking; necesario para publicar en revistas indexadas.

### Resultado actual (sismos M≥5, n=13,870)

- 2 candidatos en exploración (FDR < 0.05)
- 0 confirmados en validación cruzada
- Conclusión: resultado nulo limpio — publicable como estudio negativo riguroso

---

## Colaboración (Supabase)

Para que múltiples investigadores compartan eventos en tiempo real:

1. Crear proyecto gratis en [supabase.com](https://supabase.com)
2. Ejecutar el SQL de `SETUP_SUPABASE.md` en el SQL Editor
3. Compartir la **Project URL** y la clave **anon** con el equipo
4. En `index.html` → pestaña Captura → Nube compartida → pegar credenciales → Probar conexión

Ver instrucciones completas en [`SETUP_SUPABASE.md`](SETUP_SUPABASE.md).

---

## Ideas de estratificación para resultados positivos

Si el análisis global da negativo, la señal puede existir en un subgrupo específico. Estratos recomendados:

| Criterio | Estratos | Justificación |
|----------|---------|---------------|
| **Magnitud** | M4–5, M5–6, M6–7, M≥7 | Mecanismos físicos distintos |
| **Profundidad** | <70 km, 70–300 km, >300 km | Corteza vs. manto |
| **Región** | Anillo de Fuego, Himalaya, Dorsal Atlántica | Contexto tectónico homogéneo |
| **Fase lunar** | Luna nueva/llena ±3 días vs. cuartos | Marea lunar 2.2× más fuerte |
| **Hora local** | Mañana, tarde, noche | Marea solar varía con la hora |
| **Estación** | DJF, MAM, JJA, SON | Variación de distancia Tierra-Sol |

---

## Hoja de ruta de publicaciones

| # | Paper | Revista objetivo |
|---|-------|-----------------|
| 1 | Sismos M≥5 — metodología + resultado nulo | PLOS ONE |
| 2 | Sismos M≥4 estratificados | Correlation / JSE |
| 3 | Erupciones volcánicas GVP | PLOS ONE |
| 4 | Huracanes HURDAT2 | Natural Hazards |
| 5 | Estudio comparativo multi-dominio | Nature Scientific Reports |
| 6 | Natalidad / efecto Gauquelin | JSE / Correlation |

Pre-registrar cada hipótesis en [osf.io](https://osf.io) antes de correr el análisis.

---

## Citar este trabajo

```
Serrano Suárez, D. (2026). Cosmobiología: plataforma generalizada de cartas
de eventos y análisis estadístico por modelo nulo emparejado [Software].
Fundación Invesciencias. Motor astronómico: Skyfield (Rhodes 2019) + JPL DE421.
Repositorio: github.com/invesciencias/cosmobiologia
```

**En formato APA 7:**
> Serrano Suárez, D. (2026). *Cosmobiología — plataforma generalizada de cartas de eventos y análisis estadístico falseable* [Software]. Fundación Invesciencias. https://github.com/invesciencias/cosmobiologia

**En formato Vancouver (revistas médicas y de ciencias naturales):**
> Serrano Suárez D. Cosmobiología: plataforma de análisis estadístico falseable para cosmobiología [Software]. Fundación Invesciencias; 2026. Disponible en: https://github.com/invesciencias/cosmobiologia

---

## Licencia

MIT — libre para uso académico y de investigación. Al publicar resultados obtenidos con esta herramienta, citar el repositorio y la metodología descrita en `README_METODOLOGIA.md`.

---

*Fundación Invesciencias · 2026*
