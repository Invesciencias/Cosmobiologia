# Plataforma Cosmobiología — Fundación Invesciencias
## Reporte técnico, guía de colaboración y hoja de ruta de publicaciones

**Versión:** 2.0 · Junio 2026  
**Estado:** Operativa con 13,870 sismos. Expansión a volcanes, huracanes y sismos masivos en curso.  
**Contacto técnico:** auresy@gmail.com

---

## Glosario — Términos importantes (para investigadores sin estadística)

Este glosario es el punto de partida. Si no entienden estos conceptos, los resultados
pueden parecer más o menos significativos de lo que son.

### Modelo nulo
**¿Qué es?** Un modelo de "qué pasaría si no hubiera ninguna relación". Para cada sismo real,
generamos K eventos ficticios en fechas cercanas (±30 días) y el mismo lugar. Luego preguntamos:
¿los sismos reales tienen algún patrón astrológico que NO tienen los ficticios?

**¿Por qué es crítico?** Sin modelo nulo, cualquier análisis daría resultados "significativos"
porque los planetas lentos (Neptuno, Plutón) están en el mismo lugar durante DÉCADAS.
Si Neptuno y Plutón están en sextil durante 20 años, cualquier evento en esos 20 años
tendrá ese aspecto — sismos, bodas, partidos de fútbol. El modelo nulo elimina ese engaño.

### FDR (False Discovery Rate — Tasa de Falsos Descubrimientos)
**¿Qué es?** Cuando hacemos 522 pruebas estadísticas al mismo tiempo (una por cada aspecto
posible), esperamos que ~26 salgan "significativas" solo por azar, aunque no haya nada real.
FDR es una corrección matemática (método de Benjamini-Hochberg) que ajusta cada resultado
teniendo en cuenta que estamos probando muchas cosas a la vez.

**Analogía:** Si lanzas una moneda 522 veces, saldrán algunas rachas de caras. FDR
distingue "racha aleatoria" de "moneda cargada".

### p-valor
**¿Qué es?** La probabilidad de que el resultado observado ocurra por puro azar.
p=0.05 significa "5% de probabilidad de que sea azar". p=0.001 significa "0.1% de probabilidad".

**¿Qué no es?** El p-valor NO es la probabilidad de que la hipótesis sea verdadera.
Es la probabilidad del dato dado que la hipótesis fuera falsa.

**Umbral:** Usamos p<0.05 después de corrección FDR. Sin FDR, el umbral sería ilusorio.

### Estudio positivo vs. negativo
**Positivo:** Los datos SÍ muestran un patrón que supera el modelo nulo y la validación cruzada.
"Encontramos algo que merece investigarse más."

**Negativo:** Los datos NO muestran ningún patrón más allá del azar. "No encontramos nada
con esta muestra y estas hipótesis."

**Importante:** Un estudio negativo riguroso es tan valioso científicamente como uno positivo.
Es honestidad intelectual. Muchas revistas top los prefieren porque son más difíciles de fabricar.
PERO el objetivo de Invesciencias es encontrar algo real si existe, y para eso hay que
estratificar, ampliar muestras y probar hipótesis más específicas.

### Validación exploratoria + confirmatoria (split validation)
**¿Qué es?** Dividir los datos en dos mitades. En la primera mitad (exploración) buscamos
qué aspectos parecen significativos. Solo esos se prueban en la segunda mitad (confirmación).
Si un aspecto también sale significativo en la confirmación Y en la misma dirección, hay
evidencia real. Si no replica, era ruido.

**¿Por qué?** Porque si buscas algo en los datos con suficiente creatividad, siempre
encuentras algo. La validación cruzada es el seguro contra el autoengaño.

### Estratificación
**¿Qué es?** Dividir los eventos en grupos y analizar cada grupo por separado.
En lugar de "todos los sismos", analizar "sismos M≥7 en zonas de subducción del Pacífico
entre 0–70 km de profundidad". La hipótesis es más específica → más probable de encontrar
señal si existe, pero también más fácil de sobre-ajustar (ver p-hacking).

