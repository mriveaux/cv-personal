import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  integrations: [tailwind()],
  base: isGhPages ? '/cv-personal' : '/',
});
