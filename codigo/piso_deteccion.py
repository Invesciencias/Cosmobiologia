"""Piso de deteccion (RR minimo) y MDE degradado. Autonomo: solo libreria estandar.

Para una proporcion esperada f y n eventos, el error estandar relativo es
    EE_rel = sqrt((1 - f) / (n * f))
y el piso es el menor cociente observado/esperado (RR) detectable:

    D_A = 1 + 3,88 * 0,948 * EE_rel   barrido de ~400 rasgos (README, Figura 1)
    D_B = 1 + 2,4866 * EE_rel         una prueba preespecificada, unilateral,
                                      alfa = 0,05, potencia 80 % (replicas)
    D_Be = 1 + 2,4866 * sd / f        como D_B con la SD empirica del nulo

En D_A, 3,88 es el techo de ruido medido (maximo |z| bajo fechas aleatorizadas)
y 0,948 el factor empirico de calibracion de la SD del nulo; ambos son
constantes medidas, no derivadas. En D_B, 2,4866 = z(0,95) + z(0,80).
No mezclar D_A y D_B en una misma comparacion (ver NOTA_PISO_DETECCION.md).

Compuerta 1: MDE_nom = MDE_ref * sqrt(n_ref / n_ef);  MDE_deg = MDE_nom / a;
F = (MDE_deg / beta)^2, con a la atenuacion (0 < a <= 1) y beta el efecto de interes.
"""
from math import sqrt
from statistics import NormalDist

Z_A = 3.88         # techo de ruido medido, barrido de ~400 rasgos
C_A = 0.948        # factor empirico de calibracion
Z_B = 2.4866       # = z(0,95) + z(0,80); ver z_B_derivado()


def z_B_derivado(alfa=0.05, potencia=0.80):
    """z de una prueba unilateral: z(1-alfa) + z(potencia). Con los valores por defecto da 2,4865."""
    nd = NormalDist()
    return nd.inv_cdf(1 - alfa) + nd.inv_cdf(potencia)


def _validar(n, f):
    if not n > 0:
        raise ValueError("n debe ser > 0")
    if not 0 < f < 1:
        raise ValueError("f debe estar en (0, 1)")


def ee_rel(n, f):
    """Error estandar relativo binomial de la razon observado/esperado."""
    _validar(n, f)
    return sqrt((1 - f) / (n * f))


def piso_D_A(n, f):
    return 1 + Z_A * C_A * ee_rel(n, f)


def piso_D_B(n, f):
    return 1 + Z_B * ee_rel(n, f)


def piso_D_Be(sd_nulo, f):
    """D_B con la SD empirica del nulo (en escala de proporcion)."""
    if not (sd_nulo > 0 and 0 < f < 1):
        raise ValueError("sd_nulo > 0 y 0 < f < 1")
    return 1 + Z_B * sd_nulo / f


def razon_exceso(piso, rr):
    """(piso - 1) / (RR - 1). Informativa si <= 1 (el efecto supera el piso)."""
    if not rr > 1:
        raise ValueError("rr debe ser > 1")
    return (piso - 1) / (rr - 1)


def mde_nominal(mde_ref, n_ref, n_ef):
    """MDE reescalado de n_ref a n_ef: mde_ref * sqrt(n_ref / n_ef)."""
    if not (mde_ref > 0 and n_ref > 0 and n_ef > 0):
        raise ValueError("mde_ref, n_ref y n_ef deben ser > 0")
    return mde_ref * sqrt(n_ref / n_ef)


def mde_degradado(mde_nom, a):
    """MDE con atenuacion a: mde_nom / a."""
    if not 0 < a <= 1.0001:
        raise ValueError("a debe estar en (0, 1]")
    return mde_nom / a


def f_requerido(mde_deg, beta):
    """Factor de muestra F = (MDE_deg / beta)^2. F <= 1: la muestra basta."""
    if not beta > 0:
        raise ValueError("beta debe ser > 0")
    return (mde_deg / beta) ** 2