### P-hacking
**¿Qué es?** El error de hacer MUCHAS pruebas distintas hasta que alguna salga positiva,
y reportar solo esa. Es involuntario la mayoría de veces, pero invalida el resultado.

**Cómo evitarlo:** Pre-registrar la hipótesis ANTES de correr el análisis. Si el resultado
sale negativo después del pre-registro, también se reporta. OSF.io es la plataforma estándar.

### Tamaño de efecto (z-score)
**¿Qué es?** Qué tan grande es la diferencia, no solo si es significativa.
z=2 es marginalmente significativo. z=5 es un efecto enorme.
Un z muy grande con p muy pequeño es señal de algo real. Un z=2.1 con p=0.04 puede
ser ruido que pasó el umbral por azar.

---

## 1. Qué se construyó y por qué

### El problema que resuelve

La cosmobiología (estudio de relaciones entre posiciones planetarias y eventos terrestres)
ha sufrido históricamente de metodología débil. Esta plataforma lo resuelve con tres pilares:

| Pilar | Implementación | Por qué importa |
|-------|---------------|-----------------|
| **Modelo nulo emparejado** | K controles sorteados ±30 días, mismo lugar por cada evento real | Elimina el artefacto de planetas lentos y sesgo de densidad del catálogo |
| **Corrección FDR** | Benjamini-Hochberg sobre 522 hipótesis simultáneas | Sin esto, ~26 falsos positivos por azar puro |
| **Validación exploratoria + confirmatoria** | Dataset 50/50; candidatos del exploratorio se testean solo en confirmatorio | Estándar de oro contra p-hacking |

### Componentes técnicos

```
eventos.csv ──[charts.py]──► cartas astrales ──[nullmodel.py]──► resultados.csv
     │                                                                   │
     ├──[generar_data_js.py]──► data.js (embebido en la web)            │
     ├──[compute_features.py]──► features.js (carta por evento)         │
     └──► index.html (app web) ◄──── Supabase (nube compartida multi-investigador)
```

**Motor astronómico:** Skyfield + JPL DE421 (citable en publicaciones científicas)  
**Sistema de casas:** Whole Sign (estable en todas las latitudes, incluyendo polares)  
**Estadística:** z-score de proporciones + Benjamini-Hochberg FDR (sin dependencia de scipy)

---

## 2. Resultado estadístico actual y qué significa

**Muestra:** 13,870 sismos M≥5, 2000–2023, USGS  
**Prueba:** k=200 controles por evento, ventana ±30 días, 522 características astrológicas  
**Resultado:** 2 candidatos en exploración → **0 confirmados en validación cruzada**

**Interpretación honesta:** Con esta muestra y estas hipótesis, NO se detecta asociación
astrológica en sismos. Esto puede significar:
- No existe asociación (resultado nulo real)
- La muestra es insuficiente para detectar un efecto pequeño
- La estratificación incorrecta mezcla subpoblaciones con señales opuestas que se cancelan

**Lo que hay que hacer:** ampliar la muestra y estratificar.

---

## 3. Ideas de estratificación para encontrar señal (si existe)

La estratificación consiste en dividir los datos en subgrupos con características
físicas similares. Si una relación astrológica existe, probablemente sea más fuerte
en cierto tipo de evento que en todos mezclados.

### Por magnitud (lo más directo)

Los sismos más grandes liberan más energía y tienen mecanismos físicos distintos.

| Estrato | Rango | Eventos esperados (M≥4, 2000-2024) |
|---------|-------|-------------------------------------|
| Microsismos | M 4.0–4.9 | ~180,000 |
| Moderados | M 5.0–5.9 | ~18,000 |
| Fuertes | M 6.0–6.9 | ~1,800 |
| Mayores | M 7.0–7.9 | ~180 |
| Grandes | M ≥ 8.0 | ~15 |

**Hipótesis:** Si hay señal astrológica, puede ser más clara en los extremos (M≥7)
porque son eventos físicamente más definidos. O puede ser más clara en los moderados
porque hay suficientes para tener potencia estadística.

