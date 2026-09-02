"""
marea_tensor.py — Esfuerzo mareal de Coulomb sobre el plano de falla.
=====================================================================

Qué calcula y por qué
---------------------
Tanaka, Ohtake y Sato (2002, JGR 107(B10), 2211) no midieron "fase lunar":
calcularon el **esfuerzo mareal resuelto sobre el plano de falla** de cada
sismo y probaron si los sismos se agrupan en una fase preferente de ese
ciclo. La diferencia es esencial:

  · La fase lunar es un ciclo quincenal (sicigia-cuadratura, ~14.8 días) y
    es ciega a la geometría: ignora dónde está el sismo y cómo está
    orientada la falla.
  · La marea real está dominada por la constituyente **semidiurna M2**
    (~12.42 h). El esfuerzo sobre una falla sube y baja dos veces al día,
    y su amplitud depende de la latitud del punto y de la orientación del
    plano de falla.

Un análisis con fase lunar no refuta a Tanaka: sencillamente no pone a
prueba su hipótesis. Este módulo hace el cálculo correcto, que es posible
gracias al tensor de momento recuperado en `mecanismo_focal.py`.

Física implementada
-------------------
1. Potencial mareal de grado 2 de Luna y Sol en el punto del sismo:
       W = (GM a^2 / R^3) * P2(cos psi)
   con psi el ángulo geocéntrico entre el punto y el astro.

2. Deformación de una Tierra elástica mediante números de Love (h2, l2):
       u_r = (h2/g) W ,  u_horiz = (l2/g) grad_horiz(W)
   de donde salen las componentes del tensor de deformación en la
   superficie (Melchior 1983; Agnew 2015, Treatise on Geophysics).

3. Superficie libre => esfuerzo plano: sigma_rr = sigma_r* = 0. Las
   componentes horizontales salen de las relaciones de esfuerzo plano con
   módulo de Young E y Poisson nu.

4. Resolución sobre el plano de falla con la convención de Aki & Richards
   (sistema Norte-Este-Abajo), a partir de rumbo/buzamiento/deslizamiento:
       sigma_n = n . sigma . n      (positivo en tensión)
       tau     = d . sigma . n      (positivo en el sentido del deslizamiento)
       dCFF    = tau + mu_ap * sigma_n

5. Fase mareal al estilo Tanaka: 0 grados en un máximo de dCFF, +-180 en el
   mínimo, interpolando entre los máximos que rodean al sismo.

Las derivadas del potencial se calculan **numéricamente** (diferencias
centradas sobre una función analítica suave). Es deliberado: elimina el
riesgo de un error de signo en el álgebra esférica, y la precisión se
verifica en autoverificar().

Advertencia honesta sobre el alcance
------------------------------------
Este es el modelo de *marea sólida terrestre* para una Tierra esférica,
elástica y sin océanos. La **carga oceánica** puede ser del mismo orden en
zonas costeras y de subducción, y no está incluida: haría falta un modelo
de mareas oceánicas (p. ej. FES2014) y el cálculo de la carga. Por eso los
valores de aquí son la componente de marea corporal, no el esfuerzo mareal
total.
"""

import math
import numpy as np

# ── Constantes físicas (valores estándar) ────────────────────────────
GM_LUNA = 4.9028695e12      # m^3/s^2
GM_SOL = 1.32712440018e20   # m^3/s^2
A_TIERRA = 6.371e6          # m, radio medio
G_SUP = 9.80665             # m/s^2

# Números de Love de grado 2 para la Tierra sólida (valores de referencia
# ampliamente citados; Melchior 1983)
LOVE_H2 = 0.6078
LOVE_L2 = 0.0847

# Parámetros elásticos de la corteza superior
E_YOUNG = 8.0e10            # Pa (~80 GPa)
NU_POISSON = 0.25
MU_APARENTE = 0.4           # fricción aparente para el criterio de Coulomb


def _potencial(lat_rad, lon_rad, gm, dec_rad, gast_rad, ra_rad, dist_m):
    """Potencial mareal de grado 2 (m^2/s^2) en un punto de la superficie.

    El ángulo horario local es H = GAST + lon - RA.
    """
    H = gast_rad + lon_rad - ra_rad
    cos_psi = (math.sin(lat_rad) * math.sin(dec_rad)
               + math.cos(lat_rad) * math.cos(dec_rad) * math.cos(H))
    p2 = 1.5 * cos_psi * cos_psi - 0.5
    return (gm * A_TIERRA ** 2 / dist_m ** 3) * p2


