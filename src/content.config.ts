import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

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
    skills: z.array(z.object({
      key: z.string(),
      title: z.string(),
      color: z.string(),
      body: z.string(),
      tools: z.array(z.string())
    })).min(1),
    contact: z.object({ title: z.string(), body: z.string() })
  })
})

const about = defineCollection({
  loader: glob({ pattern: 'about.yml', base }),
  schema: z.object({
    profile: z.string(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })),
    ps: z.string(),
    approach: z.object({
      title: z.string(),
      subtitle: z.string(),
      items: z.array(z.object({ title: z.string(), body: z.string() }))
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
    repo: z.string().optional(),
    confidential: z.boolean().optional(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
    tags: z.array(z.string()),
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
