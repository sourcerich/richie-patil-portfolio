export const useProjects = () =>
  useAsyncData('projects', () => queryCollection('projects').order('order', 'ASC').all(), {
    default: () => []
  })

export const projectNumber = (index: number) => String(index + 1).padStart(2, '0')
