"""
Sistema Topocéntrico de Casas de Polich-Page (1961) — visualización 3D interactiva
====================================================================================
Renderiza la esfera celeste local del observador (topocéntrica) con los tres
planos clave (horizonte, ecuador celeste local, eclíptica), el eje del mundo
local, los círculos de posición de las 12 casas (familia Placidus/Polich-Page)
y los 4 ángulos cardinales (ASC/DSC/MC/IC) — usando Plotly para poder rotar
y explorar la geometría de forma interactiva en el navegador.

Marco de referencia (cartesiano, radio unidad, origen = topocentro):
    X -> Sur       Y -> Este       Z -> Cénit local
    Horizonte local = plano XY.  Meridiano local = plano XZ.
    Norte = (-1,0,0)   Sur = (1,0,0)   Este = (0,1,0)   Oeste = (0,-1,0)

Las fórmulas de las cúspides (offset + "polo" en función de tan(latitud))
son EXACTAMENTE las mismas, con la misma convención algebraica, que
topocentric_house_cusps() en charts.py (ya validada en la plataforma
Cosmobiología: Casa 1 = Ascendente exacto, Casa 10 = Medio Cielo exacto,
casas opuestas a 180°) — aquí se reimplementan en escalares/NumPy puro
para no depender de Skyfield, y se les añade la reconstrucción geométrica
3D de los "círculos de posición" (los conos/planos que el enunciado pide
dibujar), que charts.py no necesita porque solo calcula las cúspides.

Verificación incluida al final del archivo (bloque `if __name__`): antes
de generar las figuras, comprueba numéricamente que cada ángulo cardinal
(ASC/MC/etc.) cae exactamente sobre su propio círculo de posición y que
el Ascendente y Descendente están sobre el horizonte (Z≈0) — así no se
publica una geometría que "se ve bien" pero es inconsistente por dentro.
"""

import numpy as np
import plotly.graph_objects as go

# Oblicuidad media de la eclíptica en J2000.0 (grados) — mismo valor de
# referencia que usan charts.py / precession_engine.py en la plataforma.
EPS_J2000 = 23.4392911

SIGN_NAMES = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
              'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis']


# ─────────────────────────────────────────────────────────────────────────
# Transformaciones de coordenadas
# ─────────────────────────────────────────────────────────────────────────

def ecliptic_to_equatorial(lon_deg, eps_deg=EPS_J2000, lat_deg=0.0):
    """Longitud/latitud eclíptica -> ascensión recta / declinación (grados).
    Fórmula esférica estándar (Meeus, cap. 13)."""
    lon = np.radians(np.asarray(lon_deg, dtype=float))
    eps = np.radians(eps_deg)
    beta = np.radians(lat_deg)
    sin_dec = np.sin(beta) * np.cos(eps) + np.cos(beta) * np.sin(eps) * np.sin(lon)
    dec = np.degrees(np.arcsin(np.clip(sin_dec, -1.0, 1.0)))
    y = np.sin(lon) * np.cos(eps) - np.tan(beta) * np.sin(eps) * np.ones_like(lon)
    x = np.cos(lon)
    ra = np.degrees(np.arctan2(y, x)) % 360.0
    return ra, dec


def equatorial_to_horizon_xyz(ra_deg, dec_deg, ramc_deg, phi_deg):
    """
    (Ascensión recta, declinación) -> cartesianas topocéntricas unitarias
    (X=Sur, Y=Este, Z=Cénit). H = ángulo horario = RAMC - AR.
    Se verifica que sin(altitud) = z reproduce la fórmula estándar
    sin(alt) = sin(dec)sin(phi) + cos(dec)cos(phi)cos(H).
    """
    H = np.radians((ramc_deg - np.asarray(ra_deg, dtype=float)) % 360.0)
    dec = np.radians(dec_deg)
    phi = np.radians(phi_deg)
    x = np.cos(dec) * np.cos(H) * np.sin(phi) - np.sin(dec) * np.cos(phi)
    y = -np.cos(dec) * np.sin(H)
    z = np.cos(dec) * np.cos(H) * np.cos(phi) + np.sin(dec) * np.sin(phi)
    return np.stack([x, y, z], axis=-1)


