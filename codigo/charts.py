"""
charts.py — Motor de cartas astrales para eventos (Fundación Invesciencias).

Usa efemérides JPL (Skyfield, DE421) para longitudes eclípticas aparentes
(zodíaco tropical, de la fecha) y fórmulas astronómicas estándar para
el Ascendente / Medio Cielo (casas Whole Sign).

Modos de posición planetaria (TCC cap. 38-39):
  - Geocéntrico (por defecto): observador = centro de la Tierra.
      Suficiente para aspectos planeta-planeta (error sub-arcsegundo en
      planetas exteriores). Es el modo rápido para el modelo nulo (K=200
      réplicas × N eventos).
  - Topocéntrico (topocentric=True): observador = superficie terrestre en
      la lat/lon exacta del epicentro. Corrección de paralaje diurno.
      Efecto principal en la Luna: hasta ~57' (~1°). Obligatorio para
      análisis de posición lunar exacta (angular|Moon|ASC/DSC) y casas
      cuando se dispone de coordenadas epicentrales precisas.
      Ferriz Olivares (TCC cap. 38-39): "el lugar geográfico exacto es el
      centro del Universo local — precisión de segundos de arco y de tiempo".

Diseñado para ser VECTORIZADO: se pueden calcular cientos de miles de cartas
en una sola pasada.

Dependencias: skyfield, numpy.
"""
from __future__ import annotations

import numpy as np
from skyfield.api import load, Topos

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
    Modo rápido — usar para el modelo nulo (K réplicas) y aspectos planeta-planeta.
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


def planet_equatorial(times):
    """
    Ascensión Recta (RA, en grados [0,360)) y Declinación (Dec, en grados)
    geocéntricas aparentes (de la fecha) — coordenadas VERDADERAS, no la
    aproximación de latitud eclíptica cero.

    Necesarias para las Direcciones Primarias "en el mundo" (TCC cap. 47):
    Ferriz Olivares exige el control ascensional (sobre el ecuador celeste)
    en vez de la longitud eclíptica para el cálculo riguroso de arcos de
    dirección — fórmula primordial ARMC = ARSM + H.

    times: skyfield Time (escalar o array de N).
    Devuelve (ra_dict, dec_dict): cada uno {nombre: array(N) en grados}.
    """
    eph, _ = _ephemeris()
    earth = eph["earth"]
    obs = earth.at(times)
    ra_out, dec_out = {}, {}
    for name, key in BODIES.items():
        astrometric = obs.observe(eph[key]).apparent()
        ra, dec, _ = astrometric.radec(epoch="date")
        ra_out[name] = ra._degrees % 360.0
        dec_out[name] = dec.degrees
    return ra_out, dec_out


def armc_deg(times, lon_deg):
    """
    ARMC — Ascensión Recta del Medio Cielo (grados [0,360)).

    Fórmula primordial de la TCC (cap. 47): ARMC = ARSM + H, donde ARSM es
    la Ascensión Recta del Sol Medio y H la Hora Local Verdadera. En la
    práctica esto es idéntico al Tiempo Sidéreo Local Aparente (GAST +
    longitud geográfica) — la cantidad que ya usa ascendant_mc() y
    topocentric_house_cusps() para toda la domificación.

    times: skyfield Time (N). lon_deg: array (N) o escalar. Este positivo.
    Devuelve array(N) en grados.
    """
    gast_deg = np.asarray(times.gast) * 15.0
    return (gast_deg + np.asarray(lon_deg, dtype=float)) % 360.0


