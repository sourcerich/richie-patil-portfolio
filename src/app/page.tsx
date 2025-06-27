"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import Home from "@/components/Home";
import Work from "@/components/Work";
import About from "@/components/About";

export default function Page() {
  const [activeSection, setActiveSection] = useState("home");

  const handleSectionChange = (newSection: string) => {
    setActiveSection(newSection);
  };

  const renderPage = () => {
    switch (activeSection) {
      case "home":
        return <Home />;
      case "work":
        return <Work />;
      case "about":
        return <About />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {renderPage()}
      <Navigation
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
    </div>
  );
}
