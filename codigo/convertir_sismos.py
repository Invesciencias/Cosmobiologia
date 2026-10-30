"""
convertir_sismos.py — Convierte el CSV de USGS (query.csv) al esquema
generalizado de eventos de Invesciencias (eventos.csv).
"""
import sys
import json
import pandas as pd

src = sys.argv[1] if len(sys.argv) > 1 else "../query.csv"
dst = sys.argv[2] if len(sys.argv) > 2 else "eventos.csv"

df = pd.read_csv(src)
out = pd.DataFrame({
    "event_id": df["id"],
    "domain": "sismo",
    "subtype": df.get("type", "earthquake"),
    "datetime_utc": pd.to_datetime(df["time"], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "latitude": df["latitude"],
    "longitude": df["longitude"],
    "place": df.get("place", ""),
    "value": df["mag"],
    "value_kind": "mag_" + df.get("magType", "").astype(str),
    "source": "USGS",
})
out["extra_json"] = df.apply(
    lambda r: json.dumps({"depth_km": r.get("depth")}), axis=1)

out.to_csv(dst, index=False)
print(f"{len(out)} eventos -> {dst}")
print(out.head().to_string(index=False))
