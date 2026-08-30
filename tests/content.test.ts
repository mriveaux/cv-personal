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
