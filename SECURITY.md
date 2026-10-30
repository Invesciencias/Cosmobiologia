# Política de seguridad

## Cómo reportar una vulnerabilidad

Si encuentras un problema de seguridad en este sitio o en su código (por ejemplo, una forma de inyectar código en una página, un dato personal expuesto o una credencial publicada), **no lo publiques en un issue abierto**.

Repórtalo de forma privada desde la pestaña **Security → Report a vulnerability** de este repositorio. Incluye:

- Qué página o archivo está afectado y cómo reproducir el problema.
- Qué impacto crees que tiene.
- Si lo deseas, tu nombre para darte el crédito.

Responderemos lo antes posible. Por favor, danos un plazo razonable para corregirlo antes de divulgarlo.

## Qué cubre

- El sitio publicado en https://invesciencias.github.io/Cosmobiologia/ (portada, explorador, Laboratorio, panel y cuestionario).
- El código de `codigo/` y los archivos de `js/`.

No cubre los servicios de terceros (GitHub, Supabase, EmailJS, los proveedores de datos). Si el problema está ahí, repórtalo a su responsable.

## Qué hace el sitio con tus datos

- El **Laboratorio** y el **cuestionario** calculan todo en tu navegador. Los datos que cargas no se envían a ningún servidor.
- Lo que guardas en el navegador (borradores y respuestas) queda en tu equipo, en el almacenamiento local.
- Los **registros públicos** del Laboratorio son *issues* de GitHub: son públicos y permanentes. No incluyas datos personales ni de salud.
- La función opcional de **nube compartida** del explorador envía los eventos que tú decidas a un proyecto de Supabase que tú configuras.

## Versiones

Solo se mantiene la versión publicada en la rama `main`.
