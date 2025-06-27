"use client";

export default function Home() {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black leading-tight">
            Hello, I'm
            <br />
            <span className="text-gray-400">Developer</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            I create beautiful, functional, and user-centered digital
            experiences that make a difference. Let's build something amazing
            together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200">
              View My Work
            </button>
            <button className="border border-black text-black px-8 py-4 rounded-full font-medium hover:bg-black hover:text-white transition-colors duration-200">
              Download CV
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
