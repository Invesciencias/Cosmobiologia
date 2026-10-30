# -*- coding: utf-8 -*-
"""K2 paso 1: pisos de detección de las réplicas, recalculados desde entradas guardadas.

Definiciones (ver REPLICACION_CLASIFICACION_Y_AUDITORIA.md §1):
  D_B  piso de una prueba única preespecificada: 1 + 2,4866 * EE_rel, con EE_rel = sqrt((1-f)/(n*f))
       (2,4866 = 1,6449 + 0,8416: unilateral, alfa 0,05, potencia 80 %). Es la de replica_pistas.py y r3_ampliacion.py.
  D_Be igual, pero con la SD empírica del nulo: 1 + 2,4866 * sd/f (solo donde la SD está guardada o se reprodujo).
  D_A  piso del barrido de 398 rasgos (README.md; PAPER_METHODOLOGY): 1 + 3,88 * 0,948 * EE_rel.
  Razón de exceso = (piso - 1) / (RR del efecto - 1). Informativa si <= 1.
Entradas: logs de replica_pistas.log y r3_ampliacion.log (f con 4 decimales), data.js (descubrimiento USGS, exacto),
resultados_falla_inversa.csv (descubrimiento de Júpiter en el DSC, exacto), y la reproducción de Mercurio–Urano 1976–99
(mu_repro, K=200, semilla 42, n=2731: RR 1,0436, z +0,606; coincide con 1,044 y +0,61 del informe).
Uso: python k2_step1_pisos.py  (escribe K2_pisos_exactos.csv)
"""
import csv
import numpy as np

Z_B, Z_A, C = 2.4866, 3.88, 0.948
MU_EFFECT = 1.3153347972935312      # data.js: aspect|Mercury|Uranus|conjunction, USGS M>=6 2000-24, n=3730
R2_EFFECT = 1.171972629204072       # data.js: aspect|Mercury|Pluto|square, mismo conjunto
JDSC_EFFECT = 1.3737201365187732    # resultados_falla_inversa.csv: angular|Jupiter|DSC, n=2652
APOGEE_EFFECT = 1.1169272246634343  # resultados_gcmt_corregido_declusterizado.csv: lunar_distance|apogee (>400000 km), n=1147

# caso, n, f, sd_empirica, efecto, fuente, piso en logs/tablas (2 decimales)
CASOS = [
    ("MU 1976-99 (GCMT)", 2731, 0.046315, 0.003330, MU_EFFECT, "reproduccion mu_repro K=200 semilla 42", None),
    ("MU descubrimiento (USGS)", 3730, 0.0481024128686327, 0.002877993206785, MU_EFFECT, "data.js", 1.26),
    ("R1 MU conj, USGS M>=7 1900-75", 581, 0.0501, None, MU_EFFECT, "replica_pistas.log", 1.45),
    ("R2 M-Pluton cuadr, USGS M>=7 1900-75", 581, 0.0798, None, R2_EFFECT, "replica_pistas.log", 1.35),
    ("R3 Jupiter DSC, GCMT 2000-26 inv. sup.", 954, 0.0443, None, JDSC_EFFECT, "replica_pistas.log", 1.37),
    ("R3-ext Jupiter DSC, GCMT M5-5,99 2005-26 decl.", 781, 0.0506, None, JDSC_EFFECT, "r3_ampliacion.log", 1.39),
    ("R4a apogeo +-1 d, USGS M>=7 1900-75", 581, 42.7 / 581, None, APOGEE_EFFECT, "replica_pistas.log (esperado 42,7)", 1.37),
    ("R4b apogeo +-1 d, GCMT 2000-26", 3304, 243.1 / 3304, None, APOGEE_EFFECT, "replica_pistas.log (esperado 243,1)", 1.15),
]


def ee_rel(f, n):
    return np.sqrt((1 - f) / (n * f))


def main(out="K2_pisos_exactos.csv"):
    rows = []
    for nm, n, f, sd, eff, src, rep in CASOS:
        ee = ee_rel(f, n)
        dB = 1 + Z_B * ee
        dBe = 1 + Z_B * sd / f if sd else None
        dA = 1 + Z_A * C * ee
        rows.append({"caso": nm, "n": n, "f": round(f, 6), "EE_rel_binomial": round(ee, 5),
                     "EE_rel_empirica": round(sd / f, 5) if sd else "", "piso_D_B": round(dB, 4),
                     "piso_D_B_empirico": round(dBe, 4) if dBe else "", "piso_D_A": round(dA, 4),
                     "piso_reportado_2dec": rep if rep else "", "efecto_RR": round(eff, 4),
                     "razon_exceso_D_B": round((dB - 1) / (eff - 1), 3), "razon_exceso_D_A": round((dA - 1) / (eff - 1), 3),
                     "fuente_entradas": src})
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    for r in rows:
        print(r["caso"], r["piso_D_B"], r["piso_D_B_empirico"], r["piso_D_A"], r["razon_exceso_D_B"], r["razon_exceso_D_A"])


if __name__ == "__main__":
    main()
