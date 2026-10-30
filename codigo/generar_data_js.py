"""
generar_data_js.py — Embebe eventos.csv y resultados_estadisticos.csv en data.js
para que index.html muestre todo por defecto sin necesidad de servidor.
"""
import json
import pandas as pd

FIELDS = ["event_id", "domain", "subtype", "datetime_utc", "latitude",
          "longitude", "place", "value", "value_kind", "source"]

ev = pd.read_csv("eventos.csv")
for c in FIELDS:
    if c not in ev.columns:
        ev[c] = ""
ev = ev[FIELDS].where(pd.notnull(ev[FIELDS]), None)
events = ev.to_dict(orient="records")

res = pd.read_csv("resultados_estadisticos.csv")
results = res.where(pd.notnull(res), None).to_dict(orient="records")

with open("data.js", "w", encoding="utf-8") as f:
    f.write("// Datos de ejemplo embebidos (Fase 1: sismos USGS).\n")
    f.write("// Regenerar con: python generar_data_js.py\n")
    f.write("window.DEFAULT_EVENTS=" + json.dumps(events, separators=(",", ":"), ensure_ascii=False) + ";\n")
    f.write("window.DEFAULT_RESULTS=" + json.dumps(results, separators=(",", ":"), ensure_ascii=False) + ";\n")

import os
print(f"data.js generado: {len(events)} eventos, {len(results)} resultados, "
      f"{os.path.getsize('data.js')/1e6:.2f} MB")
