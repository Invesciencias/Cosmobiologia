"""
charts.py — Motor de cartas astrales para eventos (Fundación Invesciencias).

Usa efemérides JPL (Skyfield, DE421) para longitudes eclípticas geocéntricas
aparentes (zodíaco tropical, de la fecha) y fórmulas astronómicas estándar para
el Ascendente / Medio Cielo (casas Whole Sign).

Diseñado para ser VECTORIZADO: se pueden calcular cientos de miles de cartas
(eventos reales + controles del modelo nulo) en una sola pasada.

Dependencias: skyfield, numpy.
"""
from __future__ import annotations

import numpy as np
from skyfield.api import load

# --- Carga única de efemérides (de421 cubre 1899-2053) -----------------------
_EPH = None
_TS = None


def _ephemeris():
    global _EPH, _TS
    if _EPH is None:
        _TS = load.timescale()
        _EPH = load("de421.bsp")  # se descarga la primera vez (~17 MB)
    return _EPH, _TS


# Cuerpos: nombre -> clave en la efeméride
BODIES = {
    "Sun": "sun",
    "Moon": "moon",
    "Mercury": "mercury",
    "Venus": "venus",
    "Mars": "mars",
    "Jupiter": "jupiter barycenter",
    "Saturn": "saturn barycenter",
    "Uranus": "uranus barycenter",
    "Neptune": "neptune barycenter",
    "Pluto": "pluto barycenter",
}
BODY_ORDER = list(BODIES.keys())

SIGNS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir",
         "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"]

# Aspectos mayores: nombre -> (ángulo, orbe en grados)
MAJOR_ASPECTS = {
    "conjunction": (0.0, 8.0),
    "sextile": (60.0, 6.0),
    "square": (90.0, 7.0),
    "trine": (120.0, 8.0),
    "opposition": (180.0, 8.0),
}