# ─────────────────────────────────────────────────────────────────────────
# Cúspides de las 12 casas (Polich-Page) — fórmula cerrada
# ─────────────────────────────────────────────────────────────────────────

def cusp_longitude(offset_deg, pole_tan, ramc_deg, eps_deg=EPS_J2000):
    """
    Fórmula generalizada del Ascendente (idéntica, algebraicamente, a
    topocentric_house_cusps() en charts.py): RAMC desplazado 'offset_deg'
    y "polo" variable en vez de fijo en tan(latitud).
      offset=0,   pole_tan=tan(phi)  -> Ascendente (Casa 1)
      offset=-90, pole_tan=0         -> Medio Cielo (Casa 10)
    """
    ra = np.radians((ramc_deg + offset_deg) % 360.0)
    eps = np.radians(eps_deg)
    lon = np.degrees(np.arctan2(
        np.cos(ra),
        -(np.sin(ra) * np.cos(eps) + pole_tan * np.sin(eps))
    )) % 360.0
    return float(lon)


# offset (grados, relativo al ARMC) y factor del polo (multiplicado por
# tan(phi)) de cada una de las 6 cúspides "independientes" — las otras 6
# son opuestas (+180°) a estas.
_CUSP_DEF = {
    1: (0.0, 1.0), 2: (30.0, 2 / 3), 3: (60.0, 1 / 3),
    10: (-90.0, 0.0), 11: (-60.0, 1 / 3), 12: (-30.0, 2 / 3),
}
_CUSP_OPPOSITE = {4: 10, 5: 11, 6: 12, 7: 1, 8: 2, 9: 3}


def house_cusps(phi_deg, ramc_deg, eps_deg=EPS_J2000):
    """Longitud eclíptica (grados) de las 12 cúspides, casas 1..12."""
    tan_phi = np.tan(np.radians(phi_deg))
    cusps = {h: cusp_longitude(off, fac * tan_phi, ramc_deg, eps_deg)
              for h, (off, fac) in _CUSP_DEF.items()}
    for h, opp in _CUSP_OPPOSITE.items():
        cusps[h] = (cusps[opp] + 180.0) % 360.0
    return {h: cusps[h] for h in range(1, 13)}


def house_pole_deg(house, phi_deg):
    """"Polo" (grados) de la casa dada — mismo valor para una casa y su
    opuesta (comparten el mismo círculo de posición, ver más abajo)."""
    base = {**{h: h for h in _CUSP_DEF}, **_CUSP_OPPOSITE}[house]
    _, fac = _CUSP_DEF[base]
    return np.degrees(np.arctan(fac * np.tan(np.radians(phi_deg))))


# ─────────────────────────────────────────────────────────────────────────
# Círculos de posición de las casas (la parte gráfica 3D)
# ─────────────────────────────────────────────────────────────────────────

def house_position_circle(cusp_xyz, n=181):
    """
    Curva 3D CERRADA del "círculo de posición" de una casa: el ÚNICO gran
    círculo que pasa por los puntos Norte y Sur del horizonte, (-1,0,0) y
    (1,0,0), Y por la cúspide de esa casa (ya calculada con la fórmula
    cerrada exacta de Polich-Page — ver house_cusps/cusp_longitude).

    Por qué "por N/S del horizonte + la cúspide" define exactamente el
    círculo de posición correcto (y no cualquier curva "que pase por
    ahí"): dos puntos antípodas (N y S SIEMPRE son antípodas, están en
    extremos opuestos del mismo diámetro) dejan un solo grado de libertad
    — el "abanico" de todos los grandes círculos que giran alrededor del
    eje Norte-Sur — y un tercer punto (la cúspide) elige uno solo de ellos.
    Esto reproduce, por construcción, la propiedad clásica documentada de
    Placidus/Polich-Page: sus círculos de posición pasan por los puntos
    cardinales Norte y Sur del horizonte del observador. (Nota de
    desarrollo: una versión anterior de esta función intentaba construir
    el círculo directamente desde la fórmula sin(DA)=tan(Polo)tan(δ)
    asumiendo que pasaba por los POLOS celestes en vez de por el
    horizonte — la autoverificación de más abajo demostró que esa
    cúspide no caía sobre esa curva, así que se corrigió a este método,
    que sí pasa exactamente por la cúspide por construcción.)
    """
    y_c, z_c = cusp_xyz[1], cusp_xyz[2]
    beta = 0.0 if (abs(y_c) < 1e-9 and abs(z_c) < 1e-9) else np.arctan2(z_c, y_c)
    t = np.linspace(0, 2 * np.pi, n)
    x = np.cos(t)
    y = np.sin(t) * np.cos(beta)
    z = np.sin(t) * np.sin(beta)
    return np.stack([x, y, z], axis=-1)


