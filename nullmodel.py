"""
nullmodel.py — Prueba estadística falseable por modelo nulo (Invesciencias).

Compara la frecuencia de cada rasgo astrológico (aspectos, planetas en casa) en
los eventos REALES contra la frecuencia esperada por AZAR, generando K conjuntos
de control: instantes aleatorios dentro de la misma ventana temporal del estudio,
manteniendo las mismas ubicaciones (controla la geografía y la época de las
efemérides, que es de donde vienen los falsos positivos de los planetas lentos).

Salida: tabla con frecuencia observada, esperada (nula), tamaño de efecto,
z-score, p-valor de Monte Carlo y p-valor corregido por FDR (Benjamini-Hochberg).

Dependencias: numpy, pandas, charts.py.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

import charts


# ---------------------------------------------------------------------------
def _feature_fractions(res, n):
    """Calcula la fracción de eventos que presenta cada rasgo a partir de un
    resultado de charts.compute_charts."""
    fr = {}
    # Aspectos
    for key, hit in res["aspect_hits"].items():
        p1, p2, asp = key
        fr[f"aspect|{p1}|{p2}|{asp}"] = float(np.sum(hit)) / n
    # Planeta en casa
    for planet, houses in res["houses"].items():
        for h in range(1, 13):
            fr[f"house|{planet}|{h}"] = float(np.sum(houses == h)) / n
    return fr


def benjamini_hochberg(pvals):
    """Devuelve p-valores corregidos por FDR (Benjamini-Hochberg)."""
    p = np.asarray(pvals, dtype=float)
    n = len(p)
    order = np.argsort(p)
    ranked = p[order] * n / (np.arange(n) + 1)
    # imponer monotonicidad
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty(n)
    out[order] = np.clip(ranked, 0, 1)
    return out


def run_null_test(events: pd.DataFrame, k: int = 200, seed: int = 42,
                  shuffle_locations: bool = False, verbose: bool = True,
                  include_node: bool = False, include_angles: bool = False,
                  null_mode: str = "matched", match_window_days: float = 30.0):
    """
    events: DataFrame con columnas 'datetime_utc' (parseable), 'latitude',
            'longitude'.
    k: número de réplicas de control.
    shuffle_locations: si True, en cada réplica baraja las ubicaciones (rompe
            cualquier acoplamiento espacio-temporal).
    null_mode:
      - "matched" (por defecto): cada control se sortea cerca de la fecha del
        evento real (±match_window_days). Preserva los planetas lentos y la
        densidad temporal del catálogo → ELIMINA el artefacto de muestreo y
        aísla los ciclos rápidos (Luna, Mercurio, Venus, Sol, casas, Asc/MC).
      - "uniform": tiempos uniformes en toda la ventana. ⚠ Confunde cualquier
        configuración de planetas lentos con el sesgo de cobertura del catálogo.
    match_window_days: semiancho de la ventana de emparejamiento (modo matched).

    Devuelve un DataFrame ordenado por p-valor corregido.
    """
    rng = np.random.default_rng(seed)
    dt = pd.to_datetime(events["datetime_utc"], utc=True)
    lat = events["latitude"].to_numpy(dtype=float)
    lon = events["longitude"].to_numpy(dtype=float)
    n = len(events)

    t_min = dt.min().value  # nanosegundos epoch
    t_max = dt.max().value

    # --- Observado ---
    if verbose:
        print(f"Calculando cartas de {n} eventos reales...")
    obs_res = charts.compute_charts(dt.values, lat, lon,
                                    include_node=include_node,
                                    include_angles=include_angles)
    obs_fr = _feature_fractions(obs_res, n)
    feat_names = list(obs_fr.keys())
    obs_vec = np.array([obs_fr[f] for f in feat_names])

    # --- Distribución nula ---
    # ns epoch de cada evento (forzar resolución ns: pandas puede usar µs)
    event_ns = dt.values.astype("datetime64[ns]").astype("int64")
    window_ns = int(match_window_days * 86400 * 1e9)
    null_mat = np.empty((k, len(feat_names)))
    for r in range(k):
        if null_mode == "matched":
            offset = rng.integers(-window_ns, window_ns, size=n)
            rand_ns = event_ns + offset
        else:
            rand_ns = rng.integers(t_min, t_max, size=n)
        rand_dt = pd.to_datetime(rand_ns, utc=True)
        if shuffle_locations:
            perm = rng.permutation(n)
            clat, clon = lat[perm], lon[perm]
        else:
            clat, clon = lat, lon
        res = charts.compute_charts(rand_dt.values, clat, clon,
                                    include_node=include_node,
                                    include_angles=include_angles)
        fr = _feature_fractions(res, n)
        null_mat[r] = np.array([fr[f] for f in feat_names])
        if verbose and (r + 1) % max(1, k // 10) == 0:
            print(f"  control {r + 1}/{k}")

    null_mean = null_mat.mean(axis=0)
    null_std = null_mat.std(axis=0, ddof=1)

    # p-valor de Monte Carlo (dos colas)
    ge = (null_mat >= obs_vec).sum(axis=0)
    le = (null_mat <= obs_vec).sum(axis=0)
    p_upper = (1 + ge) / (k + 1)
    p_lower = (1 + le) / (k + 1)
    p_two = np.minimum(1.0, 2 * np.minimum(p_upper, p_lower))

    with np.errstate(divide="ignore", invalid="ignore"):
        z = (obs_vec - null_mean) / null_std
        rel_risk = obs_vec / null_mean

    # p-valor paramétrico (aprox. normal): más resolución que Monte Carlo cuando k
    # es moderado. Válido porque las proporciones nulas son ~normales.
    # sf(x) = 0.5*erfc(x/sqrt(2)); sin dependencia de scipy.
    import math
    _erfc = np.vectorize(math.erfc)
    p_z = _erfc(np.abs(np.nan_to_num(z, nan=0.0)) / math.sqrt(2.0))

    # FDR sobre el p paramétrico (más potente); se reporta también el de Monte Carlo.
    p_fdr = benjamini_hochberg(p_z)

    df = pd.DataFrame({
        "feature": feat_names,
        "obs_freq": obs_vec,
        "null_mean": null_mean,
        "null_std": null_std,
        "rel_risk": rel_risk,
        "z_score": z,
        "p_montecarlo": p_two,
        "p_value": p_z,
        "p_fdr": p_fdr,
        "n_events": n,
        "k_controls": k,
    })
    df["direction"] = np.where(obs_vec >= null_mean, "exceso", "déficit")
    return df.sort_values("p_fdr").reset_index(drop=True)


def run_split_validation(events: pd.DataFrame, k: int = 500, seed: int = 42,
                         frac_explore: float = 0.5, alpha: float = 0.05,
                         **kwargs):
    """
    Validación exploratorio + confirmatorio (estándar de oro anti p-hacking).

    1) Parte aleatoriamente los eventos en EXPLORACIÓN y CONFIRMACIÓN.
    2) En EXPLORACIÓN: corre el modelo nulo y selecciona los rasgos con FDR<alpha.
    3) En CONFIRMACIÓN: testea SOLO esos rasgos (pocas pruebas → mucha potencia)
       y corrige por FDR únicamente entre ellos.

    Un rasgo es CIENTÍFICAMENTE SÓLIDO solo si pasa en ambas mitades con la
    misma dirección. Devuelve (df_exploracion, df_confirmacion_de_candidatos).
    """
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(events))
    cut = int(len(events) * frac_explore)
    ev_exp = events.iloc[idx[:cut]].reset_index(drop=True)
    ev_con = events.iloc[idx[cut:]].reset_index(drop=True)

    print(f"=== FASE EXPLORATORIA ({len(ev_exp)} eventos) ===")
    exp = run_null_test(ev_exp, k=k, seed=seed, **kwargs)
    candidates = exp[exp["p_fdr"] < alpha].copy()
    print(f"Candidatos con FDR<{alpha}: {len(candidates)}")
    if candidates.empty:
        print("Sin candidatos; no hay nada que confirmar.")
        return exp, candidates

    print(f"\n=== FASE CONFIRMATORIA ({len(ev_con)} eventos) ===")
    con_full = run_null_test(ev_con, k=k, seed=seed + 1, **kwargs)
    con = con_full[con_full["feature"].isin(candidates["feature"])].copy()
    # FDR solo entre los candidatos pre-especificados
    con["p_fdr"] = benjamini_hochberg(con["p_value"].to_numpy())
    # ¿coincide la dirección entre fases?
    dir_exp = dict(zip(candidates["feature"], candidates["direction"]))
    con["dir_explora"] = con["feature"].map(dir_exp)
    con["confirmado"] = (con["p_fdr"] < alpha) & (con["direction"] == con["dir_explora"])
    print(f"CONFIRMADOS (replican con misma dirección): {int(con['confirmado'].sum())}")
    return exp, con.sort_values("p_fdr")


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "eventos_template.csv"
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    ev = pd.read_csv(path)
    res = run_null_test(ev, k=k)
    out = "resultados_estadisticos.csv"
    res.to_csv(out, index=False)
    print(f"\n=== Top 15 rasgos por significancia (FDR) ===")
    print(res.head(15).to_string(index=False))
    print(f"\nGuardado en {out}")
    sig = res[res["p_fdr"] < 0.05]
    print(f"\nRasgos significativos tras FDR (p<0.05): {len(sig)} de {len(res)}")
