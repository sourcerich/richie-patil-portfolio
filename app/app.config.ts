export default defineAppConfig({
  site: {
    name: 'Richie Patil',
    url: 'https://richiepatil.com',
    city: 'Mumbai, India',
    email: 'richiepatilwork@gmail.com',
    // Order matters: the menu numbers follow it.
    nav: [
      { label: 'Start', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Service', to: '/service' },
      { label: 'Work', to: '/work' },
      { label: 'Contact', to: '/contact' }
    ],
    socials: [
      { label: 'LinkedIn', to: 'https://www.linkedin.com/in/richiepatil/' },
      { label: 'GitHub', to: 'https://github.com/sourcerich' },
      { label: 'Discord', to: 'https://discord.com/users/384929346303033356' }
    ]
  }
})
