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
