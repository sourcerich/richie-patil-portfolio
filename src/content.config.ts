import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// The YAML stays in /content at the repo root: the page copy (index.yml),
// the longer About material (about.yml) and one file per project.
const seo = z.object({ title: z.string(), description: z.string() })
const base = './content'

const index = defineCollection({
  loader: glob({ pattern: 'index.yml', base }),
  schema: z.object({
    title: z.string(),
    seo,
    name: z.string(),
    nameMr: z.string(),
    role: z.string(),
    intro: z.string(),
    available: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    skills: z.array(z.object({
      key: z.string(),
      title: z.string(),
      color: z.string(),
      body: z.string()
    })).min(1),
    contact: z.object({ title: z.string(), body: z.string() })
  })
})

const about = defineCollection({
  loader: glob({ pattern: 'about.yml', base }),
  schema: z.object({
    profile: z.string(),
    stack: z.string(),
    recognition: z.array(z.string()),
    outside: z.string(),
    approach: z.object({
      title: z.string(),
      subtitle: z.string(),
      items: z.array(z.object({ title: z.string(), body: z.string() }))
    }),
    experience: z.object({
      title: z.string(),
      items: z.array(z.object({
        org: z.string(),
        role: z.string(),
        when: z.string(),
        note: z.string()
      }))
    })
  })
})

const projects = defineCollection({
  loader: glob({ pattern: 'projects/*.yml', base }),
  schema: z.object({
    slug: z.string().min(1),
    order: z.number(),
    title: z.string().min(1),
    type: z.string(),
    year: z.string(),
    image: z.string().optional(),
    imagePortrait: z.string().optional(),
    link: z.string().optional(),
    linkLabel: z.string().optional(),
    // Public source code, shown when there's no live link.
    repo: z.string().optional(),
    confidential: z.boolean().optional(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
    tags: z.array(z.string()),
    // Keys of the skills in index.yml this project used; the first sets its colour.
    skills: z.array(z.string()).min(1),
    summary: z.string(),
    problem: z.string(),
    build: z.string(),
    outcome: z.string(),
    metric: z.string(),
    metricLabel: z.string()
  })
})

export const collections = { index, about, projects }
