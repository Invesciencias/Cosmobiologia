"""
mecanismo_focal.py — Clasificación del tipo de falla a partir del tensor de
momento de GCMT (formato NDK).
====================================================================

Por qué existe este módulo
--------------------------
Tanaka, Ohtake y Sato (2002, JGR 107(B10), 2211) mostraron que la correlación
entre carga mareal y sismicidad es estadísticamente significativa **solo en
fallas inversas de zonas de subducción**, no en el catálogo global. Por eso
el artículo publicado por Invesciencias en la Circular Astronómica RAC 1027
(sept. 2026, pp. 8-11) establece como requisito de diseño que el análisis
sísmico estratifique por tipo de falla y profundidad focal desde el inicio.

El dato necesario ya venía en las descargas de GCMT: el formato NDK trae en
su quinta línea los ejes principales del tensor (T, N/B, P con buzamiento y
azimut) y los dos planos nodales (rumbo/buzamiento/deslizamiento). El parser
anterior (descargar_gcmt.py) extraía únicamente la magnitud de esa línea y
descartaba el resto. Este módulo recupera esa información.

Clasificación
-------------
Se usa el esquema de Frohlich (1992), "Triangle diagrams: ternary graphs to
display similarity and diversity of earthquake focal mechanisms", Physics of
the Earth and Planetary Interiors, 75, 193-198. Es un criterio basado en los
buzamientos de los ejes principales, robusto porque no obliga a elegir cuál
de los dos planos nodales es el plano de falla real:

    inversa   (thrust)      si buzamiento(T) >= 50 grados
    normal    (normal)      si buzamiento(P) >= 50 grados
    desgarre  (strike-slip) si buzamiento(B) >= 60 grados
    oblicua   (odd)         en cualquier otro caso

Intuición física: en compresión (falla inversa) el eje P queda casi
horizontal y el T casi vertical; en extensión (falla normal) ocurre lo
contrario; en desgarre ambos quedan casi horizontales y el eje nulo B queda
casi vertical.

Magnitud
--------
Se calcula Mw desde el momento escalar, Mw = (2/3)(log10(M0) - 16.1) con M0
en dina-cm (Hanks & Kanamori 1979), en vez de usar los mb/MS de la primera
línea del NDK, que son magnitudes distintas y sistemáticamente sesgadas
respecto a Mw.
"""

import math
import re

# Umbrales de Frohlich (1992), en grados.
UMBRAL_INVERSA = 50.0   # buzamiento del eje T
UMBRAL_NORMAL = 50.0    # buzamiento del eje P
UMBRAL_DESGARRE = 60.0  # buzamiento del eje B (nulo)

TIPOS = ("inversa", "normal", "desgarre", "oblicua")


def clasificar_frohlich(plunge_t, plunge_b, plunge_p):
    """Devuelve 'inversa', 'normal', 'desgarre' u 'oblicua'.

    plunge_* son los buzamientos (grados, 0-90) de los ejes principales:
    T = tensión (autovalor mayor), P = presión (menor), B = nulo (intermedio).
    """
    if plunge_t >= UMBRAL_INVERSA:
        return "inversa"
    if plunge_p >= UMBRAL_NORMAL:
        return "normal"
    if plunge_b >= UMBRAL_DESGARRE:
        return "desgarre"
    return "oblicua"


def mw_desde_momento(mantisa, exponente):
    """Mw a partir del momento escalar M0 = mantisa x 10^exponente (dina-cm)."""
    if mantisa <= 0:
        return None
    m0 = mantisa * (10.0 ** exponente)
    return (2.0 / 3.0) * (math.log10(m0) - 16.1)


def parse_linea5(linea5, exponente):
    """Extrae ejes principales, planos nodales y Mw de la quinta línea NDK.

    Estructura (17 campos separados por espacios):
        version  ev1 pl1 az1  ev2 pl2 az2  ev3 pl3 az3  M0  s1 d1 r1  s2 d2 r2

    Los tres tríos (autovalor, buzamiento, azimut) vienen ordenados por
    autovalor, pero aquí se reasignan explícitamente por valor (T = mayor,
    P = menor, B = intermedio) para no depender de ese orden.
    """
    t = linea5.split()
    if len(t) < 17:
        return None
    try:
        ejes = [(float(t[1]), float(t[2]), float(t[3])),
                (float(t[4]), float(t[5]), float(t[6])),
                (float(t[7]), float(t[8]), float(t[9]))]
        ejes.sort(key=lambda e: e[0])          # menor -> mayor autovalor
        p_ax, b_ax, t_ax = ejes[0], ejes[1], ejes[2]
        m0_mantisa = float(t[10])
        np1 = (float(t[11]), float(t[12]), float(t[13]))   # rumbo, buzamiento, deslizamiento
        np2 = (float(t[14]), float(t[15]), float(t[16]))
    except (ValueError, IndexError):
        return None

    return {
        "plunge_t": t_ax[1], "azimut_t": t_ax[2],
        "plunge_b": b_ax[1], "azimut_b": b_ax[2],
        "plunge_p": p_ax[1], "azimut_p": p_ax[2],
        "strike1": np1[0], "dip1": np1[1], "rake1": np1[2],
        "strike2": np2[0], "dip2": np2[1], "rake2": np2[2],
        "mw": mw_desde_momento(m0_mantisa, exponente),
        "tipo_falla": clasificar_frohlich(t_ax[1], b_ax[1], p_ax[1]),
    }


