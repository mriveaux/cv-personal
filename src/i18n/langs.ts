export const LANGS = ['es', 'en', 'ca', 'pt', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

export function getLocalizedPath(lang: Lang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}/`;
}
