# codigo/

Todo el código Python del proyecto, en una sola carpeta. Los scripts se importan entre sí (por ejemplo `nullmodel` usa `charts`), por eso **no están separados en subcarpetas**.

**Ejecutar:** desde la raíz del repositorio, `python codigo/nombre.py`. Los scripts leen y escriben en la carpeta desde donde se lanzan.

| Tema | Archivos |
|---|---|
| Estadística | `nullmodel.py` (modelo nulo emparejado + FDR) |
| Pisos de detección | `piso_deteccion.py`, `test_piso_deteccion.py` (14 pruebas), `k2_step1_pisos.py` |
| Astronomía | `charts.py` (cartas de eventos, Skyfield + JPL DE421) |
| Geofísica | `mecanismo_focal.py`, `marea_tensor.py`, `decluster.py` |
| Visualización | `topocentric_polich_page_3d.py` |
| Descarga y conversión | `descargar_huracanes.py`, `descargar_sismos_masivo.py`, `descargar_volcanes.py`, `convertir_sismos.py` |
| Generación de la web | `generar_data_js.py` (→ `data.js`), `compute_features.py` (→ `features.js`) |

Licencia del código: MIT (ver `../LICENSE`).
