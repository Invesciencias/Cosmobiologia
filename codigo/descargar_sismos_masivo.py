"""
descargar_sismos_masivo.py — Descarga sismos M≥4 de USGS FDSN por lotes
y los convierte al esquema unificado, listos para análisis estratificado.

La API de USGS tiene un límite de 20,000 eventos por consulta, por eso
este script divide la descarga en ventanas de 3 meses y las concatena.

Uso:
    python descargar_sismos_masivo.py                  # M≥4, 2000-2024
    python descargar_sismos_masivo.py --minmag 5       # solo M≥5
    python descargar_sismos_masivo.py --inicio 2010 --fin 2020

Salida: eventos_sismos_masivo.csv
"""

import sys, time, hashlib
import pandas as pd
import requests
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

def fetch_window(start: str, end: str, minmag: float) -> pd.DataFrame:
    """Descarga un intervalo de tiempo del catálogo USGS."""
    params = {
        "format":     "csv",
        "starttime":  start,
        "endtime":    end,
        "minmagnitude": minmag,
        "orderby":    "time-asc",
        "limit":      20000,
    }
    r = requests.get(USGS_URL, params=params, timeout=120,
                     headers={"User-Agent": "Invesciencias-Cosmobiologia/1.0"})
    r.raise_for_status()
    if not r.text.strip() or r.text.startswith("Error"):
        return pd.DataFrame()
    df = pd.read_csv(pd.io.common.StringIO(r.text))
    return df

def convert_usgs(df: pd.DataFrame) -> pd.DataFrame:
    """Mapea columnas USGS al esquema unificado."""
    if df.empty:
        return pd.DataFrame()
    df = df.copy()
    df["time"] = pd.to_datetime(df["time"], utc=True)

    out = pd.DataFrame()
    out["event_id"]     = df["id"].astype(str)
    out["domain"]       = "sismo"
    out["subtype"]      = df.get("type", "earthquake").fillna("earthquake")
    out["datetime_utc"] = df["time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    out["latitude"]     = pd.to_numeric(df["latitude"],  errors="coerce")
    out["longitude"]    = pd.to_numeric(df["longitude"], errors="coerce")
    out["place"]        = df["place"].fillna("")
    out["value"]        = pd.to_numeric(df["mag"],       errors="coerce")
    out["value_kind"]   = df.get("magType", "mag").fillna("mag")
    out["source"]       = "USGS"

    # Campos extras útiles para estratificación — en extra_json
    extras = []
    for _, row in df.iterrows():
        e = {}
        if "depth" in df.columns:
            e["depth_km"] = row.get("depth")
        if "magType" in df.columns:
            e["magType"] = row.get("magType")
        if "net" in df.columns:
            e["net"] = row.get("net")
        extras.append(str(e).replace("'", '"'))
    out["extra_json"] = extras

    return out.dropna(subset=["latitude","longitude","datetime_utc"])

def main():
    minmag = 4.0
    inicio_year = 2000
    fin_year    = 2024

    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--minmag"  and i+2 <= len(sys.argv)-1: minmag = float(sys.argv[i+2])
        if arg == "--inicio"  and i+2 <= len(sys.argv)-1: inicio_year = int(sys.argv[i+2])
        if arg == "--fin"     and i+2 <= len(sys.argv)-1: fin_year    = int(sys.argv[i+2])

    print(f"Descargando sismos M≥{minmag} ({inicio_year}–{fin_year}) en ventanas de 3 meses...")
    print("USGS permite 20,000 por consulta. Si una ventana llega al límite, subdivide.")

    partes = []
    cursor = datetime(inicio_year, 1, 1)
    fin    = datetime(fin_year,    12, 31)

    while cursor < fin:
        siguiente = min(cursor + relativedelta(months=3), fin)
        start_s   = cursor.strftime("%Y-%m-%d")
        end_s     = siguiente.strftime("%Y-%m-%d")
        try:
            df = fetch_window(start_s, end_s, minmag)
            n  = len(df)
            print(f"  {start_s} → {end_s}: {n} sismos", end="")
            if n >= 19000:
                print("  ⚠ CERCA DEL LÍMITE — considera --minmag más alto o ventanas más cortas")
            else:
                print()
            if n > 0:
                partes.append(convert_usgs(df))
        except Exception as e:
            print(f"  ERROR en {start_s}–{end_s}: {e}")
        cursor = siguiente
        time.sleep(0.5)   # cortesía al servidor de USGS

    if not partes:
        print("Sin datos descargados.")
        return

    total = pd.concat(partes, ignore_index=True).drop_duplicates("event_id")
    total.to_csv("eventos_sismos_masivo.csv", index=False, encoding="utf-8")
    print(f"\nTotal sismos descargados: {len(total)}")
    print("Guardado: eventos_sismos_masivo.csv")
    print()
    print("Distribución por magnitud:")
    total["mag_bin"] = pd.cut(total["value"],
                               bins=[4,5,6,7,8,10],
                               labels=["M4-5","M5-6","M6-7","M7-8","M≥8"])
    print(total["mag_bin"].value_counts().sort_index().to_string())
    print()
    print("Próximos pasos:")
    print("  python nullmodel.py eventos_sismos_masivo.csv 500")
    print("  python generar_data_js.py  (apunta al nuevo CSV)")
    print("  python compute_features.py")

if __name__ == "__main__":
    main()
