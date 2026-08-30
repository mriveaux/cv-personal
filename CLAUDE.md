# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **pnpm** exclusively (not npm/yarn).

```bash
pnpm install         # install deps (Node 22+, pnpm 9+ required)
pnpm dev             # dev server at http://localhost:4321
pnpm build           # type-checks content and builds to dist/
pnpm preview         # preview the production build locally
pnpm test            # run the full Vitest suite (content schema + forbidden-string check)
pnpm run changelog   # regenerate CHANGELOG.md from commits since last tag
pnpm run deploy      # build + deploy to Cloudflare Workers (wrangler deploy)
pnpm run release:patch   # (also :minor, :major) bump version, update changelog, tag, push, deploy
```

To run a single test file: `pnpm exec vitest run tests/content.test.ts`.

`pnpm test` **must stay green before any content change is committed** — it validates every locale JSON against the Zod schema and enforces a blocklist of personal data strings.

## Architecture

Astro 7 static site, single-page CV/portfolio, localized into 6 languages (es, en, ca, pt, fr, de).

**Content-driven rendering**: each locale is one JSON file (`src/content/cv/{lang}.json`) validated against a single Zod schema (`src/content/cv.schema.ts`, loaded via `src/content.config.ts`). One Astro component per CV section reads the validated `CvData` object and renders it — routing only swaps which locale JSON is loaded, never the component tree. **Adding a new CV field requires touching three places**: the Zod schema, all 6 locale JSON files, and the rendering component.

**Routing**: `src/pages/index.astro` renders the default locale (`es`) at `/`. `src/pages/[lang]/index.astro` uses `getStaticPaths()` to statically generate the other 5 locales at `/{lang}/`. Both routes just call `<CVPage lang="..." />` — all real logic lives in `src/components/CVPage.astro`, which fetches the content entry via `getEntry('cv', lang)` and composes the section components (Header, Hero, About, Experience, Projects, Skills, Education, Certifications, Courses, Patents, Languages, Contact, Footer) inside `BaseLayout`.

Locale metadata (`LANGS`, `DEFAULT_LANG`, `getLocalizedPath`) lives in `src/i18n/langs.ts` — this is the single source of truth `LanguageSwitcher.astro` and the routing/SEO code use to build per-locale links.

**SEO / social sharing**: `src/site.ts` defines `SITE_URL` (canonical origin, hardcoded to the GitHub Pages URL regardless of which target actually built the page) and the OG image constants. `CVPage.astro` derives `description` (truncated `about` text), `canonicalUrl`, and `ogLocale` per locale and passes them into `BaseLayout.astro`, which renders `<meta>`/OG/Twitter tags. The canonical URL is intentionally independent of Astro's `base`/`site` config so it stays correct no matter which deploy target served the page.

**Theming**: Tailwind `class`-strategy dark mode. An inline script in `BaseLayout.astro` applies the `dark` class before first paint (avoids FOUC) by reading `localStorage`; `ThemeToggle.astro` toggles the class and persists the choice.

**Dual deployment, one build flag**: `astro.config.mjs` reads `DEPLOY_TARGET=gh-pages` to switch the `base` path to `/cv-personal` (GitHub Pages serves from a repo subpath); otherwise `base` is `/` (Cloudflare Workers, via `wrangler.jsonc` serving `dist/` as static assets). GitHub Pages deploys automatically on push to `main` (`.github/workflows/deploy-gh-pages.yml`); Cloudflare Workers deploys only via `pnpm run deploy`.

**Content data policy**: `tests/content.test.ts` hardcodes a `FORBIDDEN_STRINGS` blocklist (national ID, private phone numbers, home address fragments) that must never appear in any locale file — this is a hard privacy guard, not just a style check. Only email, LinkedIn, GitHub, and Stack Overflow are permitted as contact info in the schema.