def planet_longitudes_topocentric(times, lat_deg, lon_deg, verbose=False):
    """
    Longitudes eclípticas TOPOcéntricas aparentes (de la fecha), en grados [0,360).

    Corrige el paralaje diurno usando el observador en la superficie terrestre
    en la lat/lon exacta del evento (epicentro sísmico, etc.).

    Diferencia respecto a geocéntrico:
      - Luna:   hasta ~57' (~1°) — significativa para angular|Moon|ASC/DSC
      - Venus/Marte (perihelio): hasta ~30" — marginal
      - Planetas exteriores: <1" — despreciable

    Referencia: Ferriz Olivares, TCC cap. 38-39 ("rigor ascensional de Polich-Page
    para el control de sucesos al segundo de tiempo").

    NOTA DE RENDIMIENTO: itera evento a evento (Skyfield no vectoriza observer
    variable + times variable simultáneamente). Usar solo para eventos reales,
    no para el modelo nulo (K réplicas). Para N=6 000 eventos tarda ~15-30 s.

    times:    skyfield Time (array de N).
    lat_deg:  array (N) de latitudes del observador (grados, Norte positivo).
    lon_deg:  array (N) de longitudes del observador (grados, Este positivo).
    Devuelve dict {nombre: array(N)}.
    """
    eph, _ = _ephemeris()
    lat = np.asarray(lat_deg, dtype=float)
    lon = np.asarray(lon_deg, dtype=float)
    n = len(lat)

    out = {name: np.empty(n) for name in BODIES}

    for i in range(n):
        # earth + Topos es la API correcta de Skyfield para observador superficial
        observer  = eph["earth"] + Topos(latitude_degrees=float(lat[i]),
                                         longitude_degrees=float(lon[i]))
        t_i       = times[i]                        # Time escalar
        obs_at_ti = observer.at(t_i)
        for name, key in BODIES.items():
            astrometric = obs_at_ti.observe(eph[key]).apparent()
            _, ecl_lon, _ = astrometric.ecliptic_latlon(epoch="date")
            out[name][i] = float(ecl_lon.degrees) % 360.0
        if verbose and (i + 1) % max(1, n // 10) == 0:
            print(f"  topocéntrico: {i+1}/{n}")

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


def topocentric_house_cusps(times, lat_deg, lon_deg):
    """
    Cúspides de las 12 casas por el sistema Topocéntrico de Wendel Polich
    y A.P. Nelson Page (1961). TCC cap. 38-39: "la clave de un problema
    secular" y el mejor detector de coordenadas para la biosfera.

    A diferencia de Whole Sign (casas = signos completos de 30°), este
    sistema calcula cúspides desiguales usando "latitudes polares"
    derivadas de dividir la latitud geográfica del observador en tercios,
    aplicadas mediante la MISMA fórmula del Ascendente (generalizada) con
    un ángulo horario desplazado en pasos de 30° desde el Ascendente real
    (offset=0, idéntico a ascendant_mc — verificado algebraicamente). A
    diferencia de Placidus (que requiere iteración numérica), Polich-Page
    es una fórmula cerrada: precisión de segundos de arco sin
    aproximaciones sucesivas.

    Fórmulas (Polich & Page, 1961), offset relativo al Ascendente (offset 0):
      Casa  1 (ASC): offset   0°, tan(polo) = tan(latitud)        [completo]
      Casa  2:       offset +30°, tan(polo) = (2/3) tan(latitud)
      Casa  3:       offset +60°, tan(polo) = (1/3) tan(latitud)
      Casa 10 (MC):  offset -90°, tan(polo) = 0   (equivale a la fórmula MC)
      Casa 11:       offset -60°, tan(polo) = (1/3) tan(latitud)
      Casa 12:       offset -30°, tan(polo) = (2/3) tan(latitud)
    Las casas 4-9 son opuestas (180°) a 10,11,12,1,2,3 respectivamente.

    times: skyfield Time (N).  lat_deg, lon_deg: arrays (N) o escalares.
    Convención de longitud: Este positivo.

    Devuelve dict {casa 1..12: array(N) longitud eclíptica de la cúspide}.
    """
    lat = np.radians(np.asarray(lat_deg, dtype=float))
    tan_lat = np.tan(lat)
    eps = np.radians(mean_obliquity_deg(times.tt))
    gast_deg = np.asarray(times.gast) * 15.0
    ramc = np.radians((gast_deg + np.asarray(lon_deg, dtype=float)) % 360.0)

    def _cusp(offset_deg, pole_tan):
        """Fórmula generalizada del Ascendente: RAMC desplazado + polo variable.
        offset=0, pole_tan=tan(lat) reproduce EXACTAMENTE ascendant_mc().
        offset=-90, pole_tan=0 reproduce EXACTAMENTE el Medio Cielo."""
        ra = ramc + np.radians(offset_deg)
        lon_c = np.degrees(np.arctan2(
            np.cos(ra),
            -(np.sin(ra) * np.cos(eps) + pole_tan * np.sin(eps))
        )) % 360.0
        return lon_c

    c1  = _cusp(0.0,   tan_lat)            # Ascendente
    c2  = _cusp(30.0,  2.0 * tan_lat / 3)
    c3  = _cusp(60.0,  tan_lat / 3)
    c10 = _cusp(-90.0, 0.0)                # Medio Cielo
    c11 = _cusp(-60.0, tan_lat / 3)
    c12 = _cusp(-30.0, 2.0 * tan_lat / 3)

    cusps = {
        1:  c1,
        2:  c2,
        3:  c3,
        10: c10,
        11: c11,
        12: c12,
        4:  (c10 + 180.0) % 360.0,
        5:  (c11 + 180.0) % 360.0,
        6:  (c12 + 180.0) % 360.0,
        7:  (c1  + 180.0) % 360.0,
        8:  (c2  + 180.0) % 360.0,
        9:  (c3  + 180.0) % 360.0,
    }
    return cusps


def assign_topocentric_houses(longitudes, cusps):
    """
    Asigna casa topocéntrica (1..12, cúspides desiguales) a cada longitud
    planetaria, dadas las cúspides calculadas por topocentric_house_cusps().

    longitudes: dict {nombre: array(N)}.
    cusps: dict {1..12: array(N)} tal como devuelve topocentric_house_cusps().

    Devuelve dict {nombre: array(N) de enteros 1..12}.
    """
    n = len(np.asarray(cusps[1]))
    cusp_arr = np.stack([np.asarray(cusps[h]) for h in range(1, 13)], axis=1)  # (n, 12)

    def _house_of(lon_vec):
        lon_vec = np.asarray(lon_vec, dtype=float) % 360.0
        out = np.empty(len(lon_vec), dtype=int)
        for i in range(len(lon_vec)):
            c = cusp_arr[i]
            lo = lon_vec[i]
            for h in range(12):
                start = c[h]
                end = c[(h + 1) % 12]
                span = (end - start) % 360.0
                pos = (lo - start) % 360.0
                if pos < span or span == 0.0:
                    out[i] = h + 1
                    break
            else:
                out[i] = 12
        return out

    houses = {}
    for name, lon in longitudes.items():
        houses[name] = _house_of(lon)
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


def lunar_phase_deg(t):
    """Elongación Luna-Sol (0-360°): 0=luna nueva, 180=luna llena."""
    eph, _ = _ephemeris()
    obs = eph["earth"].at(t)
    moon_lon = obs.observe(eph["moon"]).apparent().ecliptic_latlon(epoch="date")[1].degrees % 360.0
    sun_lon  = obs.observe(eph["sun"]).apparent().ecliptic_latlon(epoch="date")[1].degrees % 360.0
    return (moon_lon - sun_lon) % 360.0


def lunar_distance_km(t):
    """Distancia geocéntrica a la Luna en km."""
    eph, _ = _ephemeris()
    return eph["earth"].at(t).observe(eph["moon"]).distance().km


def tidal_proxy(t):
    """
    Fuerza de marea combinada Luna+Sol (proxy, unidades arbitrarias ∝ GM/r³).
    La variación en ventana ±30 días está dominada por la Luna (~70%).
    """
    eph, _ = _ephemeris()
    obs = eph["earth"].at(t)
    r_moon = obs.observe(eph["moon"]).distance().km * 1e3  # m
    r_sun  = obs.observe(eph["sun"]).distance().km  * 1e3  # m
    GM_MOON = 4.905e12   # m³/s²
    GM_SUN  = 1.327e20   # m³/s²
    return GM_MOON / r_moon**3 + GM_SUN / r_sun**3


def angular_hits_from_angles(longitudes, asc, mc, orb=8.0):
    """
    Planetas dentro del orbe de los ángulos topocentricos ASC/DSC/MC/IC.

    Devuelve dict {(planeta, ángulo): array bool(N)}.
    El ASC y MC ya son topocentricos (calculados con LMST local del evento).
    """
    asc = np.asarray(asc)
    mc  = np.asarray(mc)
    dsc = (asc + 180.0) % 360.0
    ic  = (mc  + 180.0) % 360.0
    angles = {"ASC": asc, "DSC": dsc, "MC": mc, "IC": ic}
    hits = {}
    for planet, lon in longitudes.items():
        for aname, alon in angles.items():
            hits[(planet, aname)] = angular_separation(np.asarray(lon), alon) <= orb
    return hits


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


def compute_charts(dt_utc, lat, lon, include_node=False, include_angles=False,
                   topocentric=False, house_system="whole_sign"):
    """
    Calcula longitudes, casas y aspectos para un conjunto de eventos.

    dt_utc:       fechas UTC (array). lat, lon: arrays paralelos.
    include_node: añade el Nodo lunar medio como punto que forma aspectos.
    include_angles: añade Ascendente y Medio Cielo como puntos de aspecto.
    topocentric:  si True, usa posiciones planetarias topocéntricas (observador
                  en la superficie en lat/lon del evento). Recomendado cuando
                  se dispone de coordenadas epicentrales precisas y se analiza
                  la posición lunar exacta (TCC cap. 38-39).
                  Más lento: usar geocéntrico (topocentric=False) para el
                  modelo nulo (K réplicas), y topocéntrico solo para los
                  eventos reales o análisis confirmatorio.
    house_system: "whole_sign" (default, rápido, casas = signos completos) o
                  "polich_page" (TCC cap. 38-39: domificación topocéntrica de
                  Polich & Page — cúspides desiguales por fórmula cerrada,
                  requiere hora exacta del evento). Usar "polich_page" solo
                  para eventos reales con hora confiable, no para el modelo
                  nulo (evita coste computacional innecesario en K réplicas).

    Devuelve dict con 'longitudes', 'houses', 'asc', 'mc', 'aspect_hits',
    más 'lunar_parallax_arcmin' cuando topocentric=True, y 'house_cusps'
    cuando house_system="polich_page".
    """
    t = times_from_utc(dt_utc)

    if topocentric:
        lons_geo  = planet_longitudes(t)           # geocéntrico (para comparar)
        lons      = planet_longitudes_topocentric(t, lat, lon)
        # Paralaje lunar en arcmin — métrica de calidad
        moon_diff = angular_separation(lons["Moon"], lons_geo["Moon"]) * 60.0
    else:
        lons = planet_longitudes(t)

    asc, mc = ascendant_mc(t, lat, lon)

    house_cusps = None
    if house_system == "polich_page":
        house_cusps = topocentric_house_cusps(t, lat, lon)
        houses = assign_topocentric_houses(lons, house_cusps)
    else:
        houses = whole_sign_houses(lons, asc)

    aspect_pts = dict(lons)
    if include_node:
        node = mean_node_longitude(t.tt)
        aspect_pts["Mean_Node"] = node
        if house_system == "polich_page":
            houses["Mean_Node"] = assign_topocentric_houses({"x": node}, house_cusps)["x"]
        else:
            houses["Mean_Node"] = whole_sign_houses({"x": node}, asc)["x"]
    if include_angles:
        aspect_pts["Asc"] = np.asarray(asc)
        aspect_pts["MC"] = np.asarray(mc)
    hits, orbs = aspect_matrix(aspect_pts)

    # --- Features físicas nuevas ---
    phase   = lunar_phase_deg(t)
    dist_km = lunar_distance_km(t)
    tidal   = tidal_proxy(t)
    ang     = angular_hits_from_angles(lons, asc, mc)

    result = {
        "longitudes": lons,
        "houses": houses,
        "asc": asc,
        "mc": mc,
        "aspect_hits": hits,
        "aspect_orbs": orbs,
        "lunar_phase": phase,
        "lunar_distance_km": dist_km,
        "tidal_proxy": tidal,
        "angular_hits": ang,
        "topocentric": topocentric,
        "house_system": house_system,
    }
    if topocentric:
        result["lunar_parallax_arcmin"] = moon_diff
    if house_cusps is not None:
        result["house_cusps"] = house_cusps
    return result


if __name__ == "__main__":
    import pandas as pd

    # --- Test 1: mediodía solar — Sol debe estar cerca del MC (geocéntrico) ---
    dt = pd.to_datetime(["2023-06-21T12:00:00Z", "2023-12-21T12:00:00Z"])
    lat = np.array([45.0, 45.0])
    lon = np.array([0.0, 0.0])
    res = compute_charts(dt.values, lat, lon)
    sun = res["longitudes"]["Sun"]
    mc  = res["mc"]
    print("=== Test 1: Sol cerca del MC al mediodía ===")
    print(f"  Sol: {np.round(sun,3)}  MC: {np.round(mc,3)}")
    print(f"  Separación Sol-MC: {np.round(angular_separation(sun,mc),3)} ° (debe ser <15°)")

    # --- Test 2: paralaje lunar — geocéntrico vs. topocéntrico ---
    print("\n=== Test 2: Paralaje lunar geocéntrico vs. topocéntrico ===")
    dt2 = pd.to_datetime(["2011-03-11T05:46:24Z"])   # Tohoku M9.1
    lat2, lon2 = np.array([38.322]), np.array([142.369])
    res_geo  = compute_charts(dt2.values, lat2, lon2, topocentric=False)
    res_topo = compute_charts(dt2.values, lat2, lon2, topocentric=True)
    moon_geo  = res_geo["longitudes"]["Moon"][0]
    moon_topo = res_topo["longitudes"]["Moon"][0]
    parallax  = res_topo["lunar_parallax_arcmin"][0]
    print(f"  Terremoto de Tohoku (38.3°N, 142.4°E)")
    print(f"  Luna geocéntrica : {moon_geo:.4f}°")
    print(f"  Luna topocéntrica: {moon_topo:.4f}°")
    print(f"  Paralaje lunar   : {parallax:.2f} arcmin")
    print(f"  (valor esperado: 30–57 arcmin según distancia lunar)")

    # --- Test 3: consistencia — aspectos planeta-planeta no deben cambiar ---
    print("\n=== Test 3: Aspectos planeta-planeta (deben ser idénticos) ===")
    hits_geo  = res_geo["aspect_hits"]
    hits_topo = res_topo["aspect_hits"]
    diffs = [(k, hits_geo[k], hits_topo[k])
             for k in hits_geo if hits_geo[k][0] != hits_topo[k][0]
             if "Moon" not in k[0] and "Moon" not in k[1]]
    print(f"  Diferencias en aspectos planeta-planeta (excl. Luna): {len(diffs)}")
    if diffs:
        for k, g, tp in diffs[:3]:
            print(f"    {k}: geocéntrico={g[0]} topocéntrico={tp[0]}")
    else:
        print("  OK: sin diferencias -- geocentrico equivalente para planetas")

    # --- Test 4: casas Polich-Page — validación estructural ---
    print("\n=== Test 4: Domificación Topocéntrica (Polich-Page) ===")
    res_pp = compute_charts(dt2.values, lat2, lon2, house_system="polich_page")
    cusps = res_pp["house_cusps"]
    print(f"  Terremoto de Tohoku (38.3°N, 142.4°E)")
    for h in range(1, 13):
        print(f"  Casa {h:2d}: {cusps[h][0]:7.3f}°")
    # Validaciones estructurales:
    # a) Casa 1 debe coincidir con el Ascendente calculado por ascendant_mc
    asc_check = res_pp["asc"][0]
    c1 = cusps[1][0]
    print(f"\n  Casa 1 vs ASC: {c1:.4f}° vs {asc_check:.4f}°  (deben coincidir)")
    assert abs(((c1 - asc_check + 180) % 360) - 180) < 0.01, "ERROR: Casa 1 != ASC"
    # b) Casa 10 debe coincidir con el MC
    mc_check = res_pp["mc"][0]
    c10 = cusps[10][0]
    print(f"  Casa 10 vs MC: {c10:.4f}° vs {mc_check:.4f}°  (deben coincidir)")
    assert abs(((c10 - mc_check + 180) % 360) - 180) < 0.01, "ERROR: Casa 10 != MC"
    # c) Casas opuestas deben estar a 180° (comparación circular correcta)
    def _circ_diff(a, b):
        d = abs(a - b) % 360.0
        return min(d, 360.0 - d)
    opp_ok = all(abs(_circ_diff(cusps[h][0], cusps[h + 6][0]) - 180.0) < 0.01
                 for h in range(1, 7))
    print(f"  Casas opuestas a 180°: {'OK' if opp_ok else 'ERROR'}")
    assert opp_ok, "ERROR: casas opuestas no están a 180°"
    print("  OK: domificación Polich-Page estructuralmente válida")

    # --- Test 5: ARMC y coordenadas ecuatoriales (RA/Dec) ---
    print("\n=== Test 5: ARMC y Ascensión Recta / Declinación ===")
    t2 = times_from_utc(dt2.values)
    armc_test = armc_deg(t2, lon2)
    print(f"  ARMC calculado: {armc_test[0]:.4f}°")
    # ARMC debe coincidir EXACTAMENTE con GAST+lon usado internamente por
    # ascendant_mc y topocentric_house_cusps (misma fórmula primordial)
    gast_check = (np.asarray(t2.gast) * 15.0 + lon2) % 360.0
    print(f"  GAST+lon (referencia): {gast_check[0]:.4f}°")
    assert abs(armc_test[0] - gast_check[0]) < 1e-9, "ERROR: armc_deg no coincide con GAST+lon"
    print("  OK: armc_deg() coincide exactamente con la fórmula ya validada")

    ra_test, dec_test = planet_equatorial(t2)
    print(f"  Sol  RA={ra_test['Sun'][0]:7.3f}°  Dec={dec_test['Sun'][0]:+6.3f}°")
    print(f"  Luna RA={ra_test['Moon'][0]:7.3f}°  Dec={dec_test['Moon'][0]:+6.3f}°")
    # Sanity: declinación solar en marzo (cerca del equinoccio) debe ser pequeña
    assert abs(dec_test['Sun'][0]) < 5.0, "ERROR: declinación solar fuera de rango esperado en marzo"
    print("  OK: declinación solar consistente con la época del año (cerca del equinoccio)")
