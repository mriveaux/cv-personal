# CV Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, multi-language (6 locales) personal CV/portfolio site in Astro + Tailwind, with a print-to-PDF export, deployed to Cloudflare Pages (primary) and GitHub Pages (backup).

**Architecture:** Astro static site. CV content lives in a typed Content Collection (one JSON file per locale, validated with Zod). A single shared `CVPage` component renders any locale; thin page files wire it to routes (`/` for Spanish, `/{lang}/` for the other five). PDF export uses `window.print()` with a dedicated print stylesheet — no server, no build-time PDF generation.

**Tech Stack:** Astro (static output), `@astrojs/tailwind`, Tailwind CSS, Zod, Vitest, pnpm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-29-cv-personal-site-design.md`

## Global Constraints

- Package manager is **pnpm** only — never `npm`/`yarn`, never commit `package-lock.json`.
- Stack is Astro (static output) + Tailwind CSS — no React/Vue/Svelte.
- Locales are exactly `["es", "en", "ca", "pt", "fr", "de"]`; `es` is the default and unprefixed (`/`), the rest are prefixed (`/en/`, `/ca/`, `/pt/`, `/fr/`, `/de/`).
- Never include the following in any content file or rendered page: national ID number, home address, personal phone number.
- Contact info that **is** allowed: email, LinkedIn, GitHub, Stack Overflow.
- Where LinkedIn and the 2023 PDF disagree, LinkedIn (more recent) wins.
- PDF export v1 is `window.print()` + print CSS — no build-time PDF generation.
- Deploy targets: Cloudflare Pages (primary) and GitHub Pages (backup), built from the same `dist/` output.

---

### Task 1: Project scaffold (Astro + Tailwind)

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Delete: `src/index.ts`
- Create: `astro.config.mjs`
- Create: `tailwind.config.mjs`
- Create: `src/styles/global.css`
- Create: `src/pages/index.astro`

**Interfaces:**
- Produces: a working `pnpm build` / `pnpm dev` / `pnpm preview` Astro project. Later tasks add to `src/pages`, `src/components`, `src/content`, `src/layouts`, `src/i18n` without touching this task's config files again (except Task 9, which extends `astro.config.mjs`).

- [ ] **Step 1: Install Astro and Tailwind**

Run: `pnpm add astro @astrojs/tailwind tailwindcss`
Expected: `package.json` gains `dependencies.astro`, `dependencies.@astrojs/tailwind`, `dependencies.tailwindcss`.

- [ ] **Step 2: Remove the old bare-TS scaffold**

```bash
rm src/index.ts
```

- [ ] **Step 3: Create the Astro config**

Create `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

- [ ] **Step 4: Create the Tailwind config**

Create `tailwind.config.mjs`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 5: Create the global stylesheet**

Create `src/styles/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create a placeholder home page**

Create `src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Miguel Díaz Riveaux</title>
  </head>
  <body>
    <h1>Miguel Díaz Riveaux</h1>
  </body>
</html>
```

- [ ] **Step 7: Point tsconfig at Astro's strict preset**

Replace the contents of `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 8: Add npm scripts**

Edit `package.json`, replace the `"scripts"` block:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 9: Ignore build output**

Edit `.gitignore`, add:

```
/dist
/.astro
```

- [ ] **Step 10: Verify the build**

Run: `pnpm build && grep -q "Miguel Díaz Riveaux" dist/index.html && echo OK`
Expected: prints `OK`.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json .gitignore astro.config.mjs tailwind.config.mjs src/styles/global.css src/pages/index.astro
git rm src/index.ts
git commit -m "Scaffold Astro + Tailwind project"
```

---

### Task 2: CV content schema + Spanish base content

**Files:**
- Create: `src/content/cv.schema.ts`
- Create: `src/content/config.ts`
- Create: `src/content/cv/es.json`
- Test: `tests/content.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing from Task 1 directly (independent of the page/layout work).
- Produces: `cvSchema` and `type CvData` from `src/content/cv.schema.ts`, imported by every component task from Task 6 onward. The `cv` content collection (id = locale code, e.g. `"es"`) is readable via `getEntry('cv', lang)`.

- [ ] **Step 1: Install Zod and Vitest**

Run: `pnpm add zod && pnpm add -D vitest`

- [ ] **Step 2: Add the test script**

Edit `package.json`, add to `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Write the CV schema**

Create `src/content/cv.schema.ts`:

```ts
import { z } from 'zod';

const experienceEntry = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string(),
  highlights: z.array(z.string()),
});

const projectEntry = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string(),
});

const skillCategory = z.object({
  name: z.string(),
  items: z.array(z.string()),
});

const educationEntry = z.object({
  institution: z.string(),
  degree: z.string(),
  period: z.string(),
});

const languageEntry = z.object({
  name: z.string(),
  level: z.string(),
});

const navLabels = z.object({
  about: z.string(),
  experience: z.string(),
  projects: z.string(),
  skills: z.string(),
  education: z.string(),
  languages: z.string(),
  contact: z.string(),
});

export const cvSchema = z.object({
  hero: z.object({
    name: z.string(),
    title: z.string(),
    location: z.string(),
  }),
  about: z.string(),
  experience: z.array(experienceEntry),
  featuredProjects: z.array(projectEntry),
  skills: z.object({
    categories: z.array(skillCategory),
  }),
  education: z.array(educationEntry),
  languages: z.array(languageEntry),
  contact: z.object({
    email: z.string(),
    linkedin: z.string(),
    github: z.string(),
    stackoverflow: z.string(),
  }),
  ui: z.object({
    nav: navLabels,
    downloadCta: z.string(),
    sectionTitles: navLabels,
  }),
});

export type CvData = z.infer<typeof cvSchema>;
```

- [ ] **Step 4: Wire the schema into an Astro content collection**

Create `src/content/config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { cvSchema } from './cv.schema';

const cv = defineCollection({
  type: 'data',
  schema: cvSchema,
});

export const collections = { cv };
```

- [ ] **Step 5: Write the failing content test**

Create `tests/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cvSchema } from '../src/content/cv.schema';

const CONTENT_DIR = resolve(__dirname, '../src/content/cv');

const FORBIDDEN_STRINGS = [
  '89062145803', // carné de identidad
  '54152944', // teléfono particular
  '78356300', // teléfono empresarial (Desoft)
  'Buenavista', // dirección particular
  '29A20', // dirección particular
];

function loadContentFiles(): { file: string; data: unknown }[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      file,
      data: JSON.parse(readFileSync(resolve(CONTENT_DIR, file), 'utf-8')),
    }));
}