def sign_of(longitude_deg):
    """Devuelve el índice de signo (0=Aries) y los grados dentro del signo."""
    lon = np.asarray(longitude_deg) % 360.0
    idx = (lon // 30).astype(int)
    deg_in = lon - idx * 30.0
    return idx, deg_in


def mean_obliquity_deg(jd_tt):
    """Oblicuidad media de la eclíptica (Meeus, cap. 22), en grados."""
    T = (np.asarray(jd_tt) - 2451545.0) / 36525.0
    secs = (21.448 - T * (46.8150 + T * (0.00059 - T * 0.001813)))
    return 23.0 + (26.0 + secs / 60.0) / 60.0


def planet_longitudes(times):
    """
    Longitudes eclípticas geocéntricas aparentes (de la fecha), en grados [0,360).

    times: skyfield Time (escalar o array de N).
    Devuelve dict {nombre: array(N)} (o escalares si times es escalar).
    """
    eph, _ = _ephemeris()
    earth = eph["earth"]
    obs = earth.at(times)
    out = {}
    for name, key in BODIES.items():
        astrometric = obs.observe(eph[key]).apparent()
        _, lon, _ = astrometric.ecliptic_latlon(epoch="date")
        out[name] = lon.degrees % 360.0
    return out


def ascendant_mc(times, lat_deg, lon_deg):
    """
    Ascendente y Medio Cielo (longitud eclíptica, grados) por fórmula estándar.

    times: skyfield Time (N).  lat_deg, lon_deg: arrays (N) o escalares.
    Convención de longitud: Este positivo.
    """
    lat = np.radians(np.asarray(lat_deg, dtype=float))
    eps = np.radians(mean_obliquity_deg(times.tt))
    # Tiempo sidéreo local aparente (grados)
    gast_deg = np.asarray(times.gast) * 15.0
    ramc = np.radians((gast_deg + np.asarray(lon_deg, dtype=float)) % 360.0)

    # Medio Cielo
    mc = np.degrees(np.arctan2(np.sin(ramc), np.cos(ramc) * np.cos(eps))) % 360.0

    # Ascendente
    asc = np.degrees(np.arctan2(
        np.cos(ramc),
        -(np.sin(ramc) * np.cos(eps) + np.tan(lat) * np.sin(eps))
    )) % 360.0
    return asc, mc


def whole_sign_houses(longitudes, asc_long):
    """
    Asigna casa Whole Sign (1..12) a cada longitud planetaria.
    Casa 1 = signo del Ascendente; cada signo es una casa completa.

    longitudes: dict {nombre: array(N)}.  asc_long: array(N).
    Devuelve dict {nombre: array(N) de enteros 1..12}.
    """
    asc_sign = (np.asarray(asc_long) // 30).astype(int)
    houses = {}
    for name, lon in longitudes.items():
        p_sign = (np.asarray(lon) // 30).astype(int)
        houses[name] = ((p_sign - asc_sign) % 12) + 1
    return houses


def angular_separation(a, b):
    """Separación angular mínima entre dos longitudes (0..180)."""
    d = np.abs(np.asarray(a) - np.asarray(b)) % 360.0
    return np.where(d > 180.0, 360.0 - d, d)


def mean_node_longitude(jd_tt):
    """Nodo lunar medio ascendente (Meeus, cap. 47), longitud eclíptica en grados."""
    T = (np.asarray(jd_tt) - 2451545.0) / 36525.0
    omega = 125.04452 - 1934.136261 * T + 0.0020708 * T**2 + T**3 / 450000.0
    return omega % 360.0


def aspect_matrix(longitudes, names=None):
    """
    Para cada par de puntos y cada aspecto mayor, marca si están dentro de orbe.

    longitudes: dict {nombre: array(N)}.
    names: orden de puntos a considerar (por defecto, los presentes en BODY_ORDER
           seguidos del resto).

    Devuelve dict {(p1, p2, aspect): array booleano(N)} y
    {(p1, p2, aspect): array de orbe efectivo (NaN si no aplica)}.
    """
    if names is None:
        names = [n for n in BODY_ORDER if n in longitudes]
        names += [n for n in longitudes if n not in names]
    hits = {}
    orbs = {}
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            sep = angular_separation(longitudes[names[i]], longitudes[names[j]])
            for asp, (ang, orb) in MAJOR_ASPECTS.items():
                diff = np.abs(sep - ang)
                key = (names[i], names[j], asp)
                hits[key] = diff <= orb
                orbs[key] = np.where(diff <= orb, diff, np.nan)
    return hits, orbs


def times_from_utc(dt_utc_array):
    """
    Construye un objeto Time de skyfield a partir de fechas UTC.

    dt_utc_array: array/Series de numpy.datetime64 o pandas Timestamp (UTC).
    """
    _, ts = _ephemeris()
    dt = np.asarray(dt_utc_array, dtype="datetime64[s]")
    # descomponer en componentes UTC
    import pandas as pd
    idx = pd.to_datetime(dt, utc=True)
    return ts.utc(idx.year.values, idx.month.values, idx.day.values,
                  idx.hour.values, idx.minute.values, idx.second.values)


def compute_charts(dt_utc, lat, lon, include_node=False, include_angles=False):
    """
    Calcula longitudes, casas y aspectos para un conjunto de eventos.

    dt_utc: fechas UTC (array). lat, lon: arrays paralelos.
    include_node: añade el Nodo lunar medio como punto que forma aspectos.
    include_angles: añade Ascendente y Medio Cielo como puntos de aspecto.

    Devuelve dict con 'longitudes', 'houses', 'asc', 'mc', 'aspect_hits'.
    """
    t = times_from_utc(dt_utc)
    lons = planet_longitudes(t)
    asc, mc = ascendant_mc(t, lat, lon)
    houses = whole_sign_houses(lons, asc)

    aspect_pts = dict(lons)
    if include_node:
        node = mean_node_longitude(t.tt)
        aspect_pts["Mean_Node"] = node
        houses["Mean_Node"] = whole_sign_houses({"x": node}, asc)["x"]
    if include_angles:
        aspect_pts["Asc"] = np.asarray(asc)
        aspect_pts["MC"] = np.asarray(mc)
    hits, orbs = aspect_matrix(aspect_pts)
    return {
        "longitudes": lons,
        "houses": houses,
        "asc": asc,
        "mc": mc,
        "aspect_hits": hits,
        "aspect_orbs": orbs,
    }


if __name__ == "__main__":
    # --- Validación física: al mediodía solar local, el Sol ~ conjunto al MC ---
    import pandas as pd
    # mediodía UTC en Greenwich (lon 0): el Sol debe estar cerca del MC
    dt = pd.to_datetime(["2023-06-21T12:00:00Z", "2023-12-21T12:00:00Z"])
    res = compute_charts(dt.values, np.array([45.0, 45.0]), np.array([0.0, 0.0]))
    sun = res["longitudes"]["Sun"]
    mc = res["mc"]
    sep = angular_separation(sun, mc)
    print("Sol:", np.round(sun, 3))
    print("MC :", np.round(mc, 3))
    print("Separación Sol-MC (debe ser pocos grados):", np.round(sep, 3))
