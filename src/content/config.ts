import { defineCollection } from 'astro:content';
import { cvSchema } from './cv.schema';

const cv = defineCollection({
  type: 'data',
  schema: cvSchema,
});

export const collections = { cv };
