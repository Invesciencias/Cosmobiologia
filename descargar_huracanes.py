"""
descargar_huracanes.py — Descarga ciclones tropicales de NOAA HURDAT2
(Atlántico + Pacífico Este/Central) y los convierte al esquema unificado.

Uso:
    python descargar_huracanes.py              # descarga ambas cuencas
    python descargar_huracanes.py --local hurdat2_atlantic.txt --cuenca ATL

Salida: eventos_huracanes.csv

Fuente: NOAA National Hurricane Center (NHC) — dominio público
  Atlántico: https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2023-051124.txt
  Pacífico:  https://www.nhc.noaa.gov/data/hurdat/hurdat2-nepac-1949-2023-042624.txt

Evento registrado = momento de MÁXIMA INTENSIDAD del ciclón (pico de viento),
que es cuando la influencia sobre la Tierra es máxima y tiene sentido
cosmobiológico (una tormenta nace gradualmente; su pico es un instante definido).
También se puede usar la génesis (TROPICAL DEPRESSION) si se prefiere el origen.
"""

import io, sys, hashlib, textwrap
import pandas as pd
import requests

HURDAT2_URLS = {
    "ATL": "https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2023-051124.txt",
    "PAC": "https://www.nhc.noaa.gov/data/hurdat/hurdat2-nepac-1949-2023-042624.txt",
}

# Para cosmobiología usamos el momento de pico de intensidad.
# STATUS más intensos en HURDAT2: HU (hurricane), TY (typhoon), MH (major hurricane)
# STATUS de génesis: TD (tropical depression), TS (tropical storm)
MODO = "pico"   # "pico" | "genesis"


def _fetch(url: str) -> str:
    print(f"  Descargando: {url}")
    r = requests.get(url, timeout=120,
                     headers={"User-Agent": "Invesciencias-CosmobiologiaResearch/1.0"})
    r.raise_for_status()
    return r.text


def _parse_hurdat2(text: str, cuenca: str, modo: str = "pico") -> pd.DataFrame:
    """
    Formato HURDAT2:
      Línea de encabezado: ID, nombre, nº registros
      Líneas de datos:     YYYYMMDD, HHMM, identificador, status,
                           lat, lon, viento_max_kt, presion_min_mb, ...
    """
    rows = []
    storm_id = storm_name = None
    records = []

    def best_record(recs, modo):
        """Selecciona el registro más relevante del ciclón."""
        if not recs:
            return None
        df = pd.DataFrame(recs)
        if modo == "pico":
            return df.loc[df["wind"].idxmax()]
        else:  # genesis: primer registro
            return df.iloc[0]

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split(",")]

        # Línea de encabezado del ciclón (empieza con AL o EP/CP)
        if parts[0].startswith(("AL", "EP", "CP")) and len(parts) >= 3:
            # Guardar tormenta anterior
            if records:
                rec = best_record(records, modo)
                if rec is not None:
                    rows.append(rec)
            storm_id   = parts[0]
            storm_name = parts[1].strip()
            records    = []
            continue

        # Línea de datos
        if len(parts) < 7 or storm_id is None:
            continue
        try:
            date_str = parts[0].strip()   # YYYYMMDD
            time_str = parts[1].strip()   # HHMM
            # status   = parts[3].strip() # TD, TS, HU, EX, SS, NR, DB, LO, WV
            lat_s    = parts[4].strip()
            lon_s    = parts[5].strip()
            wind     = float(parts[6])    # kt max sustained wind

            y, m, d  = int(date_str[:4]), int(date_str[4:6]), int(date_str[6:8])
            hh, mm   = int(time_str[:2]), int(time_str[2:4])

            lat = float(lat_s[:-1]) * (-1 if lat_s.endswith("S") else 1)
            lon = float(lon_s[:-1]) * (-1 if lon_s.endswith("W") else 1)

            records.append({
                "storm_id":   storm_id,
                "storm_name": storm_name,
                "cuenca":     cuenca,
                "year": y, "month": m, "day": d, "hour": hh, "minute": mm,
                "lat": lat, "lon": lon,
                "wind": wind,
                "datetime_utc": f"{y:04d}-{m:02d}-{d:02d}T{hh:02d}:{mm:02d}:00Z",
            })
        except (ValueError, IndexError):
            continue

    # Última tormenta
    if records:
        rec = best_record(records, modo)
        if rec is not None:
            rows.append(rec)

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df[df["wind"] >= 34]   # al menos tormenta tropical (≥34 kt)

    # event_id único
    def make_id(row):
        key = f"{row['storm_id']}_{row['datetime_utc']}"
        return f"nhc_{row['storm_id']}_{hashlib.md5(key.encode()).hexdigest()[:6]}"

    df["event_id"]  = df.apply(make_id, axis=1)
    df["domain"]    = "huracan"
    df["subtype"]   = df["cuenca"].apply(
        lambda c: "atlantico" if c == "ATL" else "pacifico_este")
    df["latitude"]  = df["lat"]
    df["longitude"] = df["lon"]
    df["place"]     = df["storm_name"] + " (" + df["storm_id"] + ")"
    df["value"]     = df["wind"]          # viento máximo en kt
    df["value_kind"] = "wind_kt"
    df["source"]    = "NOAA HURDAT2"

    return df[["event_id","domain","subtype","datetime_utc",
               "latitude","longitude","place","value","value_kind","source"]
             ].drop_duplicates("event_id").reset_index(drop=True)


def main():
    local_path = None
    cuenca_local = "ATL"
    if "--local" in sys.argv:
        idx = sys.argv.index("--local")
        local_path = sys.argv[idx + 1]
        if "--cuenca" in sys.argv:
            cuenca_local = sys.argv[sys.argv.index("--cuenca") + 1]

    partes = []

    if local_path:
        txt = open(local_path, encoding="utf-8", errors="replace").read()
        partes.append(_parse_hurdat2(txt, cuenca_local, MODO))
    else:
        for cuenca, url in HURDAT2_URLS.items():
            try:
                txt = _fetch(url)
                df  = _parse_hurdat2(txt, cuenca, MODO)
                print(f"  {cuenca}: {len(df)} ciclones con pico convertido")
                partes.append(df)
            except Exception as e:
                print(f"  {cuenca} FALLÓ: {e}")

    if not partes:
        print("Sin datos. Verifica la conexión o usa --local.")
        sys.exit(1)

    out = pd.concat(partes, ignore_index=True)
    print(f"\nCiclones totales convertidos: {len(out)}")
    print(out[["event_id","datetime_utc","place","value"]].head(5).to_string(index=False))

    out.to_csv("eventos_huracanes.csv", index=False, encoding="utf-8")
    print("\nGuardado: eventos_huracanes.csv")
    print(textwrap.dedent("""
    Próximos pasos:
      1. Pega el contenido en index.html → Captura → "Carga masiva (CSV)"
      2. O súbelo a Supabase con "Subir eventos a la nube"
      3. Para regenerar data.js con todos los dominios:
            python generar_data_js.py
            python compute_features.py
    """))


if __name__ == "__main__":
    main()
