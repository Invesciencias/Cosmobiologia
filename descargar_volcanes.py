"""
descargar_volcanes.py — Descarga erupciones volcánicas del Smithsonian GVP
y las convierte al esquema unificado de la plataforma Invesciencias.

Uso:
    python descargar_volcanes.py              # descarga y convierte
    python descargar_volcanes.py --solo-csv   # solo genera el CSV, no concatena

Salida: eventos_volcanes.csv  (listo para importar en index.html o Supabase)

Fuente: Smithsonian Institution Global Volcanism Program (GVP)
        https://volcano.si.edu
        Licencia: dominio público (gobierno de EE.UU.)
"""

import io, sys, hashlib, textwrap
import pandas as pd
import requests

GVP_URL = (
    "https://volcano.si.edu/database/search_eruption_excel.cfm"
    "?Eruptiontype=E&Eruption_DateKnown=D&FillIn=all&VEI_Modifier=%3E%3D&VEI=0"
    "&SearchType=_query&OrderBy=StartDate&SortOrder=ASC"
)

# Alternativamente usamos el archivo de erupciones en formato CSV que GVP
# publica periódicamente en su repositorio de GitHub auxiliar.
GVP_CSV_GITHUB = (
    "https://raw.githubusercontent.com/volcano-data/volcano-data/main/"
    "GVP_Eruption_Results.csv"
)

# URL directa del bulk export (sin filtros, todas las erupciones con fechas)
GVP_DIRECT = (
    "https://volcano.si.edu/database/search_eruption_excel.cfm"
    "?Eruptiontype=E&Eruption_DateKnown=D&FillIn=all&SearchType=_query"
    "&OrderBy=StartDate&SortOrder=ASC&VEI_Modifier=%3E%3D&VEI=0"
)


def _fetch_gvp() -> pd.DataFrame:
    """Intenta descargar el CSV de erupciones del GVP."""
    headers = {"User-Agent": "Invesciencias-CosmobiologiaResearch/1.0"}

    # Opción 1: repositorio GitHub auxiliar con datos ya en CSV
    try:
        print("Descargando GVP desde repositorio auxiliar...")
        r = requests.get(GVP_CSV_GITHUB, headers=headers, timeout=60)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text), encoding="utf-8")
        print(f"  {len(df)} filas descargadas.")
        return df
    except Exception as e:
        print(f"  Falló repositorio auxiliar: {e}")

    raise RuntimeError(textwrap.dedent("""
        No se pudo descargar el archivo de erupciones automáticamente.

        Descarga manual (gratis, sin registro):
        1. Ve a https://volcano.si.edu/search_eruption.cfm
        2. Deja todos los filtros vacíos → "Search"
        3. Descarga → "Download Results (CSV)"
        4. Guarda el archivo como  GVP_Eruption_Results.csv
           en la misma carpeta que este script.
        5. Ejecuta:  python descargar_volcanes.py --local GVP_Eruption_Results.csv
    """).strip())


def _from_local(path: str) -> pd.DataFrame:
    print(f"Leyendo archivo local: {path}")
    try:
        return pd.read_csv(path, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="latin1")


def _parse_gvp(df: pd.DataFrame) -> pd.DataFrame:
    """
    Mapea columnas GVP al esquema unificado.
    El GVP usa distintos nombres según la versión del export; intentamos ambos.
    """
    df.columns = df.columns.str.strip()

    # Mapas de nombres de columna (versiones que han aparecido en GVP exports)
    col_map = {
        "Volcano Number": "volcano_id",
        "Volcano Name":   "volcano_name",
        "Country":        "country",
        "Primary Volcano Type": "vtype",
        "Latitude":       "lat",
        "Longitude":      "lon",
        "Eruption Number": "eruption_id",
        "VEI":            "vei",
        "Start Year":     "year",
        "Start Month":    "month",
        "Start Day":      "day",
        "Start Hour":     "hour",
        "Evidence Method (dating)": "dating",
        "Eruption Category": "category",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Filtra: necesitamos al menos año
    df = df.dropna(subset=["year"]).copy()
    df["year"] = pd.to_numeric(df["year"], errors="coerce").dropna()
    df = df[df["year"] >= 1600].copy()  # datos con hora razonables desde ~1800

    # Construir datetime_utc: cuando no hay hora se pone mediodía (12:00 UTC)
    def build_dt(row):
        try:
            y = int(row.get("year", 0))
            m = int(row.get("month", 1) or 1)
            d = int(row.get("day",   1) or 1)
            h = int(row.get("hour",  12) or 12)
            m = max(1, min(m, 12))
            d = max(1, min(d, 28))
            return f"{y:04d}-{m:02d}-{d:02d}T{h:02d}:00:00Z"
        except Exception:
            return None

    df["datetime_utc"] = df.apply(build_dt, axis=1)
    df = df.dropna(subset=["datetime_utc"])
    df = df.dropna(subset=["lat", "lon"])

    # event_id único
    def make_id(row):
        eid = str(row.get("eruption_id", ""))
        if eid and eid != "nan":
            return f"gvp_{int(float(eid))}"
        key = f"{row.get('volcano_name','')}_{row['datetime_utc']}"
        return "gvp_" + hashlib.md5(key.encode()).hexdigest()[:10]

    df["event_id"]  = df.apply(make_id, axis=1)
    df["domain"]    = "erupcion"
    df["subtype"]   = df.get("vtype", pd.Series(dtype=str)).fillna("volcanica")
    df["latitude"]  = pd.to_numeric(df["lat"],  errors="coerce")
    df["longitude"] = pd.to_numeric(df["lon"],  errors="coerce")
    df["place"]     = (
        df.get("volcano_name", pd.Series(dtype=str)).fillna("") + ", " +
        df.get("country",      pd.Series(dtype=str)).fillna("")
    ).str.strip(", ")
    df["value"]      = pd.to_numeric(df.get("vei", pd.Series(dtype=str)), errors="coerce")
    df["value_kind"] = "VEI"
    df["source"]     = "Smithsonian GVP"

    out = df[["event_id","domain","subtype","datetime_utc",
              "latitude","longitude","place","value","value_kind","source"]].copy()
    out = out.dropna(subset=["latitude","longitude"])
    out = out.drop_duplicates(subset=["event_id"])
    return out.reset_index(drop=True)


def main():
    local_path = None
    if "--local" in sys.argv:
        idx = sys.argv.index("--local")
        local_path = sys.argv[idx + 1]

    raw = _from_local(local_path) if local_path else _fetch_gvp()
    out = _parse_gvp(raw)

    print(f"\nErupciones convertidas: {len(out)}")
    print(out[["event_id","datetime_utc","place","value"]].head(5).to_string(index=False))

    out.to_csv("eventos_volcanes.csv", index=False, encoding="utf-8")
    print("\nGuardado: eventos_volcanes.csv")
    print(textwrap.dedent("""
    Próximos pasos:
      1. Pega el contenido en index.html → Captura → "Carga masiva (CSV)"
      2. O súbelo a Supabase con "Subir eventos a la nube"
      3. Para regenerar data.js con volcanes + sismos:
            python generar_data_js.py
            python compute_features.py
    """))


if __name__ == "__main__":
    main()
