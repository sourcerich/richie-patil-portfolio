import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        hero: z.object({
          role: z.string(),
          location: z.string(),
          status: z.string(),
          lead: z.string(),
          stack: z.array(z.string())
        }),
        intro: z.object({
          lead: z.string(),
          body: z.string(),
          quote: z.string(),
          beyond: z.string()
        }),
        stats: z.array(z.object({
          value: z.number(),
          decimals: z.number().default(0),
          prefix: z.string().default(''),
          suffix: z.string().default(''),
          caption: z.string(),
          accent: z.boolean().default(false)
        })),
        work: z.object({
          heading: z.string(),
          note: z.string(),
          span: z.string()
        }),
        services: z.object({
          heading: z.string(),
          body: z.string(),
          items: z.array(z.object({
            title: z.string(),
            body: z.string(),
            image: z.string()
          }))
        }),
        experience: z.object({
          note: z.string(),
          education: z.string(),
          items: z.array(z.object({
            org: z.string(),
            role: z.string(),
            when: z.string(),
            note: z.string()
          }))
        }),
        works: z.object({
          heading: z.string(),
          body: z.string()
        })
      })
    }),
    about: defineCollection({
      type: 'page',
      source: 'about.yml',
      schema: z.object({
        headline: z.array(z.string()),
        paragraphs: z.array(z.string()),
        skills: z.array(z.object({
          label: z.string(),
          value: z.string()
        })),
        achievements: z.array(z.object({
          title: z.string(),
          detail: z.string(),
          year: z.string()
        })),
        beyond: z.string(),
        faq: z.array(z.object({
          question: z.string(),
          answer: z.string()
        }))
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
        link: z.string().optional(),
        linkLabel: z.string().optional(),
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
