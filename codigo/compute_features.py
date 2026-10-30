"""
compute_features.py — Precalcula las características de carta de cada evento y las
embebe (compactas) en features.js, para que la página compare al vuelo cualquier
subconjunto (una zona del mapa, un rango de años) contra el resto.

Por evento se guardan solo los ÍNDICES de las características presentes (aspectos
dentro de orbe + planeta en casa), lo que mantiene el archivo pequeño.
"""
import json
import numpy as np
import pandas as pd

import charts

ev = pd.read_csv("eventos.csv")
dt = pd.to_datetime(ev["datetime_utc"], utc=True)
lat = ev["latitude"].to_numpy(float)
lon = ev["longitude"].to_numpy(float)
n = len(ev)
print(f"Calculando características de {n} eventos...")

res = charts.compute_charts(dt.values, lat, lon, include_node=True, include_angles=True)

# Construir lista de nombres de características y matriz booleana
feature_names = []
bool_cols = []

for (p1, p2, asp), hit in res["aspect_hits"].items():
    feature_names.append(f"aspect|{p1}|{p2}|{asp}")
    bool_cols.append(np.asarray(hit, dtype=bool))

for planet, houses in res["houses"].items():
    for h in range(1, 13):
        feature_names.append(f"house|{planet}|{h}")
        bool_cols.append(np.asarray(houses) == h)

mat = np.vstack(bool_cols).T  # (n_eventos, n_features)
print(f"{mat.shape[1]} características, densidad media {mat.sum(1).mean():.1f}/evento")

# Por evento: índices de características presentes
event_feats = [np.nonzero(row)[0].tolist() for row in mat]

with open("features.js", "w", encoding="utf-8") as f:
    f.write("// Características de carta por evento (índices presentes). "
            "Regenerar: python compute_features.py\n")
    f.write("window.FEATURE_NAMES=" + json.dumps(feature_names, separators=(",", ":")) + ";\n")
    f.write("window.EVENT_FEATURES=" + json.dumps(event_feats, separators=(",", ":")) + ";\n")

import os
print(f"features.js generado: {os.path.getsize('features.js')/1e6:.2f} MB")
