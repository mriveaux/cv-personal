# CV personal — sitio web + export PDF

## Resumen

Sitio web personal de Miguel Díaz Riveaux: portfolio/CV en vivo, multi-idioma,
con opción de descargar/imprimir el CV en PDF desde el navegador. Reemplaza
el repo estático de 2021 (`mriveaux/mdriveaux-profile`).

## Objetivos

- Sitio en vivo, moderno, minimalista, responsive.
- Contenido en 6 idiomas: es (default), en, ca, pt, fr, de.
- Botón de descarga/impresión del CV a PDF.
- Deploy dual: Cloudflare Pages (principal), GitHub Pages (respaldo).
- Sin exponer PII sensible (carné de identidad, dirección particular, teléfono).

## No-objetivos

- Backend, base de datos, formularios con envío server-side.
- Revisión humana de las traducciones (IA-only, aceptado por el usuario).
- Generación de PDF real en build time (v1 usa CSS de impresión). Ver "Fast-follows".

## Fuentes de datos y reglas de reconciliación

- **LinkedIn** (`linkedin.com/in/mdriveaux`, extraído 2026-08-29): fuente de verdad
  para estado actual — ubicación (Madrid, España), rol actual (Software Developer,
  Flexibleplaces), resumen "Acerca de", experiencia completa, educación, idiomas,
  proyectos destacados.
- **PDF `CV_es_Miguel_Díaz_Riveaux_2023.pdf`**: fuente para detalle histórico que
  LinkedIn no cubre a ese nivel (descripción de responsabilidades en XETID/DESOFT,
  niveles de skill, lista extendida de tecnologías, cursos de postgrado).
- Donde ambas fuentes chocan (ej. situación laboral/ubicación), **LinkedIn gana**
  por ser más reciente.
- **Excluidos explícitamente**: número de carné de identidad, dirección particular,
  teléfono personal. Sí se incluyen: email, LinkedIn, GitHub, Stack Overflow.

## Arquitectura

- **Astro** (output estático) + **Tailwind CSS**. Gestor de paquetes: **pnpm**.
- El scaffold actual (`src/index.ts`, `tsconfig.json` de `tsc` plano) se reemplaza
  por el scaffold de Astro al iniciar la implementación.
- Sin framework de UI adicional (no React/Vue) — componentes `.astro` puros;
  cero JS en cliente salvo el necesario para el selector de idioma y el botón
  de descarga.

## Contenido (Content Collections)

- Un archivo de datos base en español (`src/content/cv/es.json` o similar,
  tipado con schema de Zod vía Astro Content Collections) con toda la
  información reconciliada de las dos fuentes.
- 5 archivos adicionales (`en.json`, `ca.json`, `pt.json`, `fr.json`, `de.json`)
  generados una sola vez por traducción IA a partir del archivo base, y
  commiteados como contenido estático (no traducción en runtime).
- Secciones del modelo de datos: `hero`, `about`, `experience[]`,
  `featuredProjects[]`, `skills`, `education[]`, `languages[]`, `contact`.

## Internacionalización (routing)

- i18n nativo de Astro. `defaultLocale: "es"`, `locales: ["es","en","ca","pt","fr","de"]`,
  `prefixDefaultLocale: false` → rutas: `/`, `/en/`, `/ca/`, `/pt/`, `/fr/`, `/de/`.
- Selector de idioma en el header, visible en todas las páginas.

## Páginas / componentes

- **Header/Nav**: nombre, selector de idioma, enlaces de ancla (Acerca de,
  Experiencia, Skills, Educación, Contacto), botón "Descargar CV".
- **Hero**: nombre, título profesional, ubicación.
- **Acerca de**: resumen (LinkedIn).
- **Experiencia**: timeline (Flexibleplaces, Desoft, GESICU/Future Framework,
  XETID, Nemexo).
- **Proyectos destacados**: Future Framework, CMI Perdurit, TaxiRutero2,
  SERVELEC, FutureTrans.
- **Skills**: lenguajes/frameworks + tecnologías (PDF) + top skills (LinkedIn).
- **Educación**: UCI.
- **Idiomas hablados**: ES nativo, EN C1, FR B1.
- **Contacto/Footer**: email, LinkedIn, GitHub, Stack Overflow.

Una sola página larga (single-page) por idioma, secciones con anclas — no
sub-rutas por sección.

## Export a PDF

- Botón "Descargar CV" ejecuta `window.print()`.
- Hoja de estilos `@media print` dedicada: oculta header/nav/botón, ajusta
  layout a formato imprimible A4.
- Sin generación de archivo PDF en build (ver Fast-follows).

## Deploy

- **Cloudflare Pages** (principal): conectado al repo, build `pnpm build`,
  output `dist/`, dominio propio o subdominio `.pages.dev` → `base: "/"`.
- **GitHub Pages** (respaldo): workflow de GitHub Actions que hace build y
  publica `dist/` a la rama `gh-pages`. Si se sirve desde
  `usuario.github.io/cv-personal` (sin dominio propio), Astro necesita
  `base: "/cv-personal"` para ese build — se resuelve con una variable de
  entorno (`DEPLOY_TARGET=gh-pages`) leída en `astro.config.mjs` para
  alternar el `base` según el target de build.

## Testing / verificación

- `pnpm dev` y revisión visual manual de cada idioma (6) en desktop y mobile.
- Vista previa de impresión (`Cmd+P`) para validar el CSS de impresión.
- `pnpm build` sin errores; preview del build estático localmente.
- Deploy preview en Cloudflare Pages antes de mergear a producción.
- Verificar que ningún archivo de contenido incluye los datos PII excluidos.

## Fast-follows (fuera de v1)

- PDF real pre-generado por idioma en build time (ej. vía Playwright headless).
- Revisión humana de traducciones.
- Analítica de visitas.