### Por profundidad focal (mecanismo físico diferente)

| Estrato | Profundidad | Mecanismo |
|---------|-------------|-----------|
| Superficial | 0–70 km | Fractura cortical, más destructivo |
| Intermedio | 70–300 km | Subducción, zona de transición |
| Profundo | > 300 km | Interior del manto, muy diferente |

Los sismos superficiales afectan directamente la superficie terrestre y el campo
gravitacional local. Si hay un mecanismo cosmobiológico, podría ser diferente según profundidad.

### Por contexto tectónico (tipo de falla)

| Tipo | Ejemplo | Mecanismo |
|------|---------|-----------|
| **Subducción** | Anillo de Fuego, Japón, Chile | Una placa se hunde bajo otra |
| **Transformante** | Falla de San Andrés | Placas que se deslizan lateralmente |
| **Intraplaca** | Centro de EE.UU., interior de Asia | Dentro de una placa, no en el borde |
| **Rift** | Rift de África Oriental | Placas que se separan |

La hipótesis es que el mecanismo físico puede interactuar de forma diferente con
campos externos (marea gravitacional, campo magnético).

### Por región geográfica / latitud

| Región | Característica cosmobiológica | Por qué interesa |
|--------|------------------------------|-----------------|
| Anillo de Fuego | Alta frecuencia, subducción dominante | Muestra grande, homogénea |
| Himalaya / Tibet | Colisión continental, sismos superficiales | Mecanismo único |
| Dorsal Medio-Atlántica | Rift oceánico, sismos moderados frecuentes | Ambiente tectónico puro |
| Mediterráneo | Convergencia compleja | Zona bien estudiada |
| América del Sur | Subducción profunda, VAN bien documentado | Datos históricos comparables |

El mapa de grilla de la plataforma ya permite esto: selecciona una celda y compara
la estadística de esa zona vs. el resto del mundo.

### Por hora local del sismo (posición del Sol / Ascendente)

Los efectos de marea lunar y solar son más fuertes en ciertas horas del día.
Si hay un mecanismo cosmobiológico relacionado con la marea, debería aparecer
estratificando por hora local del sismo (no UTC).

**Estratos:** Noche (0–6h local), Mañana (6–12h), Tarde (12–18h), Noche tardía (18–24h)

### Por estación del año

La distancia Tierra-Sol varía ~3.3% entre perihelio (enero) y afelio (julio).
La marea solar varía en consecuencia. Estratos: DJF (dic-ene-feb), MAM, JJA, SON.

### Por fase lunar

La marea lunar es 2.2 veces más fuerte en luna llena y nueva. Si hay relación con
sismos, debe aparecer en eventos cercanos a luna llena/nueva vs. cuartos.

| Estrato | Días desde luna nueva |
|---------|-----------------------|
| Luna nueva ±3 días | 0–3 y 27–29.5 |
| Cuarto creciente ±3 días | 4–10 |
| Luna llena ±3 días | 11–18 |
| Cuarto menguante ±3 días | 18–26 |

**Nota:** La correlación sismo-fase lunar ya fue estudiada con resultados mixtos.
Si encontramos algo aquí, hay literatura con qué comparar.

### Por período histórico / ciclos astrológicos largos

| Período | Evento astrológico | Duración |
|---------|--------------------|---------|
| Conjunción Júpiter-Saturno | Cada ~20 años | 1 año de influencia |
| Saturno en signos específicos | 2.5 años por signo | Ciclo 29.5 años |
| Nodo Lunar en nodo de regreso | Ciclo de 18.6 años | ±1 año |

Estos ciclos pueden generar artefactos si no se controlan (el modelo nulo emparejado
±30 días los elimina, pero si el ciclo es de 18 años, ±30 días no alcanza).

### Estratificación combinada (la más potente)

La hipótesis más precisa (y más publicable si sale positiva):

> "Sismos M≥7, profundidad <70 km, en zonas de subducción del Anillo de Fuego,
> 2000–2023 (n≈120 eventos): ¿tienen mayor frecuencia de cuadratura Marte–Luna
> dentro de 8° de orbe que los controles emparejados?"

