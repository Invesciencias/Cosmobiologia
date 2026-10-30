# Laboratorio de las tres compuertas

Versión 0.5. Una página para probar una hipótesis en tres compuertas: **detectabilidad**, **evidencia corregida** y **replicación**. No sustituye al explorador (`../index.html`), que sigue siendo exploratorio.

## Marca (v0.6)

Cabecera con el logo nuevo de Invesciencias dentro de un huevo blanco sobre la banda verde corporativa (Pantone 335 C ≈ #008B6E; tonos #85C3B4 y #A6D4C9; grises #898A8C y #CFD0D2). Archivo del logo: `logo-invesciencias.png` (junto a `index.html` y `panel.html`; otra copia en la raíz para el explorador).

## Versión 0.5: pisos de detección y congruencia

- **Explicación de los pisos de detección** dentro de la página (botón «Pisos de detección» en la cabecera, y enlaces desde la Compuerta 1 y la 3a): qué es un piso, las dos escalas (RR para un rasgo «sí o no»; % de variación de la tasa para una variable continua), los dos umbrales D_A (barrido) y D_B (una prueba) con sus constantes, una calculadora con gráfico y las reglas de uso. Remite a `piso_deteccion.py`, `test_piso_deteccion.py` y `NOTA_PISO_DETECCION.md` del repositorio.
- **Congruencia comprobada.** Los pisos de la página coinciden con los de `piso_deteccion.py` (diferencia máxima 0 en nueve combinaciones de n y f) y la Compuerta 1 reproduce los valores del proyecto (marea y sismos F = 3,17; estacionalidad F = 0,066; marea y huracanes F ≈ 10,9 con la curva, 12,3 en el proyecto, que incluye el error de lugar).
- **Prueba bilateral.** Si en el paso 1 eliges «Bilateral», la Compuerta 1 sube el piso un 12,7 % (2,8016 en lugar de 2,4866) y usa 1,96 como umbral de significación. Con eso el ejemplo de marea y sismos pasa de «con costo» (F = 3,17) a «no analizable en principio» (F = 4,02, por encima del tope de 4). `piso_deteccion.py` es solo unilateral.
- **Unidad de dependencia.** El paso 2 respeta lo elegido en el paso 1: «cada evento es independiente» fuerza el tamaño efectivo igual al número de eventos, y avisa si elegiste «columna» sin indicar cuál o si indicaste una columna con «secuencia».

## Versión 0.4: conexión con la plataforma y el repositorio

- **Conjuntos del proyecto.** En el paso 2 hay una lista para cargar datos directamente del repositorio de GitHub. Hoy trae `eventos_gcmt_mecanismo.csv` y `eventos_gcmt_marea.csv` (6.035 sismos GCMT, 1976–2026). Al cargarlos se rellena la ficha de datos y aparece un **aviso de uso**: son el conjunto de descubrimiento de varios hallazgos del proyecto y no sirven para replicarlos. El registro anota qué conjunto se usó (`conjunto_proyecto`).
- **Para añadir más conjuntos:** sube el CSV a la raíz del repositorio y añade una entrada a la lista `DATASETS` del script de `index.html` (archivo, título, aviso y ficha). Revisa antes su licencia: Global CMT y USGS permiten su uso con cita; otras fuentes, como EM-DAT, tienen condiciones propias.
- **Tormenta desde el identificador.** Si el archivo trae `event_id` con el formato de HURDAT2 (`nhc_AL011900_…`), el Laboratorio ofrece usar la tormenta como unidad de dependencia.
- **Formato compatible.** Cualquier `eventos_*.csv` de la plataforma (columnas `datetime_utc`, `latitude`, `longitude`) se puede cargar como archivo.
- **Enlace desde el explorador.** El `index.html` de la raíz tiene ahora, junto a «Empieza aquí», un enlace a este Laboratorio. Es el único cambio hecho en esa página.

### Cómo se conectan las piezas

| Pieza | Dónde vive | Cómo se conecta |
|---|---|---|
| Explorador (exploratorio) | `index.html` de la raíz del repositorio | Enlaza al Laboratorio; el Laboratorio enlaza de vuelta |
| Laboratorio | `laboratorio/` en el mismo repositorio | Lee conjuntos del repositorio (`raw.githubusercontent.com`) |
| Registros | «issues» de GitHub con la etiqueta `registro` | El Laboratorio abre el formulario ya rellenado |
| Panel | `laboratorio/panel.html` | Lee los issues con la etiqueta `registro` |
| Eventos compartidos del explorador | Base Supabase (`eventos`) | **No conectada** con el Laboratorio. Antes habría que restringir sus políticas, que hoy permiten insertar y modificar a cualquiera |

## Versión 0.3: pedagogía por tema

El Laboratorio se organiza ahora alrededor de un **tema** y no de una lista de objetivos: *¿Cuándo puedo creerle a un resultado sobre eventos y ciclos astronómicos?* (el principio de la causalidad por relación estadística). Las tres compuertas son sus tres subpreguntas, y cada paso abre con la suya. Las capacidades que se desarrollan aparecen derivadas, en un desplegable de la entrada.

Qué se añadió:

- **Apuesta antes de calcular** (Compuerta 1 y 3a): el estudiante predice, con su nivel de seguridad, y después compara con el resultado. La Compuerta 1 no calcula sin apuesta (o sin marcar «prefiero no apostar»).
- **Preguntas de comprobación con retroalimentación** (siete, en tres bloques), centradas en ideas erróneas frecuentes; incluyen un caso con error real del proyecto (la «réplica» que reutiliza el 36 % de los eventos del descubrimiento).
- **Cálculo guiado que se va retirando** (paso resuelto, paso a medias, paso solo) con los números del propio caso.
- **Ciencia o disciplina** (sismología, ciclones, salud, ecología, educación, otra) con una sugerencia de cómo se traduce el método. Son sugerencias por validar con el grupo.
- **Ficha de los datos** (fuente, licencia, precisión de hora y lugar, cobertura, artefactos) y una guía de dónde buscar datos, con enlaces a las fuentes; la licencia debe verificarse en cada fuente.
- **Buenas prácticas del recorrido** y **dossier personal** (.md) con apuestas, comprobaciones, reflexión y buenas prácticas. El dossier no se publica.
- **Registro:** ahora incluye la disciplina, la ficha de datos y si la hipótesis se cambió después de ver el resultado (`cambio_hipotesis_tras_ver_resultado`). El panel lo muestra como aviso.

Pendiente de la revisión pedagógica: validar las respuestas erróneas elegidas con el grupo, traducir al inglés, una evaluación del aprendizaje (inventario de conceptos antes y después) y una versión privada del panel para estudiantes que no quieran registros públicos.

## Versión 0.2: revisión didáctica

Cambios hechos tras revisar la página como material de aprendizaje:

- **Entrada:** un dibujo de las tres compuertas con dos recorridos reales, tres analogías (balanza, familia, moneda) y tres **ejemplos guiados** (marea y sismos, marea y huracanes, estacionalidad de ciclones) con su historia y qué probar.
- **Paso 1:** solo lo esencial a la vista y el resto en «Opciones avanzadas»; cada campo tiene un botón «?» con una explicación y un ejemplo; botón «Rellenar con un ejemplo»; autoguardado del borrador en el navegador; «Empezar de nuevo».
- **Paso 2:** plantilla CSV, datos de práctica sintéticos, un dibujo que explica el tamaño efectivo y una nota «Cómo leerlo» con los resultados.
- **Compuerta 1:** semáforo con lenguaje amable (el rojo se presenta como información, no como fracaso), cuatro gráficos (efecto buscado frente al mínimo detectable, muestra necesaria, curva de atenuación con tu error de hora, y la informatividad de la réplica), lista de «Qué puedes hacer ahora» y un simulador «Qué pasaría si…» con tres controles que cambian el semáforo al instante.
- **Compuerta 3:** cada resultado explica en una frase qué significa, con su gráfico.
- **Registro:** resumen legible de «Tu recorrido»; el JSON y la huella quedan en un desplegable.
- **Glosario** en una ventana accesible desde la cabecera, y los resultados anuncian los cambios a lectores de pantalla.

## Qué hay

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El asistente: hipótesis, datos, Compuerta 1, configuración de la 2, revisión de la 3 y registro |
| `panel.html` | Panel de seguimiento: lee los registros públicos de GitHub y marca quién necesita ayuda |
| `../.github/ISSUE_TEMPLATE/registro-hipotesis.yml` | Formulario de GitHub que recibe el registro |

## Qué hace ya

- **Paso 1, hipótesis.** Fija la pregunta, el efecto de interés, el error de hora y de lugar, la dirección y el número de hipótesis. Puede partir de una de las 11 afirmaciones del libro (PV-01 a PV-11), con página, cita literal y «qué no dice».
- **Paso 2, datos.** Lee un CSV en el navegador (no se sube a ningún sitio), cuenta eventos y unidades, calcula el tamaño efectivo de muestra y avisa de horas redondeadas, duplicados y distribución horaria rara.
- **Compuerta 1.** Estima el efecto mínimo detectable con error de medida, el factor de muestra necesario y la categoría (analizable / con costo / no analizable en principio), con lo que falta. Reproduce los resultados publicados: marea y sismos (muestra × 3,2), marea y huracanes (× 12,3) y estacionalidad de ciclones (× 0,066).
- **Compuerta 3, herramientas.** Informatividad de una réplica (piso de detección frente al efecto) y revisión de independencia entre dos archivos (eventos y periodos compartidos). Reproducen Mercurio–Urano (informativa, razón 0,69) y el caso R3 (en el límite; comparte eventos).
- **Registro.** Genera un JSON con su huella SHA-256 y abre un formulario de GitHub con los campos rellenos.

## Qué falta

- **Compuerta 2.** Hoy solo descarga la configuración (`calibre_config.json`) para `calibre_core`. El cuaderno de Colab que la ejecuta está pendiente.
- La Compuerta 1 solo tiene referencias para marea terrestre y estacionalidad solar; con otra variable el usuario introduce su propia referencia.
- La curva de atenuación considera solo el error de hora; el error de lugar se introduce a mano (campo «atenuación a»).

## Cómo publicarlo (una vez)

1. Sube al repositorio, en la raíz: la carpeta `laboratorio/` (`index.html`, `panel.html`, `LEEME.md`), el archivo `.github/ISSUE_TEMPLATE/registro-hipotesis.yml` y el `index.html` de la raíz (con el enlace al Laboratorio). Si la carpeta `.github` no te deja arrastrarla, crea el archivo desde «Add file → Create new file» escribiendo la ruta completa y pegando su contenido. Hasta que `laboratorio/` esté en el repositorio, la dirección del Laboratorio da 404.
2. Activa GitHub Pages (Settings → Pages) sobre la rama principal.
3. Crea en el repositorio la etiqueta `registro` (Issues → Labels). El panel solo lee issues con esa etiqueta.
4. Si el repositorio no es `Invesciencias/Cosmobiologia`, cambia la constante `REPO` al inicio del script de `index.html` y de `panel.html`.
5. Cuando termine de publicarse, el Laboratorio queda en https://invesciencias.github.io/Cosmobiologia/laboratorio/ y el panel en https://invesciencias.github.io/Cosmobiologia/laboratorio/panel.html (el repositorio ya tiene GitHub Pages activo). Sube también el `index.html` de la raíz para que el explorador muestre el enlace al Laboratorio.
6. Prueba con uno de los ejemplos y con un registro de prueba que luego cierres.
7. **Licencia.** El repositorio no tiene archivo de licencia. Elige una para el código y otra para los textos y datos propios antes de abrirlo a todo el mundo; no la he añadido porque es una decisión tuya.

## Qué se publica y qué no

Solo se publica el registro que la persona decide enviar: hipótesis, resumen de datos (conteos y huella del archivo), veredicto y resultados de la Compuerta 3. **Los datos no se suben.** El registro queda con la fecha que le pone GitHub, que es una marca de tiempo externa pero no sustituye a un depósito en Zenodo u OSF.

## Para hacer después

- Cuaderno de Colab para la Compuerta 2 y traducción al inglés.
- Pruebas automáticas contra los casos publicados (marea y sismos, marea y huracanes, estacionalidad, Mercurio–Urano, R3).
- Revisar las políticas de la base Supabase del explorador: permite insertar y modificar eventos a cualquiera.
