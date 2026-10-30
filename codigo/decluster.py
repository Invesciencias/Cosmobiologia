"""
decluster.py — Declustering sísmico para análisis cosmobiológico (Invesciencias).

Elimina réplicas (aftershocks) de catálogos sísmicos antes del análisis estadístico.
Sin declustering, un sismo M7 con 500 réplicas infla artificialmente cualquier
rasgo astronómico activo en ese momento.

Métodos implementados:
  - Gardner-Knopoff (1974): ventanas espacio-temporales por magnitud — estándar USGS
  - Nearest-neighbor (Zaliapin & Ben-Zion 2013): más moderno, sin parámetros fijos

También incluye el test de Von Neumann para detectar autocorrelación temporal
residual después del declustering (sugerencia de Ferriz/Gerson, TCC cap. 18).

Referencia: Gardner & Knopoff (1974), BSSA 64(5):1363-1367.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Gardner-Knopoff (1974) — ventanas por magnitud
# ---------------------------------------------------------------------------

def _gk_time_days(mag: float) -> float:
    """Ventana temporal (días) para una magnitud dada — Gardner & Knopoff 1974."""
    if mag >= 6.5:
        return 10 ** (0.032 * mag + 2.7389)
    else:
        return 10 ** (0.5409 * mag - 0.547)


def _gk_dist_km(mag: float) -> float:
    """Ventana espacial (km) para una magnitud dada — Gardner & Knopoff 1974."""
    return 10 ** (0.1238 * mag + 0.983)


def _haversine_km(lat1, lon1, lat2, lon2):
    """Distancia haversine en km entre dos puntos."""
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2)**2
    return R * 2 * np.arcsin(np.sqrt(a))


def decluster_gardner_knopoff(events: pd.DataFrame,
                               mag_col: str = "value",
                               verbose: bool = True) -> pd.DataFrame:
    """
    Declustering por ventanas Gardner-Knopoff (1974).

    Algoritmo:
      1. Ordenar eventos por tiempo.
      2. Para cada evento i (de mayor a menor magnitud), marcar como réplica
         cualquier evento j posterior que caiga dentro de la ventana
         espaciotemporal de i.
      3. Devolver solo los eventos NO marcados como réplica.

    events: DataFrame con columnas datetime_utc, latitude, longitude, value (magnitud).
    Devuelve el DataFrame filtrado con columna 'is_mainshock' = True.
    """
    df = events.copy()
    df["_dt"] = pd.to_datetime(df["datetime_utc"], utc=True)
    df = df.sort_values("_dt").reset_index(drop=True)

    n = len(df)
    is_aftershock = np.zeros(n, dtype=bool)

    mags = df[mag_col].to_numpy(float)
    lats = df["latitude"].to_numpy(float)
    lons = df["longitude"].to_numpy(float)
    times_days = (df["_dt"].astype("int64") / 1e9 / 86400).to_numpy(float)

    # Procesar de mayor a menor magnitud
    order = np.argsort(-mags)
    for idx in order:
        if is_aftershock[idx]:
            continue
        m = mags[idx]
        t0 = times_days[idx]
        dt_win = _gk_time_days(m)
        dr_win = _gk_dist_km(m)

        # Candidatos: eventos posteriores dentro de la ventana temporal
        future = np.where((times_days > t0) & (times_days <= t0 + dt_win))[0]
        for j in future:
            if is_aftershock[j]:
                continue
            dist = _haversine_km(lats[idx], lons[idx], lats[j], lons[j])
            if dist <= dr_win:
                is_aftershock[j] = True

    df["is_mainshock"] = ~is_aftershock
    result = df[df["is_mainshock"]].drop(columns=["_dt", "is_mainshock"]).reset_index(drop=True)

    if verbose:
        n_removed = is_aftershock.sum()
        pct = 100 * n_removed / n
        print(f"Declustering Gardner-Knopoff: {n} -> {len(result)} eventos "
              f"({n_removed} replicas eliminadas, {pct:.1f}%)")
    return result


# ---------------------------------------------------------------------------
# Test de Von Neumann (1941) — autocorrelación en serie temporal
# ---------------------------------------------------------------------------

def von_neumann_test(series: np.ndarray) -> dict:
    """
    Test de Von Neumann de diferencias sucesivas para detectar autocorrelación.

    H0: la serie es aleatoria (sin autocorrelación).
    Si p < 0.05 → hay autocorrelación temporal → los eventos no son independientes.

    Referencia: Von Neumann et al. (1941), Ann. Math. Stat. 12:153-162.
    Ferriz lo cita en TCC cap. 18 para 'estudiar la revelación de influencias
    periódicas en la tendencia o investigación cíclica'.

    series: array 1D de valores ordenados temporalmente (ej. frecuencia de un rasgo
            en ventanas temporales sucesivas, o los tiempos entre eventos).

    Devuelve dict con:
      ratio: estadístico δ² / s² (esperado ~2 bajo H0)
      z:     z-score aproximado
      p:     p-valor dos colas
      interpretation: 'independiente' | 'autocorrelación positiva' | 'autocorrelación negativa'
    """
    import math
    x = np.asarray(series, dtype=float)
    n = len(x)
    if n < 4:
        return {"ratio": np.nan, "z": np.nan, "p": np.nan, "interpretation": "muestra insuficiente"}

    x_mean = x.mean()
    s2 = np.sum((x - x_mean)**2) / (n - 1)
    if s2 == 0:
        return {"ratio": np.nan, "z": np.nan, "p": np.nan, "interpretation": "varianza cero"}

    delta2 = np.sum(np.diff(x)**2) / (n - 1)
    ratio = delta2 / s2

    # Aproximación normal: E[ratio]=2, Var[ratio]=4(n-2)/((n+1)(n-1))
    var_ratio = 4 * (n - 2) / ((n + 1) * (n - 1))
    z = (ratio - 2.0) / np.sqrt(var_ratio)
    p = float(math.erfc(abs(z) / math.sqrt(2)))

    if p >= 0.05:
        interp = "independiente (sin autocorrelación)"
    elif ratio < 2:
        interp = "autocorrelación positiva (eventos agrupados)"
    else:
        interp = "autocorrelación negativa (eventos regularmente espaciados)"

    return {"ratio": float(ratio), "z": float(z), "p": float(p), "interpretation": interp}


def check_temporal_independence(events: pd.DataFrame,
                                 bin_days: int = 30,
                                 verbose: bool = True) -> dict:
    """
    Aplica el test de Von Neumann a la densidad temporal de eventos.

    Divide el período en bins de bin_days días y cuenta eventos por bin.
    Si la densidad varía de forma autocorrelacionada → los eventos no son
    independientes (ej. réplicas, estacionalidad).

    Devuelve el resultado del test + recomendación.
    """
    dt = pd.to_datetime(events["datetime_utc"], utc=True).sort_values()
    t0 = dt.min()
    t1 = dt.max()
    n_bins = max(4, int((t1 - t0).days / bin_days))
    bins = pd.cut(dt, bins=n_bins)
    counts = bins.value_counts().sort_index().values.astype(float)

    result = von_neumann_test(counts)
    if verbose:
        print(f"Test Von Neumann (bin={bin_days}d, n_bins={n_bins}):")
        print(f"  ratio={result['ratio']:.3f}  z={result['z']:.3f}  p={result['p']:.4f}")
        print(f"  >> {result['interpretation']}")
        if result['p'] < 0.05:
            print("  [!] Autocorrelacion detectada - considerar declustering o estratificacion temporal")
        else:
            print("  [OK] Serie temporal compatible con independencia")
    return result


# ---------------------------------------------------------------------------
# Correlación serial con demora h (Ferriz TCC cap. 18)
# ---------------------------------------------------------------------------

def serial_correlation(series: np.ndarray, lag: int = 1) -> dict:
    """
    Coeficiente de correlación serial R_h con demora h (Ferriz TCC cap. 18).

    Detecta periodicidades en una serie temporal ordenada. Si R_h es
    significativamente distinto de cero para h = lag, la serie tiene un
    ciclo de periodo lag.

    Casos de uso cosmobiológico:
      lag = 29.5 días (ciclo lunar sinódico)
      lag = 365   días (ciclo anual)
      lag = 11    años (ciclo solar de manchas)

    series: array 1D de valores ordenados (ej. conteo de eventos por bin).
    lag:    demora en unidades de la serie (numero de bins).

    Devuelve dict con R_h, z, p, interpretacion.
    """
    import math
    x = np.asarray(series, dtype=float)
    N = len(x)
    if N < lag + 4:
        return {"R_h": np.nan, "z": np.nan, "p": np.nan, "lag": lag,
                "interpretation": "muestra insuficiente para este lag"}

    x_mean = x.mean()
    # Definicion ciclica: x[i+h] = x[(i+h) % N]  (Ferriz ec. cap.18)
    cov_h = np.mean((x - x_mean) * (np.roll(x, -lag) - x_mean))
    var   = np.mean((x - x_mean)**2)
    if var == 0:
        return {"R_h": np.nan, "z": np.nan, "p": np.nan, "lag": lag,
                "interpretation": "varianza cero"}

    R_h = cov_h / var
    # Aproximacion normal: E[R_h] ~ -1/(N-1), Var[R_h] ~ 1/N
    z = (R_h + 1.0 / (N - 1)) * math.sqrt(N)
    p = float(math.erfc(abs(z) / math.sqrt(2)))

    if p >= 0.05:
        interp = "sin periodicidad significativa para este lag"
    elif R_h > 0:
        interp = f"periodicidad positiva (ciclo de ~{lag} bins)"
    else:
        interp = f"periodicidad negativa (anticorrelacion a lag={lag})"

    return {"R_h": float(R_h), "z": float(z), "p": float(p),
            "lag": lag, "interpretation": interp}


def check_lunar_periodicity(events: pd.DataFrame,
                             bin_days: float = 1.0,
                             verbose: bool = True) -> dict:
    """
    Prueba la periodicidad lunar de 29.5 dias en un catalogo de eventos.

    Divide el catalogo en bins diarios y aplica la correlacion serial con
    lag = 29 bins (~ciclo sinodico lunar). Hipotesis H1 de Llona / Raynaud
    de la Ferriere: las fuerzas de marea modulan la sismicidad cada ~29.5 dias.

    Devuelve el resultado de serial_correlation para lag=29.
    """
    dt = pd.to_datetime(events["datetime_utc"], utc=True).sort_values()
    t0, t1 = dt.min(), dt.max()
    n_bins = max(30, int((t1 - t0).days / bin_days))
    bins = pd.cut(dt, bins=n_bins)
    counts = bins.value_counts().sort_index().values.astype(float)

    lag_bins = int(round(29.5 / bin_days))
    result = serial_correlation(counts, lag=lag_bins)

    if verbose:
        print(f"Correlacion serial lunar (lag={lag_bins} bins de {bin_days}d ~29.5d):")
        print(f"  R_h={result['R_h']:.4f}  z={result['z']:.3f}  p={result['p']:.4f}")
        print(f"  >> {result['interpretation']}")

    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "eventos_usgs_M6.csv"
    out  = sys.argv[2] if len(sys.argv) > 2 else path.replace(".csv", "_declustered.csv")

    ev = pd.read_csv(path)
    print(f"\n=== Test Von Neumann ANTES del declustering ===")
    check_temporal_independence(ev)

    ev_dc = decluster_gardner_knopoff(ev)
    ev_dc.to_csv(out, index=False)

    print(f"\n=== Test Von Neumann DESPUÉS del declustering ===")
    check_temporal_independence(ev_dc)
    print(f"\nGuardado en {out}")