Esta hipótesis es específica, tiene justificación física (sismos superficiales mayores
en zonas de máxima presión tectónica), y si sale positiva es difícil de atribuir a azar.

---

## 4. Cómo aumentar la muestra

```bash
# Descarga M≥4, 2000-2024 (≈200,000 eventos, ~30 minutos de descarga)
python descargar_sismos_masivo.py

# Solo M≥5 (≈20,000 eventos, más rápido)
python descargar_sismos_masivo.py --minmag 5

# Período específico
python descargar_sismos_masivo.py --minmag 4 --inicio 2010 --fin 2020
```

Con 200,000 sismos la potencia estadística sube ~4x (raíz de 200,000/13,870).
Un efecto que hoy no es detectable puede volverse significativo con 10x más datos.

---

## 5. Cómo colaboran los investigadores

### Opción A — Colaboración básica (recomendada para empezar)

El administrador comparte **dos datos** (URL Supabase + clave anon) por mensaje interno.

Cada investigador:
1. Descarga `index.html` + `data.js` + `features.js`
2. Abre `index.html` con doble clic (funciona sin internet)
3. Pestaña **Captura** → sección **Nube compartida** → pega credenciales → Probar conexión
4. **Subir a la nube** sus eventos; **Traer de la nube** para ver los de los demás

### Opción B — Colaboración avanzada (>5 investigadores activos)

Supabase Auth: cada investigador crea cuenta. Solo cuentas verificadas pueden escribir.
El administrador ve quién aportó qué y cuándo. Solicitar al contacto técnico.

### Roles sugeridos

| Rol | Responsabilidad |
|-----|----------------|
| **Coordinador de datos** | Valida calidad de eventos antes de subir |
| **Analista** | Corre nullmodel.py, interpreta, redacta metodología |
| **Redactor** | Lleva hipótesis confirmadas a borrador de paper |
| **Curador de hipótesis** | Gestiona el banco de hipótesis en la pestaña |

---

## 6. Estrategia de publicaciones

### Principio rector

> Publicar **un dominio a la vez**, con el máximo rigor. Pre-registrar en OSF antes de
> correr cualquier análisis. La reputación de Invesciencias se construye con el primero.

### Hoja de ruta

| # | Paper | Datos | Estado | Revista objetivo |
|---|-------|-------|--------|-----------------|
| 1 | Metodología + sismos M≥5 (negativo riguroso) | 13,870 listos | Redactar | PLOS ONE |
| 2 | Sismos M≥4 estratificados (positivo potencial) | Descargar ~200k | 1–2 semanas | Correlation / JSE |
| 3 | Erupciones volcánicas GVP | Descargar ~10k | 2 semanas | PLOS ONE |
| 4 | Huracanes HURDAT2 | Descargar automático | 2 semanas | Natural Hazards |
| 5 | Estudio comparativo multi-dominio | Cuando 1-3 listos | 6 meses | Nature Scientific Reports |
| 6 | Natalidad / efecto Gauquelin | AstroDatabank AA | Conseguir datos | JSE / Correlation |

### Pre-registro en OSF (obligatorio para papers 2 en adelante)

1. Crear proyecto en **osf.io** (gratis)
2. Subir documento: pregunta, datos, método, hipótesis específica, criterio de éxito
3. Registrar (genera DOI inmutable con timestamp)
4. Correr el análisis DESPUÉS del registro
5. Citar en el paper: "Pre-registered at OSF: osf.io/xxxxx"

Esto hace los resultados inatacables metodológicamente y diferencia a Invesciencias.

---

## 7. Fuentes de datos gratuitas por dominio