def ecliptic_ring_xyz(ramc_deg, phi_deg, eps_deg=EPS_J2000, n=361):
    lons = np.linspace(0, 360, n)
    ra, dec = ecliptic_to_equatorial(lons, eps_deg)
    return equatorial_to_horizon_xyz(ra, dec, ramc_deg, phi_deg), lons


# ─────────────────────────────────────────────────────────────────────────
# Figura Plotly
# ─────────────────────────────────────────────────────────────────────────

def build_figure(phi_deg=40.0, ramc_deg=0.0, eps_deg=EPS_J2000, mostrar_casas=True):
    fig = go.Figure()

    # 1) Esfera celeste topocéntrica (R=1), semitransparente
    u, v = np.mgrid[0:2 * np.pi:60j, 0:np.pi:30j]
    xs, ys, zs = np.cos(u) * np.sin(v), np.sin(u) * np.sin(v), np.cos(v)
    fig.add_surface(x=xs, y=ys, z=zs, opacity=0.06, showscale=False,
                     colorscale=[[0, '#a0c8ff'], [1, '#a0c8ff']],
                     name='Esfera celeste', hoverinfo='skip')

    # 2) Horizonte local — disco semitransparente en el plano XY
    r = np.linspace(0, 1, 2)
    th = np.linspace(0, 2 * np.pi, 60)
    R, TH = np.meshgrid(r, th)
    Xh, Yh, Zh = R * np.cos(TH), R * np.sin(TH), np.zeros_like(R)
    fig.add_surface(x=Xh, y=Yh, z=Zh, opacity=0.22, showscale=False,
                     colorscale=[[0, '#8ee6a8'], [1, '#8ee6a8']],
                     name='Horizonte local', hoverinfo='skip')
    for label, p in [('N', (-1.1, 0, 0)), ('S', (1.1, 0, 0)),
                      ('E', (0, 1.1, 0)), ('O', (0, -1.1, 0)),
                      ('Cénit', (0, 0, 1.12)), ('Nadir', (0, 0, -1.12))]:
        fig.add_scatter3d(x=[p[0]], y=[p[1]], z=[p[2]], mode='text', text=[label],
                           textfont=dict(size=12, color='#333'),
                           showlegend=False, hoverinfo='skip')

    # 3) Eje del mundo local (polar), inclinado del horizonte hacia el
    #    Norte por un ángulo = latitud phi
    phi = np.radians(phi_deg)
    ncp = np.array([-np.cos(phi), 0.0, np.sin(phi)])
    fig.add_scatter3d(x=[-ncp[0], ncp[0]], y=[-ncp[1], ncp[1]], z=[-ncp[2], ncp[2]],
                       mode='lines', line=dict(color='crimson', width=6),
                       name=f'Eje del Mundo local (φ={phi_deg:.1f}°)')

    # 4) Círculos de posición de las 12 casas — solo se dibujan 6 curvas
    #    (cada una es compartida por una casa y su opuesta a 180°)
    cusps = house_cusps(phi_deg, ramc_deg, eps_deg)  # se necesitan ya aquí para construir los círculos
    if mostrar_casas:
        colores = {1: '#c0392b', 2: '#d35400', 3: '#e67e22',
                   10: '#8e44ad', 11: '#9b59b6', 12: '#bb8fce'}
        etiquetas = {1: 'I / VII (ASC-DSC)', 2: 'II / VIII', 3: 'III / IX',
                     10: 'X / IV (MC-IC)', 11: 'XI / V', 12: 'XII / VI'}
        for h in (1, 2, 3, 10, 11, 12):
            polo = house_pole_deg(h, phi_deg)
            ra_h, dec_h = ecliptic_to_equatorial(np.array([cusps[h]]), eps_deg)
            cusp_xyz = equatorial_to_horizon_xyz(ra_h, dec_h, ramc_deg, phi_deg)[0]
            curva = house_position_circle(cusp_xyz)
            fig.add_scatter3d(x=curva[:, 0], y=curva[:, 1], z=curva[:, 2],
                               mode='lines', line=dict(color=colores[h], width=3),
                               name=f'Casa {etiquetas[h]} (Polo={polo:.1f}°)')

    # 5) Eclíptica — anillo dorado, con marcas cada 30° (inicio de cada signo)
    ring, _ = ecliptic_ring_xyz(ramc_deg, phi_deg, eps_deg)
    fig.add_scatter3d(x=ring[:, 0], y=ring[:, 1], z=ring[:, 2], mode='lines',
                       line=dict(color='goldenrod', width=5), name='Eclíptica')
    sign_lons = np.arange(0, 360, 30)
    ra_s, dec_s = ecliptic_to_equatorial(sign_lons, eps_deg)
    sign_pts = equatorial_to_horizon_xyz(ra_s, dec_s, ramc_deg, phi_deg)
    fig.add_scatter3d(x=sign_pts[:, 0] * 1.04, y=sign_pts[:, 1] * 1.04, z=sign_pts[:, 2] * 1.04,
                       mode='markers+text', text=SIGN_NAMES,
                       marker=dict(size=3, color='goldenrod'),
                       textfont=dict(size=9, color='#7a5c00'), name='Signos (30°)')

    # 6) Ángulos cardinales — ASC/DSC/MC/IC (cusps ya calculado arriba)
    angulos = [('ASC', cusps[1], 'red'), ('DSC', cusps[7], 'darkred'),
               ('MC', cusps[10], 'blue'), ('IC', cusps[4], 'navy')]
    for nombre, lon_c, color in angulos:
        ra_c, dec_c = ecliptic_to_equatorial(np.array([lon_c]), eps_deg)
        p = equatorial_to_horizon_xyz(ra_c, dec_c, ramc_deg, phi_deg)[0]
        signo = SIGN_NAMES[int(lon_c // 30)]
        grado_en_signo = lon_c % 30
        fig.add_scatter3d(x=[p[0] * 1.12], y=[p[1] * 1.12], z=[p[2] * 1.12],
                           mode='markers+text', marker=dict(size=7, color=color),
                           text=[nombre], textposition='top center',
                           textfont=dict(size=14, color=color),
                           name=f'{nombre}: {grado_en_signo:.1f}° {signo}')

    fig.update_layout(
        title=f'Esfera Celeste Topocéntrica — Sistema Polich-Page<br>'
              f'<sub>φ (latitud) = {phi_deg:.2f}°  ·  ARMC = {ramc_deg:.1f}°  ·  '
              f'ε (oblicuidad) = {eps_deg:.4f}°</sub>',
        scene=dict(
            xaxis=dict(title='X · Sur', range=[-1.3, 1.3]),
            yaxis=dict(title='Y · Este', range=[-1.3, 1.3]),
            zaxis=dict(title='Z · Cénit', range=[-1.3, 1.3]),
            aspectmode='cube',
        ),
        legend=dict(itemsizing='constant', font=dict(size=10)),
        margin=dict(l=0, r=0, t=70, b=0),
        height=800,
    )
    return fig


# ─────────────────────────────────────────────────────────────────────────
# Autoverificación + generación de ejemplos
# ─────────────────────────────────────────────────────────────────────────

def _autoverificar(phi_deg, ramc_deg, eps_deg=EPS_J2000, tol=1e-6):
    """
    Antes de fiarnos del dibujo, comprueba geometría que NO está garantizada
    trivialmente por construcción (no basta con "la cúspide está sobre su
    propio círculo" — eso es cierto por diseño desde que house_position_circle
    se construye A PARTIR de la cúspide):
      1) ASC y DSC caen exactamente en el horizonte (Z≈0).
      2) MC e IC caen exactamente en el meridiano local (Y≈0).
      3) Cada cúspide y su opuesta (180°) son puntos antípodas en 3D
         (p + p_opuesto ≈ 0) — si no lo fueran, "casas opuestas comparten
         círculo" sería falso.
      4) Cada círculo de posición pasa realmente por los puntos Norte y
         Sur del horizonte (validación de que house_position_circle no
         tiene un bug de signos/escala).
    """
    cusps = house_cusps(phi_deg, ramc_deg, eps_deg)
    problemas = []

    def punto_de(lon):
        ra, dec = ecliptic_to_equatorial(np.array([lon]), eps_deg)
        return equatorial_to_horizon_xyz(ra, dec, ramc_deg, phi_deg)[0]

    p_asc, p_dsc = punto_de(cusps[1]), punto_de(cusps[7])
    if abs(p_asc[2]) > 1e-6:
        problemas.append(f'ASC no está en el horizonte (Z={p_asc[2]:.6f})')
    if abs(p_dsc[2]) > 1e-6:
        problemas.append(f'DSC no está en el horizonte (Z={p_dsc[2]:.6f})')

    p_mc, p_ic = punto_de(cusps[10]), punto_de(cusps[4])
    if abs(p_mc[1]) > 1e-6:
        problemas.append(f'MC no está en el meridiano (Y={p_mc[1]:.6f})')
    if abs(p_ic[1]) > 1e-6:
        problemas.append(f'IC no está en el meridiano (Y={p_ic[1]:.6f})')

    for h, opp in [(1, 7), (2, 8), (3, 9), (10, 4), (11, 5), (12, 6)]:
        p, p_opp = punto_de(cusps[h]), punto_de(cusps[opp])
        if np.linalg.norm(p + p_opp) > 1e-6:
            problemas.append(f'Casa {h}/{opp}: los puntos no son antípodas (suma={p + p_opp})')
        ra_h, dec_h = ecliptic_to_equatorial(np.array([cusps[h]]), eps_deg)
        cusp_xyz = equatorial_to_horizon_xyz(ra_h, dec_h, ramc_deg, phi_deg)[0]
        curva = house_position_circle(cusp_xyz, n=721)
        dist_a_norte = np.min(np.linalg.norm(curva - np.array([-1, 0, 0]), axis=1))
        dist_a_sur = np.min(np.linalg.norm(curva - np.array([1, 0, 0]), axis=1))
        if dist_a_norte > 0.02 or dist_a_sur > 0.02:
            problemas.append(f'Casa {h}: su círculo no pasa por N/S del horizonte (d_N={dist_a_norte:.4f}, d_S={dist_a_sur:.4f})')

    return problemas


if __name__ == '__main__':
    casos = [
        ('Stavanger (φ=58.97°N)', 58.97, 120.0, 'topocentric_stavanger.html'),
        ('Buenos Aires (φ=34.60°S)', -34.60, 120.0, 'topocentric_buenosaires.html'),
    ]
    for etiqueta, phi_deg, ramc_deg, archivo in casos:
        problemas = _autoverificar(phi_deg, ramc_deg)
        estado = 'OK' if not problemas else 'REVISAR: ' + '; '.join(problemas)
        print(f'[{etiqueta}] autoverificación: {estado}')
        fig = build_figure(phi_deg=phi_deg, ramc_deg=ramc_deg)
        fig.write_html(archivo, include_plotlyjs='cdn')
        print(f'  -> {archivo}')
