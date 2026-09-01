import { z } from 'zod';

const highlightPart = z.union([z.string(), z.object({ text: z.string(), url: z.string() })]);
const highlightEntry = z.union([z.string(), z.array(highlightPart)]);

const experienceEntry = z.object({
  company: z.string(),
  url: z.string().optional(),
  role: z.string(),
  period: z.string(),
  location: z.string(),
  highlights: z.array(highlightEntry),
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
  url: z.string().optional(),
  degree: z.string(),
  period: z.string(),
});

const languageEntry = z.object({
  name: z.string(),
  level: z.string(),
  code: z.enum(['es', 'en', 'ca', 'pt', 'fr', 'de']).optional(),
});

const certificationEntry = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string().optional(),
});

const patentEntry = z.object({
  title: z.string(),
  registry: z.string(),
  number: z.string(),
  date: z.string(),
  authors: z.array(z.string()),
});

const courseEntry = z.object({
  name: z.string(),
  provider: z.string(),
  year: z.string(),
});

const navLabels = z.object({
  about: z.string(),
  experience: z.string(),
  projects: z.string(),
  skills: z.string(),
  education: z.string(),
  certifications: z.string(),
  patents: z.string(),
  courses: z.string(),
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
  certifications: z.array(certificationEntry),
  patents: z.array(patentEntry),
  courses: z.array(courseEntry),
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
    toggleTheme: z.string(),
    githubActivity: z.string(),
  }),
});

export type CvData = z.infer<typeof cvSchema>;