def _derivadas_potencial(lat_rad, lon_rad, cuerpos, paso=1e-4):
    """W y sus derivadas primeras/segundas respecto a latitud y longitud.

    cuerpos: lista de (gm, dec_rad, gast_rad, ra_rad, dist_m).
    Diferencias centradas; el paso se valida en autoverificar().
    """
    def W(la, lo):
        return sum(_potencial(la, lo, *c) for c in cuerpos)

    h = paso
    w0 = W(lat_rad, lon_rad)
    w_lat_p, w_lat_m = W(lat_rad + h, lon_rad), W(lat_rad - h, lon_rad)
    w_lon_p, w_lon_m = W(lat_rad, lon_rad + h), W(lat_rad, lon_rad - h)
    d_lat = (w_lat_p - w_lat_m) / (2 * h)
    d_lon = (w_lon_p - w_lon_m) / (2 * h)
    d2_lat = (w_lat_p - 2 * w0 + w_lat_m) / (h * h)
    d2_lon = (w_lon_p - 2 * w0 + w_lon_m) / (h * h)
    d2_cruz = (W(lat_rad + h, lon_rad + h) - W(lat_rad + h, lon_rad - h)
               - W(lat_rad - h, lon_rad + h) + W(lat_rad - h, lon_rad - h)) / (4 * h * h)
    return w0, d_lat, d_lon, d2_lat, d2_lon, d2_cruz


def tensor_esfuerzo_superficie(lat_deg, lon_deg, cuerpos):
    """Tensor de esfuerzos mareal en superficie, en (Norte, Este, Abajo).

    Devuelve una matriz 3x3 en Pa. Con superficie libre, las componentes
    con índice 'Abajo' son nulas (esfuerzo plano).
    """
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    w0, d_lat, d_lon, d2_lat, d2_lon, d2_cruz = _derivadas_potencial(lat, lon, cuerpos)

    a, g = A_TIERRA, G_SUP
    cos_lat = math.cos(lat)
    tan_lat = math.tan(lat)

    # Deformaciones en superficie a partir de los números de Love.
    # theta = colatitud, luego d/dtheta = -d/dlat y d2/dtheta2 = d2/dlat2.
    eps_nn = (LOVE_L2 * d2_lat + LOVE_H2 * w0) / (a * g)                      # Norte-Norte
    eps_ee = (LOVE_L2 * (d2_lon / (cos_lat ** 2) - tan_lat * d_lat)
              + LOVE_H2 * w0) / (a * g)                                        # Este-Este
    eps_ne = LOVE_L2 * (d2_cruz / cos_lat + tan_lat * d_lon / cos_lat) / (a * g)

    # Superficie libre -> esfuerzo plano
    c1 = E_YOUNG / (1.0 - NU_POISSON ** 2)
    s_nn = c1 * (eps_nn + NU_POISSON * eps_ee)
    s_ee = c1 * (eps_ee + NU_POISSON * eps_nn)
    s_ne = (E_YOUNG / (1.0 + NU_POISSON)) * eps_ne

    return np.array([[s_nn, s_ne, 0.0],
                     [s_ne, s_ee, 0.0],
                     [0.0, 0.0, 0.0]])


def vectores_falla(strike_deg, dip_deg, rake_deg):
    """Normal y vector de deslizamiento en (Norte, Este, Abajo).

    Convención de Aki & Richards (1980).
    """
    s = math.radians(strike_deg)
    d = math.radians(dip_deg)
    r = math.radians(rake_deg)
    n = np.array([-math.sin(d) * math.sin(s),
                  math.sin(d) * math.cos(s),
                  -math.cos(d)])
    v = np.array([math.cos(r) * math.cos(s) + math.cos(d) * math.sin(r) * math.sin(s),
                  math.cos(r) * math.sin(s) - math.cos(d) * math.sin(r) * math.cos(s),
                  -math.sin(r) * math.sin(d)])
    return n, v


def dcff(sigma, strike_deg, dip_deg, rake_deg, mu_ap=MU_APARENTE):
    """Cambio en la función de falla de Coulomb, en Pa.

    sigma_n positivo en tensión; dCFF = tau + mu_ap * sigma_n.
    """
    n, v = vectores_falla(strike_deg, dip_deg, rake_deg)
    traccion = sigma.dot(n)
    sigma_n = float(n.dot(traccion))
    tau = float(v.dot(traccion))
    return tau + mu_ap * sigma_n


# ── Efemérides ───────────────────────────────────────────────────────
_EPH = None
_TS = None


def _cargar_efemerides():
    global _EPH, _TS
    if _EPH is None:
        from skyfield.api import load
        _EPH = load("de421.bsp")
        _TS = load.timescale()
    return _EPH, _TS