describe('CV content files', () => {
  it('has at least the Spanish locale file', () => {
    expect(readdirSync(CONTENT_DIR)).toContain('es.json');
  });

  it('every locale file matches the CV schema', () => {
    for (const { file, data } of loadContentFiles()) {
      const result = cvSchema.safeParse(data);
      expect(
        result.success,
        `${file}: ${JSON.stringify(result.success ? null : result.error.issues)}`,
      ).toBe(true);
    }
  });

  it('never contains excluded personal data', () => {
    for (const { file, data } of loadContentFiles()) {
      const serialized = JSON.stringify(data);
      for (const forbidden of FORBIDDEN_STRINGS) {
        expect(
          serialized.includes(forbidden),
          `${file} contains forbidden string "${forbidden}"`,
        ).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `ENOENT` reading `src/content/cv` (directory doesn't exist yet).

- [ ] **Step 7: Write the Spanish base content**

Create `src/content/cv/es.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, España"
  },
  "about": "Con más de una década de experiencia en el sector tecnológico, me especializo en el desarrollo de software a medida que impulsa la eficiencia operativa. He liderado proyectos de implementación de sistemas de gestión (ERP, CRM), así como el desarrollo de plataformas web, obteniendo siempre resultados alineados a los objetivos del cliente. Mi enfoque autodidacta y mi compromiso con la mejora continua me han permitido mantenerme actualizado en las últimas tendencias tecnológicas. Durante más de 5 años como freelance en Cuba, colaboré con empresas locales para digitalizar procesos clave en áreas como contabilidad, inventarios, logística y recursos humanos. Creo firmemente en el trabajo en equipo, la disciplina técnica y la entrega de valor real en cada proyecto.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "Enero 2024 – Actualidad",
      "location": "Madrid, España (híbrido)",
      "highlights": ["Desarrollo de la plataforma de gestión de espacios y reservas de Flexibleplaces."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freelance)",
      "period": "Junio 2022 – Enero 2024",
      "location": "Remoto",
      "highlights": ["Colaboración remota como desarrollador independiente antes de incorporarme a jornada completa."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Especialista B en Ciencias Informáticas",
      "period": "Septiembre 2017 – Enero 2024",
      "location": "La Habana, Cuba",
      "highlights": [
        "Desarrollador de software, Gestor de la Configuración y Jefe del Comité de Arquitectura.",
        "Sistema de Control de Bienes Patrimoniales para la Oficina del Historiador de La Habana.",
        "Sitios web para Pesca Caribe, Registro Central Comercial de Cuba (RCC), UPTCER y ANTEX."
      ]
    },
    {
      "company": "GESICU (Grupo Especializado en Servicios Informáticos)",
      "role": "CEO y Freelance Software Engineer",
      "period": "Febrero 2016 – Noviembre 2022",
      "location": "Cuba",
      "highlights": [
        "Análisis, diseño, modelación e implementación de software para personas naturales y jurídicas en Cuba.",
        "Creador de Future Framework, plataforma web modular para el desarrollo de soluciones de gestión a medida, registrada en el CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (jornada parcial)",
      "period": "Marzo 2020 – Julio 2021",
      "location": "La Habana, Cuba",
      "highlights": ["Desarrollo de soluciones para la mejora de procesos de negocio."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "Agosto 2012 – Agosto 2016",
      "location": "Cuba",
      "highlights": [
        "Analista, arquitecto y desarrollador del ERP DISTRA (gestión contable-financiera).",
        "Secretario del Comité de Arquitectura."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Plataforma web modular, multiusuario y multientidad para el desarrollo de soluciones de gestión a medida (estructura organizativa, RRHH, facturación, producción, flota de vehículos).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Cuadro de Mando Integral para la Empresa de Fibrocemento Perdurit: alinea la estrategia de la empresa con reportes consolidados y desglosados en tiempo real.", "url": "" },
    { "name": "Sistema de gestión Cooperativa TaxiRutero2", "description": "Gestión de la flota de vehículos, el capital humano, las expediciones y la facturación para una cooperativa de transporte en La Habana.", "url": "" },
    { "name": "SERVELEC", "description": "Sitio web para la cooperativa SERVELEC, especializada en reparación y mantenimiento de sistemas de pesaje e industriales.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Software para el control de procesos de transporte, construido sobre Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Lenguajes y frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Datos", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Herramientas y tecnologías", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Metodologías", "items": ["Scrum", "Liderazgo de equipos de desarrollo", "Gestión de proyectos", "Análisis y arquitectura de software"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Ingeniero en Ciencias Informáticas", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Español", "level": "Nativo" },
    { "name": "Inglés", "level": "C1" },
    { "name": "Francés", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "Acerca de", "experience": "Experiencia", "projects": "Proyectos", "skills": "Habilidades", "education": "Educación", "languages": "Idiomas", "contact": "Contacto" },
    "downloadCta": "Descargar CV",
    "sectionTitles": { "about": "Acerca de", "experience": "Experiencia", "projects": "Proyectos destacados", "skills": "Habilidades", "education": "Educación", "languages": "Idiomas", "contact": "Contacto" }
  }
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml src/content tests
git commit -m "Add CV content schema, Vitest, and Spanish base content"
```

---

### Task 3: Translated content files (en, ca, pt, fr, de)

**Files:**
- Create: `src/content/cv/en.json`
- Create: `src/content/cv/ca.json`
- Create: `src/content/cv/pt.json`
- Create: `src/content/cv/fr.json`
- Create: `src/content/cv/de.json`

**Interfaces:**
- Consumes: `cvSchema` (Task 2) — every file below must conform to it.
- Produces: the full set of 6 locale content files that Task 8's pages depend on.

- [ ] **Step 1: English content**

Create `src/content/cv/en.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, Spain"
  },
  "about": "With over a decade of experience in the technology sector, I specialize in custom software development that drives operational efficiency. I have led implementation projects for management systems (ERP, CRM) as well as web platform development, consistently delivering results aligned with client objectives. My self-taught approach and commitment to continuous improvement have kept me up to date with the latest technology trends. Over more than 5 years as a freelancer in Cuba, I collaborated with local companies to digitize key processes in areas such as accounting, inventory, logistics, and human resources. I firmly believe in teamwork, technical discipline, and delivering real value on every project.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "January 2024 – Present",
      "location": "Madrid, Spain (hybrid)",
      "highlights": ["Development of Flexibleplaces' space management and booking platform."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freelance)",
      "period": "June 2022 – January 2024",
      "location": "Remote",
      "highlights": ["Remote collaboration as an independent developer before joining full-time."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Grade B Computer Science Specialist",
      "period": "September 2017 – January 2024",
      "location": "Havana, Cuba",
      "highlights": [
        "Software developer, Configuration Manager, and Head of the Architecture Committee.",
        "Asset Management Control System for the Office of the Historian of Havana.",
        "Websites for Pesca Caribe, Cuba's Central Commercial Registry (RCC), UPTCER, and ANTEX."
      ]
    },
    {
      "company": "GESICU (Specialized IT Services Group)",
      "role": "CEO and Freelance Software Engineer",
      "period": "February 2016 – November 2022",
      "location": "Cuba",
      "highlights": [
        "Analysis, design, modeling, and implementation of software for individuals and businesses in Cuba.",
        "Creator of Future Framework, a modular web platform for custom management solutions, registered with CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (part-time)",
      "period": "March 2020 – July 2021",
      "location": "Havana, Cuba",
      "highlights": ["Development of business process improvement solutions."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "August 2012 – August 2016",
      "location": "Cuba",
      "highlights": [
        "Analyst, architect, and developer of the DISTRA ERP (accounting and financial management).",
        "Secretary of the Architecture Committee."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Modular, multi-user, multi-entity web platform for building custom management solutions (organizational structure, HR, invoicing, production, vehicle fleet).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Balanced Scorecard for Empresa de Fibrocemento Perdurit: aligns company strategy with real-time consolidated and detailed reporting.", "url": "" },
    { "name": "TaxiRutero2 Cooperative Management System", "description": "Vehicle fleet, human capital, dispatch, and billing management for a transportation cooperative in Havana.", "url": "" },
    { "name": "SERVELEC", "description": "Website for the SERVELEC cooperative, specialized in repair and maintenance of weighing and industrial systems.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Transportation process control software, built on Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Languages & frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Data", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Tools & technologies", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Methodologies", "items": ["Scrum", "Development team leadership", "Project management", "Software analysis & architecture"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Computer Science Engineer", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Spanish", "level": "Native" },
    { "name": "English", "level": "C1" },
    { "name": "French", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "About", "experience": "Experience", "projects": "Projects", "skills": "Skills", "education": "Education", "languages": "Languages", "contact": "Contact" },
    "downloadCta": "Download CV",
    "sectionTitles": { "about": "About", "experience": "Experience", "projects": "Featured projects", "skills": "Skills", "education": "Education", "languages": "Languages", "contact": "Contact" }
  }
}
```

- [ ] **Step 2: Catalan content**

Create `src/content/cv/ca.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, Espanya"
  },
  "about": "Amb més d'una dècada d'experiència en el sector tecnològic, em especialitzo en el desenvolupament de programari a mida que impulsa l'eficiència operativa. He liderat projectes d'implementació de sistemes de gestió (ERP, CRM), així com el desenvolupament de plataformes web, obtenint sempre resultats alineats amb els objectius del client. El meu enfocament autodidacta i el meu compromís amb la millora contínua m'han permès mantenir-me actualitzat en les últimes tendències tecnològiques. Durant més de 5 anys com a freelance a Cuba, vaig col·laborar amb empreses locals per digitalitzar processos clau en àrees com comptabilitat, inventaris, logística i recursos humans. Crec fermament en el treball en equip, la disciplina tècnica i el lliurament de valor real en cada projecte.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "Gener 2024 – Actualitat",
      "location": "Madrid, Espanya (híbrid)",
      "highlights": ["Desenvolupament de la plataforma de gestió d'espais i reserves de Flexibleplaces."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freelance)",
      "period": "Juny 2022 – Gener 2024",
      "location": "Remot",
      "highlights": ["Col·laboració remota com a desenvolupador independent abans d'incorporar-me a jornada completa."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Especialista B en Ciències Informàtiques",
      "period": "Setembre 2017 – Gener 2024",
      "location": "L'Havana, Cuba",
      "highlights": [
        "Desenvolupador de programari, Gestor de la Configuració i Cap del Comitè d'Arquitectura.",
        "Sistema de Control de Béns Patrimonials per a l'Oficina de l'Historiador de l'Havana.",
        "Llocs web per a Pesca Caribe, Registre Central Comercial de Cuba (RCC), UPTCER i ANTEX."
      ]
    },
    {
      "company": "GESICU (Grup Especialitzat en Serveis Informàtics)",
      "role": "CEO i Freelance Software Engineer",
      "period": "Febrer 2016 – Novembre 2022",
      "location": "Cuba",
      "highlights": [
        "Anàlisi, disseny, modelització i implementació de programari per a persones físiques i jurídiques a Cuba.",
        "Creador de Future Framework, plataforma web modular per al desenvolupament de solucions de gestió a mida, registrada al CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (jornada parcial)",
      "period": "Març 2020 – Juliol 2021",
      "location": "L'Havana, Cuba",
      "highlights": ["Desenvolupament de solucions per a la millora de processos de negoci."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "Agost 2012 – Agost 2016",
      "location": "Cuba",
      "highlights": [
        "Analista, arquitecte i desenvolupador de l'ERP DISTRA (gestió comptable-financera).",
        "Secretari del Comitè d'Arquitectura."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Plataforma web modular, multiusuari i multientitat per al desenvolupament de solucions de gestió a mida (estructura organitzativa, RRHH, facturació, producció, flota de vehicles).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Quadre de Comandament Integral per a l'Empresa de Fibrociment Perdurit: alinea l'estratègia de l'empresa amb informes consolidats i desglossats en temps real.", "url": "" },
    { "name": "Sistema de gestió Cooperativa TaxiRutero2", "description": "Gestió de la flota de vehicles, el capital humà, les expedicions i la facturació per a una cooperativa de transport a l'Havana.", "url": "" },
    { "name": "SERVELEC", "description": "Lloc web per a la cooperativa SERVELEC, especialitzada en reparació i manteniment de sistemes de pesatge i industrials.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Programari per al control de processos de transport, construït sobre Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Llenguatges i frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Dades", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Eines i tecnologies", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Metodologies", "items": ["Scrum", "Lideratge d'equips de desenvolupament", "Gestió de projectes", "Anàlisi i arquitectura de software"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Enginyer en Ciències Informàtiques", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Espanyol", "level": "Natiu" },
    { "name": "Anglès", "level": "C1" },
    { "name": "Francès", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "Sobre mi", "experience": "Experiència", "projects": "Projectes", "skills": "Habilitats", "education": "Educació", "languages": "Idiomes", "contact": "Contacte" },
    "downloadCta": "Descarregar CV",
    "sectionTitles": { "about": "Sobre mi", "experience": "Experiència", "projects": "Projectes destacats", "skills": "Habilitats", "education": "Educació", "languages": "Idiomes", "contact": "Contacte" }
  }
}
```

- [ ] **Step 3: Portuguese content**

Create `src/content/cv/pt.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, Espanha"
  },
  "about": "Com mais de uma década de experiência no setor tecnológico, especializo-me no desenvolvimento de software sob medida que impulsiona a eficiência operacional. Liderei projetos de implementação de sistemas de gestão (ERP, CRM), bem como o desenvolvimento de plataformas web, obtendo sempre resultados alinhados aos objetivos do cliente. Minha abordagem autodidata e meu compromisso com a melhoria contínua me permitiram manter-me atualizado com as últimas tendências tecnológicas. Durante mais de 5 anos como freelancer em Cuba, colaborei com empresas locais para digitalizar processos-chave em áreas como contabilidade, estoque, logística e recursos humanos. Acredito firmemente no trabalho em equipe, na disciplina técnica e na entrega de valor real em cada projeto.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "Janeiro 2024 – Atualidade",
      "location": "Madrid, Espanha (híbrido)",
      "highlights": ["Desenvolvimento da plataforma de gestão de espaços e reservas da Flexibleplaces."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freelance)",
      "period": "Junho 2022 – Janeiro 2024",
      "location": "Remoto",
      "highlights": ["Colaboração remota como desenvolvedor independente antes de ingressar em tempo integral."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Especialista B em Ciências Informáticas",
      "period": "Setembro 2017 – Janeiro 2024",
      "location": "Havana, Cuba",
      "highlights": [
        "Desenvolvedor de software, Gestor de Configuração e Chefe do Comitê de Arquitetura.",
        "Sistema de Controle de Bens Patrimoniais para o Escritório do Historiador de Havana.",
        "Sites para Pesca Caribe, Registro Central Comercial de Cuba (RCC), UPTCER e ANTEX."
      ]
    },
    {
      "company": "GESICU (Grupo Especializado em Serviços Informáticos)",
      "role": "CEO e Freelance Software Engineer",
      "period": "Fevereiro 2016 – Novembro 2022",
      "location": "Cuba",
      "highlights": [
        "Análise, design, modelagem e implementação de software para pessoas físicas e jurídicas em Cuba.",
        "Criador do Future Framework, plataforma web modular para soluções de gestão sob medida, registrada no CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (meio período)",
      "period": "Março 2020 – Julho 2021",
      "location": "Havana, Cuba",
      "highlights": ["Desenvolvimento de soluções para melhoria de processos de negócio."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "Agosto 2012 – Agosto 2016",
      "location": "Cuba",
      "highlights": [
        "Analista, arquiteto e desenvolvedor do ERP DISTRA (gestão contábil-financeira).",
        "Secretário do Comitê de Arquitetura."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Plataforma web modular, multiusuário e multientidade para o desenvolvimento de soluções de gestão sob medida (estrutura organizacional, RH, faturamento, produção, frota de veículos).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Balanced Scorecard para a Empresa de Fibrocimento Perdurit: alinha a estratégia da empresa com relatórios consolidados e detalhados em tempo real.", "url": "" },
    { "name": "Sistema de gestão Cooperativa TaxiRutero2", "description": "Gestão da frota de veículos, capital humano, expedições e faturamento para uma cooperativa de transporte em Havana.", "url": "" },
    { "name": "SERVELEC", "description": "Site para a cooperativa SERVELEC, especializada em reparo e manutenção de sistemas de pesagem e industriais.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Software para controle de processos de transporte, construído sobre o Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Linguagens e frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Dados", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Ferramentas e tecnologias", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Metodologias", "items": ["Scrum", "Liderança de equipes de desenvolvimento", "Gestão de projetos", "Análise e arquitetura de software"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Engenheiro em Ciências Informáticas", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Espanhol", "level": "Nativo" },
    { "name": "Inglês", "level": "C1" },
    { "name": "Francês", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "Sobre", "experience": "Experiência", "projects": "Projetos", "skills": "Habilidades", "education": "Educação", "languages": "Idiomas", "contact": "Contato" },
    "downloadCta": "Baixar CV",
    "sectionTitles": { "about": "Sobre", "experience": "Experiência", "projects": "Projetos em destaque", "skills": "Habilidades", "education": "Educação", "languages": "Idiomas", "contact": "Contato" }
  }
}
```

- [ ] **Step 4: French content**

Create `src/content/cv/fr.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, Espagne"
  },
  "about": "Avec plus d'une décennie d'expérience dans le secteur technologique, je me spécialise dans le développement de logiciels sur mesure qui améliorent l'efficacité opérationnelle. J'ai dirigé des projets de mise en œuvre de systèmes de gestion (ERP, CRM), ainsi que le développement de plateformes web, en obtenant toujours des résultats alignés sur les objectifs du client. Mon approche autodidacte et mon engagement envers l'amélioration continue m'ont permis de rester à jour sur les dernières tendances technologiques. Pendant plus de 5 ans en tant que freelance à Cuba, j'ai collaboré avec des entreprises locales pour numériser des processus clés dans des domaines tels que la comptabilité, les stocks, la logistique et les ressources humaines. Je crois fermement au travail d'équipe, à la discipline technique et à la livraison d'une valeur réelle à chaque projet.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "Janvier 2024 – Présent",
      "location": "Madrid, Espagne (hybride)",
      "highlights": ["Développement de la plateforme de gestion d'espaces et de réservations de Flexibleplaces."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freelance)",
      "period": "Juin 2022 – Janvier 2024",
      "location": "À distance",
      "highlights": ["Collaboration à distance en tant que développeur indépendant avant de rejoindre l'entreprise à temps plein."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Spécialiste B en Sciences Informatiques",
      "period": "Septembre 2017 – Janvier 2024",
      "location": "La Havane, Cuba",
      "highlights": [
        "Développeur logiciel, Gestionnaire de Configuration et Chef du Comité d'Architecture.",
        "Système de Contrôle des Biens Patrimoniaux pour le Bureau de l'Historien de La Havane.",
        "Sites web pour Pesca Caribe, le Registre Central du Commerce de Cuba (RCC), UPTCER et ANTEX."
      ]
    },
    {
      "company": "GESICU (Groupe Spécialisé en Services Informatiques)",
      "role": "CEO et Freelance Software Engineer",
      "period": "Février 2016 – Novembre 2022",
      "location": "Cuba",
      "highlights": [
        "Analyse, conception, modélisation et implémentation de logiciels pour particuliers et entreprises à Cuba.",
        "Créateur de Future Framework, plateforme web modulaire pour des solutions de gestion sur mesure, enregistrée au CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (temps partiel)",
      "period": "Mars 2020 – Juillet 2021",
      "location": "La Havane, Cuba",
      "highlights": ["Développement de solutions pour l'amélioration des processus métier."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "Août 2012 – Août 2016",
      "location": "Cuba",
      "highlights": [
        "Analyste, architecte et développeur de l'ERP DISTRA (gestion comptable et financière).",
        "Secrétaire du Comité d'Architecture."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Plateforme web modulaire, multi-utilisateur et multi-entité pour le développement de solutions de gestion sur mesure (structure organisationnelle, RH, facturation, production, flotte de véhicules).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Tableau de bord prospectif pour l'Empresa de Fibrocemento Perdurit : aligne la stratégie de l'entreprise avec des rapports consolidés et détaillés en temps réel.", "url": "" },
    { "name": "Système de gestion Cooperativa TaxiRutero2", "description": "Gestion de la flotte de véhicules, du capital humain, des expéditions et de la facturation pour une coopérative de transport à La Havane.", "url": "" },
    { "name": "SERVELEC", "description": "Site web pour la coopérative SERVELEC, spécialisée dans la réparation et l'entretien de systèmes de pesage et industriels.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Logiciel de contrôle des processus de transport, construit sur Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Langages et frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Données", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Outils et technologies", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Méthodologies", "items": ["Scrum", "Leadership d'équipes de développement", "Gestion de projets", "Analyse et architecture logicielle"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Ingénieur en Sciences Informatiques", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Espagnol", "level": "Langue maternelle" },
    { "name": "Anglais", "level": "C1" },
    { "name": "Français", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "À propos", "experience": "Expérience", "projects": "Projets", "skills": "Compétences", "education": "Formation", "languages": "Langues", "contact": "Contact" },
    "downloadCta": "Télécharger le CV",
    "sectionTitles": { "about": "À propos", "experience": "Expérience", "projects": "Projets phares", "skills": "Compétences", "education": "Formation", "languages": "Langues", "contact": "Contact" }
  }
}
```

- [ ] **Step 5: German content**

Create `src/content/cv/de.json`:

```json
{
  "hero": {
    "name": "Miguel Díaz Riveaux",
    "title": "Software Engineer",
    "location": "Madrid, Spanien"
  },
  "about": "Mit mehr als einem Jahrzehnt Erfahrung in der Technologiebranche habe ich mich auf die Entwicklung maßgeschneiderter Software spezialisiert, die die betriebliche Effizienz steigert. Ich habe Projekte zur Implementierung von Managementsystemen (ERP, CRM) sowie die Entwicklung von Webplattformen geleitet und dabei stets Ergebnisse erzielt, die den Zielen der Kunden entsprechen. Mein autodidaktischer Ansatz und mein Engagement für kontinuierliche Verbesserung haben es mir ermöglicht, stets über die neuesten Technologietrends informiert zu bleiben. Während mehr als 5 Jahren als Freelancer in Kuba habe ich mit lokalen Unternehmen zusammengearbeitet, um Schlüsselprozesse in Bereichen wie Buchhaltung, Lagerhaltung, Logistik und Personalwesen zu digitalisieren. Ich glaube fest an Teamarbeit, technische Disziplin und die Lieferung von echtem Mehrwert in jedem Projekt.",
  "experience": [
    {
      "company": "Flexibleplaces",
      "role": "Software Developer",
      "period": "Januar 2024 – Heute",
      "location": "Madrid, Spanien (hybrid)",
      "highlights": ["Entwicklung der Raumverwaltungs- und Buchungsplattform von Flexibleplaces."]
    },
    {
      "company": "Flexibleplaces",
      "role": "Software Developer (freiberuflich)",
      "period": "Juni 2022 – Januar 2024",
      "location": "Remote",
      "highlights": ["Remote-Zusammenarbeit als unabhängiger Entwickler, bevor ich in Vollzeit einstieg."]
    },
    {
      "company": "Desoft",
      "role": "Senior Software Developer — Spezialist B für Informatik",
      "period": "September 2017 – Januar 2024",
      "location": "Havanna, Kuba",
      "highlights": [
        "Softwareentwickler, Konfigurationsmanager und Leiter des Architekturausschusses.",
        "System zur Kontrolle von Vermögenswerten für das Büro des Historikers von Havanna.",
        "Websites für Pesca Caribe, das Zentrale Handelsregister von Kuba (RCC), UPTCER und ANTEX."
      ]
    },
    {
      "company": "GESICU (Spezialisierte IT-Dienstleistungsgruppe)",
      "role": "CEO und Freelance Software Engineer",
      "period": "Februar 2016 – November 2022",
      "location": "Kuba",
      "highlights": [
        "Analyse, Design, Modellierung und Implementierung von Software für Privatpersonen und Unternehmen in Kuba.",
        "Schöpfer von Future Framework, einer modularen Webplattform für maßgeschneiderte Managementlösungen, registriert beim CENDA."
      ]
    },
    {
      "company": "Nemexo",
      "role": "Software Developer (Teilzeit)",
      "period": "März 2020 – Juli 2021",
      "location": "Havanna, Kuba",
      "highlights": ["Entwicklung von Lösungen zur Verbesserung von Geschäftsprozessen."]
    },
    {
      "company": "XETID",
      "role": "Full Stack Developer",
      "period": "August 2012 – August 2016",
      "location": "Kuba",
      "highlights": [
        "Analyst, Architekt und Entwickler des ERP-Systems DISTRA (Finanz- und Rechnungswesen).",
        "Sekretär des Architekturausschusses."
      ]
    }
  ],
  "featuredProjects": [
    { "name": "Future Framework", "description": "Modulare, mandantenfähige Webplattform für die Entwicklung maßgeschneiderter Managementlösungen (Organisationsstruktur, Personalwesen, Rechnungsstellung, Produktion, Fuhrpark).", "url": "https://gesicu.wordpress.com" },
    { "name": "CMI Perdurit", "description": "Balanced Scorecard für die Empresa de Fibrocemento Perdurit: richtet die Unternehmensstrategie an konsolidierten Echtzeit-Berichten aus.", "url": "" },
    { "name": "Verwaltungssystem Cooperativa TaxiRutero2", "description": "Verwaltung von Fuhrpark, Personal, Versand und Abrechnung für eine Transportgenossenschaft in Havanna.", "url": "" },
    { "name": "SERVELEC", "description": "Website für die Genossenschaft SERVELEC, spezialisiert auf Reparatur und Wartung von Wäge- und Industriesystemen.", "url": "https://www.servelec.cu" },
    { "name": "FutureTrans", "description": "Software zur Steuerung von Transportprozessen, aufgebaut auf Future Framework.", "url": "" }
  ],
  "skills": {
    "categories": [
      { "name": "Sprachen und Frameworks", "items": ["Java & Spring", "C#", "PHP", "JavaScript/TypeScript", "HTML/CSS", "ASP.NET MVC", "Vue.js", "Angular"] },
      { "name": "Daten", "items": ["SQL", "PL/pgSQL & GIS"] },
      { "name": "Werkzeuge und Technologien", "items": ["Git", "AWS", "Firebase", "ExtJS", "jQuery", "WordPress", "Doctrine", "Symfony/Laravel", "Bootstrap/TailwindCSS"] },
      { "name": "Methoden", "items": ["Scrum", "Führung von Entwicklungsteams", "Projektmanagement", "Softwareanalyse und -architektur"] }
    ]
  },
  "education": [
    { "institution": "Universidad de las Ciencias Informáticas (UCI)", "degree": "Ingenieur für Informatik", "period": "2007 – 2012" }
  ],
  "languages": [
    { "name": "Spanisch", "level": "Muttersprache" },
    { "name": "Englisch", "level": "C1" },
    { "name": "Französisch", "level": "B1" }
  ],
  "contact": {
    "email": "mdriveaux2015@gmail.com",
    "linkedin": "https://www.linkedin.com/in/mdriveaux",
    "github": "https://github.com/mriveaux",
    "stackoverflow": "https://stackoverflow.com/users/11870089/miguel-díaz-riveaux"
  },
  "ui": {
    "nav": { "about": "Über mich", "experience": "Erfahrung", "projects": "Projekte", "skills": "Fähigkeiten", "education": "Ausbildung", "languages": "Sprachen", "contact": "Kontakt" },
    "downloadCta": "Lebenslauf herunterladen",
    "sectionTitles": { "about": "Über mich", "experience": "Erfahrung", "projects": "Ausgewählte Projekte", "skills": "Fähigkeiten", "education": "Ausbildung", "languages": "Sprachen", "contact": "Kontakt" }
  }
}
```

- [ ] **Step 6: Run the test suite to verify all 6 locales pass**

Run: `pnpm test`
Expected: PASS (3 tests, now checking 6 files).

- [ ] **Step 7: Commit**

```bash
git add src/content/cv
git commit -m "Add en, ca, pt, fr, de translations of CV content"
```

---

### Task 4: Locale routing utility

**Files:**
- Create: `src/i18n/langs.ts`
- Test: `tests/langs.test.ts`

**Interfaces:**
- Produces: `LANGS: readonly ['es','en','ca','pt','fr','de']`, `type Lang`, `DEFAULT_LANG: Lang = 'es'`, `getLocalizedPath(lang: Lang): string`. Used by `LanguageSwitcher.astro` (Task 6) and both page files (Task 8).

- [ ] **Step 1: Write the failing test**

Create `tests/langs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LANGS, DEFAULT_LANG, getLocalizedPath } from '../src/i18n/langs';

describe('getLocalizedPath', () => {
  it('returns root path for the default language', () => {
    expect(getLocalizedPath(DEFAULT_LANG)).toBe('/');
  });

  it('returns a prefixed path for non-default languages', () => {
    for (const lang of LANGS) {
      if (lang === DEFAULT_LANG) continue;
      expect(getLocalizedPath(lang)).toBe(`/${lang}/`);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot find module `../src/i18n/langs`.

- [ ] **Step 3: Implement the utility**

Create `src/i18n/langs.ts`:

```ts
export const LANGS = ['es', 'en', 'ca', 'pt', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

export function getLocalizedPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}/`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (5 tests total across both test files).

- [ ] **Step 5: Commit**

```bash
git add src/i18n tests/langs.test.ts
git commit -m "Add locale list and path helper"
```

---

### Task 5: Base layout + print stylesheet

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: none.
- Produces: `BaseLayout` component with props `{ lang: string; title: string }` and a default `<slot />`. Any element with class `no-print` is hidden when printing. Used by `CVPage.astro` (Task 7).

- [ ] **Step 1: Create the layout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  lang: string;
  title: string;
}

const { lang, title } = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
  </head>
  <body class="bg-white text-slate-900 antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Add print styles**

Edit `src/styles/global.css`, append:

```css

@media print {
  .no-print {
    display: none !important;
  }

  body {
    font-size: 11pt;
  }

  section {
    break-inside: avoid;
  }
}
```

- [ ] **Step 3: Replace the placeholder home page to use the layout**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout lang="es" title="Miguel Díaz Riveaux">
  <h1>Miguel Díaz Riveaux</h1>
</BaseLayout>
```

- [ ] **Step 4: Verify the build**

Run: `pnpm build && grep -q "Miguel Díaz Riveaux" dist/index.html && echo OK`
Expected: prints `OK`.

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/styles/global.css src/pages/index.astro
git commit -m "Add base layout and print stylesheet"
```

---

### Task 6: Header, language switcher, and download button

**Files:**
- Create: `src/components/LanguageSwitcher.astro`
- Create: `src/components/DownloadButton.astro`
- Create: `src/components/Header.astro`

**Interfaces:**
- Consumes: `LANGS`, `Lang`, `getLocalizedPath` (Task 4); `CvData` (Task 2).
- Produces: `Header` with props `{ lang: Lang; ui: CvData['ui']; name: string }`. Used by `CVPage.astro` (Task 7).

- [ ] **Step 1: Language switcher**

Create `src/components/LanguageSwitcher.astro`:

```astro
---
import { LANGS, getLocalizedPath, type Lang } from '../i18n/langs';

interface Props {
  current: Lang;
}

const { current } = Astro.props;
const labels: Record<Lang, string> = { es: 'ES', en: 'EN', ca: 'CA', pt: 'PT', fr: 'FR', de: 'DE' };
---
<nav aria-label="Language switcher" class="flex gap-2 text-sm">
  {LANGS.map((lang) => (
    <a
      href={getLocalizedPath(lang)}
      class={lang === current ? 'font-semibold underline' : 'text-slate-500 hover:text-slate-900'}
    >
      {labels[lang]}
    </a>
  ))}
</nav>
```

- [ ] **Step 2: Download button**

Create `src/components/DownloadButton.astro`:

```astro
---
interface Props {
  label: string;
}

const { label } = Astro.props;
---
<button
  type="button"
  class="no-print rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
  onclick="window.print()"
>
  {label}
</button>
```

- [ ] **Step 3: Header**

Create `src/components/Header.astro`:

```astro
---
import LanguageSwitcher from './LanguageSwitcher.astro';
import DownloadButton from './DownloadButton.astro';
import type { Lang } from '../i18n/langs';
import type { CvData } from '../content/cv.schema';

interface Props {
  lang: Lang;
  ui: CvData['ui'];
  name: string;
}

const { lang, ui, name } = Astro.props;
---
<header class="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
  <span class="font-semibold">{name}</span>
  <nav class="flex flex-wrap gap-4 text-sm text-slate-600">
    <a href="#about">{ui.nav.about}</a>
    <a href="#experience">{ui.nav.experience}</a>
    <a href="#projects">{ui.nav.projects}</a>
    <a href="#skills">{ui.nav.skills}</a>
    <a href="#education">{ui.nav.education}</a>
    <a href="#languages">{ui.nav.languages}</a>
    <a href="#contact">{ui.nav.contact}</a>
  </nav>
  <div class="flex items-center gap-4">
    <LanguageSwitcher current={lang} />
    <DownloadButton label={ui.downloadCta} />
  </div>
</header>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LanguageSwitcher.astro src/components/DownloadButton.astro src/components/Header.astro
git commit -m "Add header, language switcher, and download button"
```

---

### Task 7: Content sections + page assembly

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/About.astro`
- Create: `src/components/Experience.astro`
- Create: `src/components/Projects.astro`
- Create: `src/components/Skills.astro`
- Create: `src/components/Education.astro`
- Create: `src/components/Languages.astro`
- Create: `src/components/Contact.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/CVPage.astro`

**Interfaces:**
- Consumes: `CvData` (Task 2), `Header` (Task 6), `BaseLayout` (Task 5), `Lang` (Task 4).
- Produces: `CVPage` with prop `{ lang: Lang }` that renders a full CV page for that locale by reading `getEntry('cv', lang)`. Used by both page files (Task 8).

- [ ] **Step 1: Hero**

Create `src/components/Hero.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  hero: CvData['hero'];
}

const { hero } = Astro.props;
---
<section class="px-6 py-16 text-center">
  <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">{hero.name}</h1>
  <p class="mt-2 text-xl text-slate-600">{hero.title}</p>
  <p class="mt-1 text-sm text-slate-400">{hero.location}</p>
</section>
```

- [ ] **Step 2: About**

Create `src/components/About.astro`:

```astro
---
interface Props {
  title: string;
  about: string;
}

const { title, about } = Astro.props;
---
<section id="about" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-4 text-2xl font-semibold">{title}</h2>
  <p class="leading-relaxed text-slate-700">{about}</p>
</section>
```

- [ ] **Step 3: Experience**

Create `src/components/Experience.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  items: CvData['experience'];
}

const { title, items } = Astro.props;
---
<section id="experience" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-6 text-2xl font-semibold">{title}</h2>
  <ol class="space-y-8 border-l border-slate-200 pl-6">
    {items.map((job) => (
      <li>
        <p class="text-sm text-slate-400">{job.period} · {job.location}</p>
        <p class="font-semibold">{job.role} — {job.company}</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {job.highlights.map((highlight) => <li>{highlight}</li>)}
        </ul>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 4: Projects**

Create `src/components/Projects.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  items: CvData['featuredProjects'];
}

const { title, items } = Astro.props;
---
<section id="projects" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-6 text-2xl font-semibold">{title}</h2>
  <div class="grid gap-6 sm:grid-cols-2">
    {items.map((project) => (
      <article class="rounded-lg border border-slate-200 p-4">
        <h3 class="font-semibold">
          {project.url ? (
            <a href={project.url} class="hover:underline" target="_blank" rel="noopener">{project.name}</a>
          ) : (
            project.name
          )}
        </h3>
        <p class="mt-1 text-sm text-slate-700">{project.description}</p>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 5: Skills**

Create `src/components/Skills.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  skills: CvData['skills'];
}

const { title, skills } = Astro.props;
---
<section id="skills" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-6 text-2xl font-semibold">{title}</h2>
  <div class="grid gap-6 sm:grid-cols-2">
    {skills.categories.map((category) => (
      <div>
        <h3 class="mb-2 font-semibold text-slate-800">{category.name}</h3>
        <ul class="flex flex-wrap gap-2">
          {category.items.map((item) => (
            <li class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{item}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 6: Education**

Create `src/components/Education.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  items: CvData['education'];
}

const { title, items } = Astro.props;
---
<section id="education" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-4 text-2xl font-semibold">{title}</h2>
  {items.map((edu) => (
    <div class="mb-2">
      <p class="font-semibold">{edu.degree}</p>
      <p class="text-slate-600">{edu.institution} · {edu.period}</p>
    </div>
  ))}
</section>
```

- [ ] **Step 7: Languages**

Create `src/components/Languages.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  items: CvData['languages'];
}

const { title, items } = Astro.props;
---
<section id="languages" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-4 text-2xl font-semibold">{title}</h2>
  <ul class="flex flex-wrap gap-4">
    {items.map((language) => (
      <li class="text-slate-700"><span class="font-semibold">{language.name}:</span> {language.level}</li>
    ))}
  </ul>
</section>
```

- [ ] **Step 8: Contact**

Create `src/components/Contact.astro`:

```astro
---
import type { CvData } from '../content/cv.schema';

interface Props {
  title: string;
  contact: CvData['contact'];
}

const { title, contact } = Astro.props;
---
<section id="contact" class="mx-auto max-w-2xl px-6 py-10">
  <h2 class="mb-4 text-2xl font-semibold">{title}</h2>
  <ul class="flex flex-wrap gap-4 text-slate-700">
    <li><a class="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></li>
    <li><a class="hover:underline" href={contact.linkedin} target="_blank" rel="noopener">LinkedIn</a></li>
    <li><a class="hover:underline" href={contact.github} target="_blank" rel="noopener">GitHub</a></li>
    <li><a class="hover:underline" href={contact.stackoverflow} target="_blank" rel="noopener">Stack Overflow</a></li>
  </ul>
</section>
```

- [ ] **Step 9: Footer**

Create `src/components/Footer.astro`:

```astro
---
interface Props {
  name: string;
}

const { name } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="no-print border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
  © {year} {name}
</footer>
```

- [ ] **Step 10: Assemble the page**

Create `src/components/CVPage.astro`:

```astro
---
import { getEntry } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from './Header.astro';
import Hero from './Hero.astro';
import About from './About.astro';
import Experience from './Experience.astro';
import Projects from './Projects.astro';
import Skills from './Skills.astro';
import Education from './Education.astro';
import Languages from './Languages.astro';
import Contact from './Contact.astro';
import Footer from './Footer.astro';
import type { Lang } from '../i18n/langs';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const entry = await getEntry('cv', lang);
if (!entry) {
  throw new Error(`Missing CV content for locale "${lang}"`);
}
const cv = entry.data;
---
<BaseLayout lang={lang} title={`${cv.hero.name} — ${cv.hero.title}`}>
  <Header lang={lang} ui={cv.ui} name={cv.hero.name} />
  <Hero hero={cv.hero} />
  <About title={cv.ui.sectionTitles.about} about={cv.about} />
  <Experience title={cv.ui.sectionTitles.experience} items={cv.experience} />
  <Projects title={cv.ui.sectionTitles.projects} items={cv.featuredProjects} />
  <Skills title={cv.ui.sectionTitles.skills} skills={cv.skills} />
  <Education title={cv.ui.sectionTitles.education} items={cv.education} />
  <Languages title={cv.ui.sectionTitles.languages} items={cv.languages} />
  <Contact title={cv.ui.sectionTitles.contact} contact={cv.contact} />
  <Footer name={cv.hero.name} />
</BaseLayout>
```

- [ ] **Step 11: Wire the Spanish home page to the real content**

Replace `src/pages/index.astro`:

```astro
---
import CVPage from '../components/CVPage.astro';
---
<CVPage lang="es" />
```

- [ ] **Step 12: Verify the build**

Run: `pnpm build && grep -q "Flexibleplaces" dist/index.html && grep -q "Descargar CV" dist/index.html && echo OK`
Expected: prints `OK`.

- [ ] **Step 13: Commit**

```bash
git add src/components src/pages/index.astro
git commit -m "Add content section components and assemble the CV page"
```

---

### Task 8: Locale pages

**Files:**
- Create: `src/pages/[lang]/index.astro`

**Interfaces:**
- Consumes: `CVPage` (Task 7), `LANGS`, `DEFAULT_LANG` (Task 4).
- Produces: routes `/en/`, `/ca/`, `/pt/`, `/fr/`, `/de/` alongside the existing `/`.

- [ ] **Step 1: Create the dynamic locale route**

Create `src/pages/[lang]/index.astro`:

```astro
---
import CVPage from '../../components/CVPage.astro';
import { LANGS, DEFAULT_LANG, type Lang } from '../../i18n/langs';

export function getStaticPaths() {
  return LANGS.filter((lang) => lang !== DEFAULT_LANG).map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params as { lang: Lang };
---
<CVPage lang={lang} />
```

- [ ] **Step 2: Verify all 6 locales build**

Run:

```bash
pnpm build \
  && grep -q "Flexibleplaces" dist/index.html \
  && grep -q "Download CV" dist/en/index.html \
  && grep -q "Descarregar CV" dist/ca/index.html \
  && grep -q "Baixar CV" dist/pt/index.html \
  && grep -q "Télécharger le CV" dist/fr/index.html \
  && grep -q "Lebenslauf herunterladen" dist/de/index.html \
  && echo OK
```

Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/pages
git commit -m "Add localized routes for en, ca, pt, fr, de"
```

---

### Task 9: Dual deploy (Cloudflare Pages + GitHub Pages)

**Files:**
- Modify: `astro.config.mjs`
- Create: `.github/workflows/deploy-gh-pages.yml`

**Interfaces:**
- Consumes: the full site from Tasks 1–8.
- Produces: a build that emits root-relative asset paths (`/…`) by default for Cloudflare Pages, and `/cv-personal/…` paths when `DEPLOY_TARGET=gh-pages` is set (matching a GitHub Pages project served from `https://<user>.github.io/cv-personal/`). **If the actual GitHub repo is named differently, replace `cv-personal` in both files below with the real repo name.**

- [ ] **Step 1: Add the base-path toggle**

Replace `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  integrations: [tailwind()],
  base: isGhPages ? '/cv-personal' : '/',
});
```

- [ ] **Step 2: Verify the GitHub Pages build uses the prefixed base**

Run: `DEPLOY_TARGET=gh-pages pnpm build && grep -q '/cv-personal/_astro' dist/index.html && echo OK`
Expected: prints `OK`.

- [ ] **Step 3: Rebuild for the default (Cloudflare) base**

Run: `pnpm build && grep -qv '/cv-personal/_astro' dist/index.html; echo done`
Expected: prints `done` (local `dist/` is back to root-relative paths; Cloudflare Pages runs its own build from git on every push, so this only matters for local sanity-checking).

- [ ] **Step 4: Add the GitHub Actions workflow**

Create `.github/workflows/deploy-gh-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DEPLOY_TARGET: gh-pages
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs .github/workflows/deploy-gh-pages.yml
git commit -m "Add dual deploy: base-path toggle and GitHub Pages workflow"
```

**Manual steps (not automatable, require dashboard access):**
1. Push the repo to GitHub (`git remote add origin <url> && git push -u origin main`).
2. In the GitHub repo: **Settings → Pages → Source: GitHub Actions**. The workflow above will then deploy on every push to `main`.
3. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, select this repo, set build command `pnpm build`, output directory `dist`, and leave `DEPLOY_TARGET` unset (defaults to root `base: '/'`).

---

### Task 10: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS (all tests across `tests/content.test.ts` and `tests/langs.test.ts`).

- [ ] **Step 2: Run a clean production build**

Run: `rm -rf dist && pnpm build`
Expected: exits 0, `dist/index.html` and `dist/{en,ca,pt,fr,de}/index.html` all exist.

- [ ] **Step 3: Confirm no excluded PII leaked into the build output**

Run:

```bash
grep -rlE "89062145803|54152944|78356300|Buenavista" dist/ || echo "CLEAN"
```

Expected: prints `CLEAN` (no matches).

- [ ] **Step 4: Manual visual QA**

Run: `pnpm dev`, then in a browser:
1. Open `/`, `/en/`, `/ca/`, `/pt/`, `/fr/`, `/de/` — confirm each renders the header, all sections, and correct language labels.
2. Click each language link in the switcher and confirm it navigates to the right locale.
3. Click "Descargar CV" / "Download CV" / etc. and confirm the browser's print dialog opens with the header and button hidden in the preview.
4. Resize to a mobile width and confirm the layout stays readable (no horizontal scroll).

- [ ] **Step 5: Commit any fixes found during manual QA, then stop — deployment is the manual step from Task 9.**
