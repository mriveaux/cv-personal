import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { cvSchema } from './content/cv.schema';

const cv = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cv' }),
  schema: cvSchema,
});

export const collections = { cv };
