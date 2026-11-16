# -*- coding: utf-8 -*-
"""
generar_efemerides.py — Tabla de longitudes eclípticas geocéntricas para la pestaña «Cielo y eventos».

Escribe datos/efemerides_6h.bin (uint16, centésimas de grado, [cuerpo][paso]) y datos/efemerides_6h.json
(inicio, paso en horas, número de pasos, orden de los cuerpos). El navegador interpola linealmente entre pasos
de 6 horas; con ese paso el error de la Luna es menor de 0,01° y el de los demás cuerpos es despreciable.

Fuente: JPL DE421 vía Skyfield; longitud eclíptica aparente de la fecha, vista desde el centro de la Tierra.
Uso:  python codigo/generar_efemerides.py [ruta/de421.bsp]
"""
import sys, json, os
import numpy as np
from skyfield.api import Loader

CUERPOS = ["sun", "moon", "mercury barycenter", "venus barycenter", "mars barycenter", "jupiter barycenter",
           "saturn barycenter", "uranus barycenter", "neptune barycenter", "pluto barycenter"]
NOMBRES = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"]
INICIO = (1970, 1, 1)
FIN = (2033, 1, 1)
PASO_H = 6


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else "de421.bsp"
    ld = Loader(os.path.dirname(os.path.abspath(ruta)) or ".", verbose=False)
    ts = ld.timescale(); eph = ld(os.path.basename(ruta)); tierra = eph["earth"]
    import datetime as dt
    d0 = dt.datetime(*INICIO, tzinfo=dt.timezone.utc); d1 = dt.datetime(*FIN, tzinfo=dt.timezone.utc)
    n = int((d1 - d0).total_seconds() / 3600 / PASO_H)
    horas = np.arange(n) * PASO_H
    out = np.empty((len(CUERPOS), n), dtype=np.uint16)
    for k in range(0, n, 30000):
        h = horas[k:k + 30000]; t = ts.utc(INICIO[0], INICIO[1], INICIO[2], h)
        for p, nombre in enumerate(CUERPOS):
            lon = tierra.at(t).observe(eph[nombre]).apparent().ecliptic_latlon(epoch="date")[1].degrees
            out[p, k:k + 30000] = np.round(lon * 100).astype(np.int64) % 36000
    carpeta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datos")
    out.tofile(os.path.join(carpeta, "efemerides_6h.bin"))
    meta = {"inicio_utc": "%04d-%02d-%02dT00:00:00Z" % INICIO, "paso_horas": PASO_H, "pasos": n, "escala": 0.01,
            "cuerpos": NOMBRES, "tipo": "uint16 little-endian, [cuerpo][paso]",
            "fuente": "JPL DE421 (Skyfield), longitud eclíptica aparente de la fecha, geocéntrica"}
    with open(os.path.join(carpeta, "efemerides_6h.json"), "w", encoding="utf-8") as f: json.dump(meta, f, ensure_ascii=False, indent=1)
    print("ok", out.shape, out.nbytes / 1e6, "MB")


if __name__ == "__main__":
    main()
