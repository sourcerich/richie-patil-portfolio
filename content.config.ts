import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// One collection per page, plus the projects. Each page's `ghost` is the
// faded Marathi word drawn behind its title.
const seo = z.object({ title: z.string(), description: z.string() })

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        seo,
        ticker: z.string(),
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
    }),
    about: defineCollection({
      type: 'page',
      source: 'about.yml',
      schema: z.object({
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
    }),
    service: defineCollection({
      type: 'page',
      source: 'service.yml',
      schema: z.object({
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
    }),
    work: defineCollection({
      type: 'page',
      source: 'work.yml',
      schema: z.object({
        seo,
        ghost: z.string(),
        subtitle: z.string()
      })
    }),
    projects: defineCollection({
      type: 'data',
      source: 'projects/*.yml',
      schema: z.object({
        slug: z.string().nonempty(),
        order: z.number(),
        title: z.string().nonempty(),
        type: z.string(),
        year: z.string(),
        image: z.string().optional(),
        imagePortrait: z.string().optional(),
        link: z.string().optional(),
        linkLabel: z.string().optional(),
        // Public source code, shown when there's no live link.
        repo: z.string().optional(),
        confidential: z.boolean().optional(),
        gallery: z.array(z.object({
          src: z.string(),
          alt: z.string()
        })).optional(),
        tags: z.array(z.string()),
        summary: z.string(),
        problem: z.string(),
        build: z.string(),
        outcome: z.string(),
        metric: z.string(),
        metricLabel: z.string()
      })
    })
  }
})
