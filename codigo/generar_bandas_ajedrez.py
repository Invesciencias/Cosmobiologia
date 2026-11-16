# -*- coding: utf-8 -*-
"""
generar_bandas_ajedrez.py — Bandas de movimiento de las partidas de ajedrez para la pestaña Ajedrez.

Requiere charts.py con casas de Polich y Page (house_system="polich_page") y la efeméride de421.bsp de Skyfield (se descarga sola la primera vez).
Para cada partida de datos/chess_games/*.json calcula, cada 2 minutos, en qué casa topocéntrica (Polich y Page) de la carta del instante
está cada uno de los diez cuerpos, y escribe los tramos (inicio, fin, casa) en datos/ajedrez_bandas.json, junto con las seis jugadas de mayor pérdida de ventaja.

SUPUESTO SIN VERIFICAR: la hora local de inicio y la sede de cada torneo están escritas de memoria (tabla SEDE) y deben cotejarse con el calendario oficial.
Los archivos de partida traen la fecha pero no la hora de inicio; sí traen las horas acumuladas de cada jugada.
Uso:  python codigo/generar_bandas_ajedrez.py
"""
import os, sys, json, glob
import numpy as np, pandas as pd
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import charts

CUERPOS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
NOMBRES = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"]
# prefijo del game_id: (sede, latitud, longitud, hora local de inicio, desfase UTC en horas)  -- horas de inicio de memoria, SIN verificar
SEDE = {"wc_2021_dubai": ("Dubái", 25.20, 55.27, 15.5, 4), "wc_2023_astana": ("Astaná", 51.13, 71.43, 15.0, 6),
        "candidates_2024": ("Toronto", 43.65, -79.38, 15.0, -4), "norway_chess_2024": ("Stavanger", 58.97, 5.73, 17.0, 2),
        "norway_chess_2025": ("Stavanger", 58.97, 5.73, 17.0, 2)}
PASO_MIN = 2


def sede(gid):
    for k, v in SEDE.items():
        if gid.startswith(k): return v
    raise KeyError(gid)


def bandas(archivo):
    g = json.load(open(archivo, encoding="utf-8")); A = g["astro"]; gid = g.get("game_id") or os.path.basename(archivo)[:-5]
    nom, lat, lon, h0, off = sede(gid)
    ply = sorted(int(k) for k in A); horas = np.array([A[str(k)]["hours"] for k in ply]); dw = np.array([A[str(k)]["delta_winpct"] for k in ply]); hmax = float(horas.max())
    y, m, d = map(int, g["date"].split(".")); ini = pd.Timestamp(year=y, month=m, day=d, tz="UTC") + pd.Timedelta(hours=h0 - off)
    t = np.arange(0, hmax + PASO_MIN / 60, PASO_MIN / 60); ts = ini + pd.to_timedelta(t, unit="h")
    r = charts.compute_charts(ts.values, np.full(len(t), lat), np.full(len(t), lon), house_system="polich_page")
    tramos = []
    for p in CUERPOS:
        h = np.asarray(r["houses"][p]).astype(int); lista = []; a = 0
        for i in range(1, len(h) + 1):
            if i == len(h) or h[i] != h[a]:
                lista.append([round(float(t[a]), 3), round(float(t[min(i, len(t) - 1)]), 3), int(h[a])]); a = i
        lista[-1][1] = round(hmax, 3); tramos.append(lista)
    top = np.argsort(-dw)[:6]
    return {"id": gid, "blancas": g["white"], "negras": g["black"], "evento": g["event"], "fecha": g["date"], "ronda": g["round"], "resultado": g["result"], "sede": nom,
            "inicio_local_supuesto": "%02d:%02d" % (int(h0), int(round((h0 % 1) * 60))), "utc_offset": off, "horas": round(hmax, 3), "jugadas": len(ply),
            "tramos": tramos, "mayores_perdidas": [{"jugada": int(ply[i]), "hora": round(float(horas[i]), 3), "perdida": round(float(dw[i]), 1)} for i in sorted(top, key=lambda i: horas[i])]}


def main():
    raiz = os.path.join(AQUI, "..", "datos"); out = {"nota": "Hora de inicio y sede de cada torneo escritas de memoria, sin verificar con el calendario oficial. Casas topocéntricas de Polich y Page, carta recalculada cada %d minutos." % PASO_MIN,
                                                      "cuerpos": NOMBRES, "partidas": []}
    for f in sorted(glob.glob(os.path.join(raiz, "chess_games", "*.json"))):
        if "manifest" in f: continue
        b = bandas(f); out["partidas"].append(b); print(b["id"], b["sede"], b["horas"], "h", sum(len(x) - 1 for x in b["tramos"]), "cambios")
    with open(os.path.join(raiz, "ajedrez_bandas.json"), "w", encoding="utf-8") as fh: json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print("ok", len(out["partidas"]), "partidas")


if __name__ == "__main__":
    main()
