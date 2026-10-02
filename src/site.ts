// Site-wide settings shared by every page.
export const site = {
  name: 'Richie Patil',
  url: 'https://richiepatil.com',
  city: 'Mumbai, India',
  email: 'richiepatilwork@gmail.com',
  // Order matters: the menu numbers follow it. `mr` is the Marathi name the
  // page wipe shows under the English one.
  nav: [
    { label: 'Start', to: '/', mr: 'सुरुवात' },
    { label: 'About', to: '/about', mr: 'ओळख' },
    { label: 'Service', to: '/service', mr: 'सर्विस' },
    { label: 'Work', to: '/work', mr: 'काम' },
    { label: 'Contact', to: '/contact', mr: 'संपर्क' }
  ],
  socials: [
    { label: 'LinkedIn', to: 'https://www.linkedin.com/in/richiepatil/' },
    { label: 'GitHub', to: 'https://github.com/sourcerich' },
    { label: 'Discord', to: 'https://discord.com/users/384929346303033356' }
  ]
}

// "/about/" and "/about" are the same page.
export const cleanPath = (path: string) => path.replace(/\/+$/, '') || '/'

// The page-wipe names for a path: English plus Marathi.
export const wipeName = (path: string) => {
  const link = site.nav.find(item => item.to === cleanPath(path))
  return link ? { en: link.label, mr: link.mr } : { en: site.name, mr: '' }
}
