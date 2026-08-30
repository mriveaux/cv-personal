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
