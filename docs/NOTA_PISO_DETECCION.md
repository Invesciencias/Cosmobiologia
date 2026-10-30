# Piso de detección (RR mínimo): definiciones y uso

Código: `piso_deteccion.py` (autónomo, solo librería estándar). Pruebas: `python -m unittest test_piso_deteccion -v`.
Con EE_rel = √((1−f)/(n·f)):

| Definición | Fórmula | Uso |
|---|---|---|
| D_A | 1 + 3,88·0,948·EE_rel | Umbral de un barrido de ~400 rasgos (README, Figura 1). Hallazgos exploratorios. |
| D_B | 1 + 2,4866·EE_rel | Una prueba preespecificada, unilateral, α = 0,05, potencia 80 % (2,4866 = z₀,₉₅ + z₀,₈₀). Todas las réplicas. |
| D_Be | 1 + 2,4866·sd/f | D_B con la SD empírica del nulo, donde esté guardada. |
| D_C | 1 + 3,88·EE_rel | Solo en `pv10.py`; omite el factor 0,948. No usar. |

En D_A, 3,88 es el techo de ruido medido y 0,948 una calibración empírica: son constantes medidas, no derivadas.

**Regla:** comparar un efecto con el piso de su propio diseño. Un descubrimiento hecho en un barrido se compara con D_A; una réplica de una sola prueba, con D_B. Mezclarlos ya produjo un error (documento interno REPLICACION_CLASIFICACION_Y_AUDITORIA.md, §2, no incluido aquí). La razón de exceso (piso−1)/(RR−1) es informativa si ≤ 1.

## MDE degradado (Compuerta 1)
MDE_nom = MDE_ref·√(n_ref/n_ef); MDE_deg = MDE_nom/a; F = (MDE_deg/β)². Con a la atenuación y β el efecto de interés.

## Valores reproducidos
| Caso | Valor | Fuente |
|---|---|---|
| R1 (D_B) | 1,449 | `K2_pisos_exactos.csv` |
| Mercurio–Urano GCMT 1976–99 (D_B) | 1,216 | idem |
| README, n = 3.730, f = 5 % (D_A) | 1,263 | `README.md` |
| Marea y sismos, F | 3,17 | `resultados_C3.csv` |
| Marea y huracanes, F | 12,3 | idem |

Límite: las pruebas de F parten del MDE nominal y la atenuación ya calculados en `resultados_C3.csv`; no recalculan el MDE desde los datos.
`k2_step1_pisos.py` y `K2_pisos_exactos.csv` se incluyen para trazabilidad; el script necesita los logs de réplicas, que no están en este repositorio.
