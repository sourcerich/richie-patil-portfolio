"use client";

export default function Work() {
  const projects = [
    {
      id: 1,
      title: "Botanical Dreams",
      category: "Photography",
      image:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&crop=entropy",
      size: "large", // takes up 2x2 grid space
    },
    {
      id: 2,
      title: "Sketch Studies",
      category: "Illustration",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=entropy",
      size: "medium",
    },
    {
      id: 3,
      title: "Color Theory",
      category: "Design",
      image:
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop&crop=entropy",
      size: "medium",
    },
    {
      id: 4,
      title: "Portrait Session",
      category: "Photography",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face",
      size: "tall",
    },
    {
      id: 5,
      title: "Minimal Design",
      category: "Design",
      image:
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=400&fit=crop&crop=entropy",
      size: "tall",
    },
    {
      id: 6,
      title: "Urban Stories",
      category: "Photography",
      image:
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=300&fit=crop&crop=entropy",
      size: "wide",
    },
    {
      id: 7,
      title: "Digital Art",
      category: "Illustration",
      image:
        "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&h=400&fit=crop&crop=entropy",
      size: "square",
    },
  ];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "large":
        return "col-span-2 row-span-2";
      case "wide":
        return "col-span-2 row-span-1";
      case "tall":
        return "col-span-1 row-span-2";
      case "square":
        return "col-span-1 row-span-1";
      default:
        return "col-span-1 row-span-1";
    }
  };

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
            Selected Work
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
            A curated collection of creative projects spanning photography,
            design, and digital art.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-6 grid-rows-8 gap-4 h-[1200px] md:h-[1000px]">
          {/* Large featured project - top left */}
          <div className="col-span-6 md:col-span-3 row-span-3 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[0].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-6">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-sm font-medium mb-1 uppercase tracking-wider">
                  {projects[0].category}
                </p>
                <h3 className="text-white text-xl md:text-2xl font-bold">
                  {projects[0].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Medium project - top right */}
          <div className="col-span-6 md:col-span-3 row-span-2 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[1].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[1].category}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {projects[1].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Small project - right side */}
          <div className="col-span-3 md:col-span-3 row-span-1 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[2].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[2].category}
                </p>
                <h3 className="text-white text-sm font-bold">
                  {projects[2].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Vertical project - left middle */}
          <div className="col-span-3 md:col-span-2 row-span-3 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[3].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[3].category}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {projects[3].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Square project - center */}
          <div className="col-span-3 md:col-span-2 row-span-2 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[4].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[4].category}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {projects[4].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Tall project - right side */}
          <div className="col-span-3 md:col-span-2 row-span-3 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[5].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[5].category}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {projects[5].title}
                </h3>
              </div>
            </div>
          </div>

          {/* Wide project - bottom */}
          <div className="col-span-6 md:col-span-4 row-span-2 group cursor-pointer overflow-hidden rounded-2xl relative bg-gray-100 hover:scale-[1.02] transition-all duration-500 ease-out">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${projects[6].image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 flex items-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <p className="text-white text-xs font-medium mb-1 uppercase tracking-wider">
                  {projects[6].category}
                </p>
                <h3 className="text-white text-lg font-bold">
                  {projects[6].title}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* View All Projects Button */}
        <div className="text-center mt-16">
          <button className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors duration-200">
            View All Projects
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
