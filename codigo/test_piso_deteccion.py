import unittest

from piso_deteccion import (ee_rel, f_requerido, mde_degradado, mde_nominal,
                            piso_D_A, piso_D_B, piso_D_Be, razon_exceso,
                            z_B_derivado)


class ValoresPublicados(unittest.TestCase):
    """Valores de K2_pisos_exactos.csv, README.md y resultados_C3.csv."""

    def test_R1(self):
        self.assertAlmostEqual(piso_D_B(581, 0.0501), 1.449, places=3)

    def test_mercurio_urano_gcmt(self):
        self.assertAlmostEqual(piso_D_B(2731, 0.046315), 1.216, places=3)

    def test_readme_D_A(self):
        self.assertAlmostEqual(piso_D_A(3730, 0.05), 1.263, places=3)

    def test_D_A_csv(self):
        self.assertAlmostEqual(piso_D_A(581, 0.0501), 1.6645, places=3)

    def test_D_Be_mu_descubrimiento(self):
        self.assertAlmostEqual(piso_D_Be(0.002877993206785, 0.0481024128686327), 1.1488, places=3)

    def test_razon_exceso_R1(self):
        r = razon_exceso(piso_D_B(581, 0.0501), 1.3153347972935312)
        self.assertAlmostEqual(r, 1.425, places=3)

    def test_marea_sismos(self):
        deg = mde_degradado(1.78, 0.9999836505423143)
        self.assertAlmostEqual(f_requerido(deg, 1.0), 3.17, places=2)

    def test_marea_huracanes(self):
        deg = mde_degradado(1.6419866459916292, 0.4682389117262653)
        self.assertAlmostEqual(deg, 3.5067, places=3)
        self.assertAlmostEqual(f_requerido(deg, 1.0), 12.3, places=1)


class Propiedades(unittest.TestCase):
    def test_constante_Z_B(self):
        self.assertAlmostEqual(z_B_derivado(), 2.4866, places=3)

    def test_D_A_mayor_que_D_B(self):
        self.assertGreater(piso_D_A(581, 0.0501), piso_D_B(581, 0.0501))

    def test_piso_baja_con_n(self):
        self.assertLess(piso_D_B(4000, 0.05), piso_D_B(1000, 0.05))
        self.assertAlmostEqual(piso_D_B(1e16, 0.05), 1.0, places=5)

    def test_escalado(self):
        self.assertAlmostEqual(mde_nominal(2.0, 400, 100), 4.0)

    def test_ee_rel(self):
        self.assertAlmostEqual(ee_rel(100, 0.5), 0.1)

    def test_entradas_invalidas(self):
        for args in [(0, 0.05), (-1, 0.05), (10, 0), (10, 1), (10, 1.5)]:
            with self.assertRaises(ValueError):
                ee_rel(*args)
        with self.assertRaises(ValueError):
            mde_degradado(1.0, 0)
        with self.assertRaises(ValueError):
            f_requerido(1.0, 0)
        with self.assertRaises(ValueError):
            razon_exceso(1.2, 1.0)


if __name__ == "__main__":
    unittest.main()
