export default defineAppConfig({
  global: {
    picture: "/richie.jpg",
    meetingLink: "https://cal.com/richie-patil",
    email: "richiepatilwork@gmail.com",
    available: true,
  },
  ui: {
    colors: {
      primary: "blue",
      neutral: "neutral",
    },
    pageHero: {
      slots: {
        container: "py-18 sm:py-24 lg:py-32",
        title: "mx-auto max-w-xl text-pretty text-3xl sm:text-4xl lg:text-5xl",
        description:
          "mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted",
      },
    },
  },
  footer: {
    credits: `Deployed on Github Pages • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [
      {
        icon: "i-simple-icons-discord",
        to: "https://discord.com/users/384929346303033356",
        target: "_blank",
        "aria-label": "Nuxt on Discord",
      },
      {
        icon: "i-simple-icons-linkedin",
        to: "https://www.linkedin.com/in/richiepatil/",
        target: "_blank",
        "aria-label": "Nuxt on X",
      },
      {
        icon: "i-simple-icons-github",
        to: "https://github.com/sourcerich",
        target: "_blank",
        "aria-label": "Richie Patil on GitHub",
      },
    ],
  },
});