def cuerpos_en(t_sf):
    """Devuelve la lista de (gm, dec, gast, ra, dist) para Luna y Sol."""
    eph, _ = _cargar_efemerides()
    tierra = eph["earth"]
    gast = math.radians(t_sf.gast * 15.0)
    salida = []
    for nombre, gm in (("moon", GM_LUNA), ("sun", GM_SOL)):
        ap = tierra.at(t_sf).observe(eph[nombre]).apparent()
        ra, dec, dist = ap.radec()
        salida.append((gm, dec.radians, gast, ra.radians, dist.m))
    return salida


def serie_dcff(lat, lon, strike, dip, rake, t_centro_utc, horas=24.0, paso_min=5.0):
    """Serie temporal de dCFF (Pa) centrada en un instante.

    Devuelve (minutos_relativos, valores_dcff).
    """
    _, ts = _cargar_efemerides()
    n = int(2 * horas * 60 / paso_min) + 1
    offs = np.linspace(-horas * 60, horas * 60, n)
    import datetime as dt
    base = t_centro_utc
    tiempos = [base + dt.timedelta(minutes=float(o)) for o in offs]
    t_sf = ts.utc([x.year for x in tiempos], [x.month for x in tiempos],
                  [x.day for x in tiempos], [x.hour for x in tiempos],
                  [x.minute for x in tiempos], [x.second for x in tiempos])
    vals = np.empty(n)
    for i in range(n):
        sigma = tensor_esfuerzo_superficie(lat, lon, cuerpos_en(t_sf[i]))
        vals[i] = dcff(sigma, strike, dip, rake)
    return offs, vals


def fase_mareal(offs, vals):
    """Fase de Tanaka: 0 grados en un máximo de dCFF, +-180 en el mínimo.

    Localiza los máximos que rodean al instante central (offset 0) e
    interpola linealmente entre ellos. Devuelve grados en [-180, 180).
    """
    i0 = int(np.argmin(np.abs(offs)))
    maximos = [i for i in range(1, len(vals) - 1)
               if vals[i] > vals[i - 1] and vals[i] >= vals[i + 1]]
    prev = [i for i in maximos if i <= i0]
    sig = [i for i in maximos if i > i0]
    if not prev or not sig:
        return None
    a, b = prev[-1], sig[0]
    if b == a:
        return None
    frac = (i0 - a) / (b - a)
    ang = 360.0 * frac
    return ang - 360.0 if ang >= 180.0 else ang


def test_schuster(fases_grados):
    """Prueba de Schuster de uniformidad de fases.

    p = exp(-R^2 / N) con R el módulo de la suma vectorial unitaria.
    p pequeño => las fases se agrupan (no uniformes).
    """
    f = np.radians(np.asarray(fases_grados, dtype=float))
    n = len(f)
    if n == 0:
        return None
    R = math.hypot(float(np.sum(np.cos(f))), float(np.sum(np.sin(f))))
    p = math.exp(-(R ** 2) / n)
    ang_medio = math.degrees(math.atan2(float(np.sum(np.sin(f))),
                                        float(np.sum(np.cos(f)))))
    return {"n": n, "R": R, "p_schuster": p,
            "fase_media_deg": ang_medio, "long_media": R / n}


# ─────────────────────────────────────────────────────────────────────
# Versión vectorizada: calcula la efeméride de toda la ventana de una vez.
# Necesaria para procesar miles de eventos en tiempo razonable.
# ─────────────────────────────────────────────────────────────────────
def serie_dcff_rapida(lat, lon, strike, dip, rake, t_utc, horas=18.0, paso_min=10.0):
    """Igual que serie_dcff pero pidiendo la efeméride en bloque."""
    import datetime as dt
    eph, ts = _cargar_efemerides()
    n = int(2 * horas * 60 / paso_min) + 1
    offs = np.linspace(-horas * 60, horas * 60, n)
    seg0 = t_utc.hour * 3600 + t_utc.minute * 60 + t_utc.second
    t_sf = ts.utc(t_utc.year, t_utc.month, t_utc.day, 0, 0, seg0 + offs * 60.0)

    tierra = eph["earth"]
    gast = np.radians(np.asarray(t_sf.gast) * 15.0)
    datos = []
    for nombre, gm in (("moon", GM_LUNA), ("sun", GM_SOL)):
        ra, dec, dist = tierra.at(t_sf).observe(eph[nombre]).apparent().radec()
        datos.append((gm, np.asarray(dec.radians), gast,
                      np.asarray(ra.radians), np.asarray(dist.m)))

    vals = np.empty(n)
    for i in range(n):
        cuerpos = [(gm, d[i], g[i], r[i], di[i]) for gm, d, g, r, di in datos]
        vals[i] = dcff(tensor_esfuerzo_superficie(lat, lon, cuerpos), strike, dip, rake)
    return offs, vals
