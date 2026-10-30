# Conectar la nube compartida (Supabase) — paso a paso

Objetivo: que todos los investigadores de Invesciencias suban y compartan eventos
en una misma base de datos en la nube, gratis. ~10 minutos, una sola vez.

---

## 1. Crear el proyecto (una persona del equipo, el "administrador")

1. Entra a **https://supabase.com** → **Start your project** → regístrate (con GitHub o correo).
2. **New project**:
   - **Name**: `invesciencias-cosmobiologia`
   - **Database Password**: genera una y **guárdala** (no se usa en la web, pero la necesitarás para administración).
   - **Region**: la más cercana (ej. *East US* o *São Paulo*).
3. Espera ~2 min a que se aprovisione.

## 2. Crear la tabla `eventos`

1. En el menú lateral: **SQL Editor** → **New query**.
2. Pega y ejecuta (**Run**):

```sql
create table eventos (
  event_id     text primary key,
  domain       text,
  subtype      text,
  datetime_utc timestamptz,
  latitude     double precision,
  longitude    double precision,
  place        text,
  value        double precision,
  value_kind   text,
  source       text,
  extra_json   jsonb,
  created_at   timestamptz default now()
);
alter table eventos enable row level security;
create policy "lectura_publica"  on eventos for select using (true);
create policy "insercion_publica" on eventos for insert with check (true);
create policy "update_publico"    on eventos for update using (true);
```

> ⚠ Estas políticas permiten que **cualquiera con la clave anon** lea e inserte.
> Es lo más simple para arrancar en equipo. Si más adelante quieres **moderación**
> (solo investigadores autenticados escriben), avísame y cambiamos a políticas con
> `auth.uid()` + login.

## 3. Copiar las credenciales

1. Menú lateral: **Project Settings** (engranaje) → **API**.
2. Copia dos valores:
   - **Project URL** → ej. `https://abcd1234.supabase.co`
   - **Project API keys → `anon` `public`** → una cadena larga que empieza con `eyJ...`

> La clave `anon` es **pública por diseño** (va en el navegador). La que **nunca**
> debes compartir ni poner en la web es la `service_role`.

## 4. Conectar la página

1. Abre `index.html` → pestaña **📝 Captura** → tarjeta **☁ Nube compartida (Supabase)**.
2. Pega **Project URL** y la clave **anon**.
3. Clic en **🔌 Probar conexión**.
   - ✓ *"conectado · N eventos en la nube"* → todo listo.
   - ✗ *"falta la tabla «eventos»"* → repite el paso 2.
   - ✗ *"error de red"* → revisa que la URL esté completa y sin espacios.
4. **⬆ Subir eventos a la nube** sube los que tengas cargados (los duplicados se
   fusionan por `event_id`, no se repiten).
5. Cada investigador hace los pasos 3–4 con la **misma** URL y clave anon; con
   **⬇ Traer eventos de la nube** todos descargan lo que los demás aportaron.

## 5. Compartir con el equipo

Reparte a los investigadores **solo dos cosas** (por correo interno o documento):
- la **Project URL**
- la clave **anon public**

Con eso ya pueden conectar su propia página y colaborar sobre el mismo banco.

---

## Notas
- **Capa gratuita**: 500 MB de base + 5 GB de transferencia/mes. Suficiente para
  cientos de miles de eventos de texto.
- **Respaldo**: además de la nube, usa **⬇ Exportar eventos.csv** periódicamente.
- **Privacidad**: para eventos de personas (natalidad, infartos) usa solo datos
  anonimizados o con consentimiento; revisa el apartado ético antes de subirlos.
