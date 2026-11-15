# -*- coding: utf-8 -*-
"""
graficas_evento.py — gráficas del Laboratorio para muchos eventos a la vez.

Dado un archivo de eventos (columnas datetime_utc, latitude, longitude y, si se quiere declusterizar, value),
dibuja:
  1. la rueda de anillos: un anillo por planeta y una casilla por cada 10° del zodiaco; el color es el z de cada
     casilla frente a fechas control del mismo lugar (naranja: menos eventos que el azar; verde: más);
  2. la tabla de planeta por casa topocéntrica (Polich y Page) con el mismo z;
  3. la campana «decidir antes de mirar» (exceso, déficit o ambos).

Uso rápido (desde la raíz del repositorio):
    python laboratorio/graficas_evento.py datos/eventos_gcmt_marea.csv --salida graficas --declusterizar

Dependencias: las del proyecto (numpy, pandas, matplotlib, skyfield) y charts.py / decluster.py (carpeta codigo/ o raíz).
Las gráficas son descriptivas: la hipótesis (y el lado, exceso o déficit) debe escribirse ANTES de mirarlas.
"""
import argparse, os, sys
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for _r in (RAIZ, os.path.join(RAIZ, "codigo")):
    if os.path.isdir(_r) and _r not in sys.path: sys.path.insert(0, _r)
import charts  # motor de la plataforma

PLANETAS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
NOMBRES = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"]
GLIFOS = ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇"]
SIGNOS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]
CONTROLES_DIAS = (-30, -24, -18, 18, 24, 30)           # fechas control: mismo lugar y misma hora, otros días
VERDE, VERDE_OSC, NARANJA, ROJO, TINTA, GRIS = "#007a60", "#005743", "#ffb454", "#b4442b", "#14282b", "#53696a"


def cargar_eventos(ruta, declusterizar=False):
    d = pd.read_csv(ruta)
    d["datetime_utc"] = pd.to_datetime(d["datetime_utc"], utc=True)
    if declusterizar:
        import decluster
        d = decluster.decluster_gardner_knopoff(d, mag_col="value", verbose=False)
    return d.reset_index(drop=True)


def _calcular(d, dias):
    t = d["datetime_utc"] + pd.Timedelta(days=dias)
    r = charts.compute_charts(t.values, d["latitude"].values, d["longitude"].values, house_system="polich_page")
    L = np.vstack([np.asarray(r["longitudes"][p]) % 360 for p in PLANETAS]); H = np.vstack([np.asarray(r["houses"][p]) for p in PLANETAS])
    return L, H


def tabla_z(d, sectores=36):
    """z de cada casilla (planeta x sector de 10°) y de cada planeta x casa, frente a las fechas control."""
    Lo, Ho = _calcular(d, 0); K = len(CONTROLES_DIAS); Lc, Hc = zip(*[_calcular(d, k) for k in CONTROLES_DIAS])
    Z = np.zeros((10, sectores)); ZH = np.zeros((10, 12))
    for p in range(10):
        o = np.histogram(Lo[p], bins=sectores, range=(0, 360))[0]; e = sum(np.histogram(Lc[k][p], bins=sectores, range=(0, 360))[0] for k in range(K)) / K
        Z[p] = (o - e) / np.sqrt(np.maximum(e, 1) * (1 + 1 / K))
        oh = np.array([(Ho[p] == h).sum() for h in range(1, 13)]); eh = np.array([sum((Hc[k][p] == h).sum() for k in range(K)) / K for h in range(1, 13)])
        ZH[p] = (oh - eh) / np.sqrt(np.maximum(eh, 1) * (1 + 1 / K))
    return Z, ZH


def _cmap(): return LinearSegmentedColormap.from_list("inv", [NARANJA, "#ffffff", "#4f9f8c"])


