"use client";

export default function About() {
  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Profile Image */}
          <div className="order-2 lg:order-1">
            <div className="w-full max-w-md mx-auto">
              <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center">
                <span className="text-gray-400 text-lg">Profile Photo</span>
              </div>
            </div>
          </div>

          {/* About Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-8">
              About Me
            </h2>
            <div className="space-y-6 text-gray-600">
              <p className="text-lg md:text-xl leading-relaxed">
                I'm a passionate web developer with a love for creating
                beautiful, functional, and user-centered digital experiences.
              </p>
              <p className="text-lg leading-relaxed">
                With expertise in modern web technologies, I enjoy turning
                complex problems into simple, elegant solutions. My approach
                combines technical skills with creative thinking to deliver
                exceptional results.
              </p>
              <p className="text-lg leading-relaxed">
                When I'm not coding, you can find me exploring new technologies,
                contributing to open-source projects, or enjoying a good cup of
                coffee while sketching new ideas.
              </p>
            </div>

            {/* Skills */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-black mb-6">
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  "JavaScript",
                  "TypeScript",
                  "React",
                  "Next.js",
                  "Vue.js",
                  "Node.js",
                  "Python",
                  "Django",
                  "PostgreSQL",
                  "MongoDB",
                  "Tailwind CSS",
                  "GSAP",
                  "Git",
                  "Docker",
                  "AWS",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-white text-black border border-gray-200 rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Button */}
            <div className="mt-12">
              <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200">
                Get In Touch
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