_RE_L1 = re.compile(
    r"^\S+\s+(\d{4})/(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d+\.\d+)\s+"
    r"([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(.*)$"
)


def parse_ndk_con_mecanismo(texto, minmag=6.0):
    """Parsea NDK completo devolviendo también el mecanismo focal.

    minmag se aplica sobre Mw calculado desde el momento escalar.
    """
    lineas = [l for l in texto.splitlines() if l.strip()]
    eventos = []
    i = 0
    while i + 4 < len(lineas):
        m = _RE_L1.match(lineas[i])
        if not m:
            i += 5
            continue
        try:
            exponente = int(lineas[i + 3].split()[0])
        except (ValueError, IndexError):
            i += 5
            continue
        mec = parse_linea5(lineas[i + 4], exponente)
        if mec is None or mec["mw"] is None or mec["mw"] < minmag:
            i += 5
            continue
        seg = float(m.group(6))
        ev = {
            "datetime_utc": "%04d-%02d-%02dT%02d:%02d:%02d" % (
                int(m.group(1)), int(m.group(2)), int(m.group(3)),
                int(m.group(4)), int(m.group(5)), min(int(seg), 59)),
            "latitude": float(m.group(7)),
            "longitude": float(m.group(8)),
            "depth_km": float(m.group(9)),
            "value": round(mec["mw"], 2),
            "value_kind": "mag_mw_gcmt",
            "region": m.group(12).strip(),
            "domain": "sismo_gcmt",
            "source": "GCMT",
        }
        ev.update(mec)
        eventos.append(ev)
        i += 5
    return eventos


# ─────────────────────────────────────────────────────────────────────
# Autoverificación contra eventos de mecanismo conocido y documentado
# ─────────────────────────────────────────────────────────────────────
def autoverificar(eventos):
    """Comprueba coherencia interna y contra casos de mecanismo conocido.

    Devuelve (lista_de_problemas, resumen).
    """
    problemas = []

    for e in eventos:
        # 1) coherencia entre el criterio de ejes y el ángulo de deslizamiento.
        #    rake ~ +90 => inversa ; rake ~ -90 => normal ; rake ~ 0/180 => desgarre
        r = e["rake1"]
        if e["tipo_falla"] == "inversa" and not (30 <= r <= 150):
            problemas.append("inversa con rake1=%.0f (%s)" % (r, e["datetime_utc"]))
        if e["tipo_falla"] == "normal" and not (-150 <= r <= -30):
            problemas.append("normal con rake1=%.0f (%s)" % (r, e["datetime_utc"]))
        # 2) los buzamientos deben estar en rango
        for k in ("plunge_t", "plunge_b", "plunge_p"):
            if not (0 <= e[k] <= 90):
                problemas.append("%s fuera de rango: %.1f" % (k, e[k]))
        # 3) los tres ejes son mutuamente ortogonales: la suma de los cuadrados
        #    de los senos de los buzamientos debe ser 1 (identidad de una base
        #    ortonormal proyectada sobre la vertical)
        s = (math.sin(math.radians(e["plunge_t"])) ** 2
             + math.sin(math.radians(e["plunge_b"])) ** 2
             + math.sin(math.radians(e["plunge_p"])) ** 2)
        if abs(s - 1.0) > 0.06:
            problemas.append("ejes no ortogonales (suma sin^2=%.3f) en %s"
                             % (s, e["datetime_utc"]))

    conteo = {t: sum(1 for e in eventos if e["tipo_falla"] == t) for t in TIPOS}
    return problemas, conteo


if __name__ == "__main__":
    import sys
    ruta = sys.argv[1] if len(sys.argv) > 1 else "_t.ndk"
    texto = open(ruta, encoding="utf-8", errors="replace").read()
    evs = parse_ndk_con_mecanismo(texto, minmag=0.0)
    print("eventos parseados:", len(evs))
    problemas, conteo = autoverificar(evs)
    print("conteo por tipo:", conteo)
    print("problemas de coherencia:", len(problemas))
    for p in problemas[:10]:
        print("   -", p)