def rueda_anillos(Z, ruta, n_eventos, vmax=2.6):
    """Un anillo por planeta (Sol al centro, Plutón afuera). Líneas verdes: signos de 30°; grises: sectores de 10°."""
    ns = Z.shape[1]; FW, FH = 9.5, 6.4; LADO = 0.96 * FH; fig = plt.figure(figsize=(FW, FH)); ax = fig.add_axes([0.0, 0.02, LADO / FW, 0.96], projection="polar")
    ax.set_theta_zero_location("W"); ax.set_theta_direction(-1); ax.set_xticks([]); ax.set_yticks([]); ax.spines["polar"].set_visible(False); ax.set_ylim(0, 1.22)
    th = np.radians(np.arange(ns + 1) * (360 / ns)); rr = np.linspace(0.2, 1.0, 11)
    for p in range(10): ax.pcolormesh(th, rr[p:p + 2], Z[p][None, :], cmap=_cmap(), norm=TwoSlopeNorm(vmin=-vmax, vcenter=0, vmax=vmax), edgecolors=(1, 1, 1, .25), linewidth=.3)
    for dg in range(0, 360, 10):
        if dg % 30: ax.plot([np.radians(dg)] * 2, [0.2, 1.0], color="#7f9a95", lw=.7, zorder=5)
    for dg in range(0, 360, 30): ax.plot([np.radians(dg)] * 2, [0.2, 1.04], color=VERDE, lw=2.2, zorder=6)
    for k in range(12): ax.text(np.radians(k * 30 + 15), 1.12, SIGNOS[k], ha="center", va="center", fontsize=15, color=VERDE)
    cx, cy = LADO / FW / 2, 0.5; borde = cx + (1.04 / 1.22) * (LADO / 2) / FW
    for p in range(10):
        yy = cy + ((rr[p] + rr[p + 1]) / 2 / 1.22) * (LADO / 2) / FH
        fig.add_artist(matplotlib.lines.Line2D([borde, borde + 0.05], [yy, yy], color=GRIS, lw=.8)); fig.text(borde + 0.06, yy, f"{GLIFOS[p]}  {NOMBRES[p]}", fontsize=10.5, va="center", color=TINTA)
    fig.text(borde + 0.06, cy + 0.42, "cada anillo\nes un planeta", fontsize=10.5, weight="bold", va="center", color=VERDE)
    fig.text(0.02, 0.01, f"{n_eventos} eventos. Naranja: menos que el azar; verde: más. Afuera sale pálido: los planetas lentos no distinguen un evento de otro.", fontsize=8, color=GRIS)
    fig.savefig(ruta, dpi=170, bbox_inches="tight"); plt.close(fig)


def planeta_por_casa(ZH, ruta, vmax=4.0):
    fig, ax = plt.subplots(figsize=(6.4, 4.6)); im = ax.imshow(ZH, cmap=_cmap(), norm=TwoSlopeNorm(vmin=-vmax, vcenter=0, vmax=vmax), aspect="auto")
    ax.set_xticks(range(12)); ax.set_xticklabels(range(1, 13)); ax.set_yticks(range(10)); ax.set_yticklabels([f"{g} {n}" for g, n in zip(GLIFOS, NOMBRES)])
    ax.set_xlabel("casa topocéntrica (Polich y Page)"); fig.colorbar(im, ax=ax, orientation="horizontal", pad=.2, label="z frente a las fechas control")
    fig.savefig(ruta, dpi=170, bbox_inches="tight"); plt.close(fig)


def campana_lado(ruta):
    """Las colas de la campana: exceso, déficit o ambos. El lado se decide antes de mirar los datos."""
    x = np.linspace(-3.6, 3.6, 600); y = np.exp(-x ** 2 / 2); fig, ax = plt.subplots(figsize=(6.4, 3.2))
    ax.fill_between(x, y, color="#e5f1ed"); ax.fill_between(x[x <= -1.96], y[x <= -1.96], color=NARANJA); ax.fill_between(x[x >= 1.96], y[x >= 1.96], color="#4f9f8c"); ax.plot(x, y, color=TINTA)
    ax.text(0, .45, "lo que da el azar\n95 % de las casillas", ha="center", color=TINTA, fontsize=10, weight="bold"); ax.text(-2.8, .25, "déficit\n2,5 %", ha="center", color="#8a5a10"); ax.text(2.8, .25, "exceso\n2,5 %", ha="center", color="#1d6b5a")
    ax.set_yticks([]); ax.set_xticks([-1.96, 0, 1.96]); ax.set_xlabel("z"); [s.set_visible(False) for s in ax.spines.values()]
    fig.savefig(ruta, dpi=170, bbox_inches="tight"); plt.close(fig)


def casillas_fuera(Z, umbral=1.96):
    """Cuántas casillas pasan del umbral y cuántas se esperarían solo por azar (5 % con el umbral 1,96)."""
    return int((np.abs(Z) > umbral).sum()), round(0.05 * Z.size, 1), int((Z > umbral).sum()), int((Z < -umbral).sum())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("eventos"); ap.add_argument("--salida", default="graficas"); ap.add_argument("--declusterizar", action="store_true")
    a = ap.parse_args(); os.makedirs(a.salida, exist_ok=True)
    d = cargar_eventos(a.eventos, a.declusterizar); print(f"{len(d)} eventos")
    Z, ZH = tabla_z(d); rueda_anillos(Z, os.path.join(a.salida, "rueda_anillos.png"), len(d)); planeta_por_casa(ZH, os.path.join(a.salida, "planeta_por_casa.png")); campana_lado(os.path.join(a.salida, "campana_lado.png"))
    f, e, v, n = casillas_fuera(Z); print(f"Casillas fuera de ±1,96: {f} (azar esperaría unas {e}); verdes {v}, naranjas {n}; |z| máximo = {np.abs(Z).max():.2f}")


if __name__ == "__main__":
    main()
