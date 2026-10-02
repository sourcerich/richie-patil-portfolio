import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// The YAML stays in /content at the repo root. One collection per page
// (each holds a single entry, id = file name) plus the projects. Each page's
// `ghost` is the faded Marathi word drawn behind its title.
const seo = z.object({ title: z.string(), description: z.string() })
const base = './content'

const index = defineCollection({
  loader: glob({ pattern: 'index.yml', base }),
  schema: z.object({
    seo,
    ticker: z.array(z.object({ lang: z.string(), text: z.string() })).min(1),
    role: z.string(),
    location: z.string(),
    lead: z.string(),
    now: z.object({ label: z.string(), value: z.string() }),
    contact: z.object({
      ghost: z.string(),
      title: z.string(),
      subtitle: z.string(),
      body: z.string()
    })
  })
})

const about = defineCollection({
  loader: glob({ pattern: 'about.yml', base }),
  schema: z.object({
    title: z.string(),
    seo,
    ghost: z.string(),
    headline: z.array(z.string()),
    subtitle: z.string(),
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

const service = defineCollection({
  loader: glob({ pattern: 'service.yml', base }),
  schema: z.object({
    title: z.string(),
    seo,
    ghost: z.string(),
    subtitle: z.string(),
    items: z.array(z.object({
      title: z.string(),
      ghost: z.string(),
      body: z.string(),
      image: z.string()
    }))
  })
})

const work = defineCollection({
  loader: glob({ pattern: 'work.yml', base }),
  schema: z.object({
    title: z.string(),
    seo,
    ghost: z.string(),
    subtitle: z.string()
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
    summary: z.string(),
    problem: z.string(),
    build: z.string(),
    outcome: z.string(),
    metric: z.string(),
    metricLabel: z.string()
  })
})

export const collections = { index, about, service, work, projects }