| Dominio | Fuente | URL | Eventos | Tiene hora exacta |
|---------|--------|-----|---------|-------------------|
| Sismos | USGS FDSN | earthquake.usgs.gov/fdsnws | >1,000,000 | Sí |
| Erupciones | Smithsonian GVP | volcano.si.edu | ~10,000 | Parcial |
| Huracanes | NOAA HURDAT2 | nhc.noaa.gov/data | ~2,500 | Sí (cada 6h) |
| Tornados | NOAA Storm Events | ncdc.noaa.gov/stormevents | >50,000 | Sí |
| Inundaciones | Dartmouth Flood Observatory | floodobservatory.colorado.edu | ~4,500 | Solo fecha |
| Clima espacial | NOAA SWPC | swpc.noaa.gov | >100,000 | Sí |
| Accidentes aéreos | Aviation Safety Network | aviation-safety.net | ~15,000 | Sí |
| Natalidad | AstroDatabank (calidad AA) | astro.com/astro-databank | ~20,000 | Sí |

---

## 8. Lo que la plataforma puede hacer ahora

- Cargar eventos manual, CSV o Supabase (colaboración multi-investigador)
- Calcular carta astral completa (10 planetas + Nodo + Asc + MC) para cualquier evento fechado
- Mapa mundial interactivo con grilla lat/lon — comparar zona vs. resto
- Tablero estadístico con volcano plot, barras de significancia, tabla filtrable
- Filtro por año en el mapa
- Banco de hipótesis con generador de texto falseable para pre-registro en OSF
- Exportar CSV de eventos y resultados
- Sincronización Supabase sin duplicados (upsert por event_id)

---

## 9. Expansiones planificadas

### Corto plazo (1–2 meses)
- [ ] Estratificación en el tablero (filtrar por dominio, magnitud, profundidad, región)
- [ ] Descargar sismos masivos M≥4 (~200,000 eventos)
- [ ] Conversor de tornados NOAA
- [ ] Conversor de fulguraciones solares NOAA SWPC
- [ ] Autenticación Supabase con login por investigador

### Mediano plazo (3–6 meses)
- [ ] Test de sectores de Gauquelin (análisis de natalidad, diferente al de aspectos)
- [ ] Chiron y asteroides (requiere kernel adicional de efemérides)
- [ ] Exportar reporte PDF desde la pestaña de hipótesis
- [ ] Pre-registro integrado con OSF API

### Largo plazo (>6 meses)
- [ ] API pública para consultas externas
- [ ] Expansión biomédica (infartos, epilepsia — requiere aprobación ética IRB)
- [ ] Dashboard unificado de todos los dominios de Invesciencias
- [ ] Publicación del código en GitHub con DOI para citar en papers

---

## 10. Cómo citar esta herramienta en un paper

```
Fundación Invesciencias (2026). Cosmobiología: plataforma generalizada de cartas
de eventos y análisis estadístico por modelo nulo emparejado [Software].
Motor astronómico: Skyfield (Rhodes 2019) + JPL DE421. Código disponible en: [URL].
```

Antes de publicar, subir el código a GitHub y generar un DOI en Zenodo.

---

## 11. Resumen ejecutivo (para directivos y comunicados)

> Hemos construido una plataforma científica que permite a investigadores de Invesciencias
> cargar eventos de cualquier ciencia (sismos, erupciones, huracanes, natalidad, eventos médicos),
> calcular automáticamente la configuración planetaria en ese momento exacto, y probar
> estadísticamente si hay alguna asociación real usando un modelo de control matemático riguroso.
>
> La herramienta es gratuita, funciona en el navegador sin instalación, permite colaboración
> entre investigadores desde distintos lugares, y genera hipótesis en formato directamente
> publicable en revistas científicas internacionales.
>
> El objetivo es encontrar asociaciones positivas reales si existen. Para eso estamos
> ampliando la muestra a 200,000+ sismos y estratificando por magnitud, profundidad y
> región geográfica. La plataforma ya está preparada para expandirse a volcanes, huracanes,
> clima espacial y natalidad con los mismos estándares estadísticos.
>
> Ruta de publicaciones: un paper por dominio, pre-registrado en OSF, apuntando a
> PLOS ONE y Journal of Scientific Exploration como revistas objetivo.

---

*Fundación Invesciencias · Plataforma Cosmobiología · Versión 2.0 · Junio 2026*
