"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Navigation({
  activeSection,
  onSectionChange,
}: NavigationProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLElement | null)[]>([]);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "work", label: "Work" },
    { id: "about", label: "About" },
  ];

  useEffect(() => {
    animatePill();
  }, []);

  const animatePill = () => {
    const activeIndex = navItems.findIndex((item) => item.id === activeSection);
    const activeButton = buttonRefs.current[activeIndex];

    if (activeButton && pillRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const pillWidth = buttonRect.width;
      const pillLeft = buttonRect.left - containerRect.left;

      gsap.to(pillRef.current, {
        width: pillWidth,
        x: pillLeft,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId);

    // Reset hover states for all items when one is clicked
    buttonRefs.current.forEach((item) => {
      if (item) {
        const originalText = item.querySelector(
          ".original-text"
        ) as HTMLElement;
        const hoverText = item.querySelector(".hover-text") as HTMLElement;

        if (originalText && hoverText) {
          gsap.to(originalText, {
            filter: "blur(0px)",
            y: "-5%",
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(hoverText, {
            filter: "blur(4px)",
            transform: "translate(-50%, calc(-50% + 300%))",
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }
    });
  };

  useEffect(() => {
    animatePill();
  }, [activeSection]);

  const getItemStyles = (isActive: boolean) => {
    return {
      borderRadius: "100rem",
      fontWeight: "500" as const,
      padding: "0.9rem 1.5rem",
      fontSize: "1rem",
      lineHeight: "1.25rem",
      cursor: "pointer" as const,
      backgroundColor: "transparent",
      position: "relative" as const,
      zIndex: 2,
      whiteSpace: "nowrap" as const,
      color: isActive ? "#ffffff" : "#000000",
      overflow: "hidden",
    };
  };

  const navStyles = {
    position: "fixed" as const,
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
  };

  const containerStyles = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#e5e5e5",
    borderRadius: "100rem",
    padding: "0rem",
    position: "relative" as const,
  };

  const pillStyles = {
    position: "absolute" as const,
    top: "0rem",
    bottom: "0rem",
    left: "0rem",
    backgroundColor: "#000000",
    borderRadius: "100rem",
    zIndex: 1,
    pointerEvents: "none" as const,
  };

  return (
    <nav style={navStyles}>
      <div ref={containerRef} style={containerStyles}>
        {/* Animated pill background */}
        <div ref={pillRef} style={pillStyles} />

        {navItems.map((item, index) => {
          const isActive = activeSection === item.id;
          return (
            <div
              key={item.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => handleNavClick(item.id)}
              style={getItemStyles(isActive)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const originalText = e.currentTarget.querySelector(
                    ".original-text"
                  ) as HTMLElement;
                  const hoverText = e.currentTarget.querySelector(
                    ".hover-text"
                  ) as HTMLElement;

                  if (originalText && hoverText) {
                    gsap.to(originalText, {
                      filter: "blur(4px)",
                      y: "-200%",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                    gsap.fromTo(
                      hoverText,
                      {
                        filter: "blur(4px)",
                        transform: "translate(-50%, calc(-50% + 100%))",
                        opacity: 1,
                      },
                      {
                        filter: "blur(0px)",
                        transform: "translate(-50%, -50%)",
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out",
                      }
                    );
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const originalText = e.currentTarget.querySelector(
                    ".original-text"
                  ) as HTMLElement;
                  const hoverText = e.currentTarget.querySelector(
                    ".hover-text"
                  ) as HTMLElement;

                  if (originalText && hoverText) {
                    gsap.to(originalText, {
                      filter: "blur(0px)",
                      y: "-5%",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                    gsap.to(hoverText, {
                      filter: "blur(4px)",
                      transform: "translate(-50%, calc(-50% + 300%))",
                      opacity: 0,
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }
                }
              }}
            >
              <span
                className="original-text"
                style={{
                  display: "block",
                  filter: "blur(0px)",
                  transform: "translateY(-5%)",
                }}
              >
                {item.label}
              </span>
              <span
                className="hover-text"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, calc(-50% + 300%))",
                  filter: "blur(4px)",
                  whiteSpace: "nowrap",
                  opacity: "0",
                  pointerEvents: "none",
                  color: "#000000",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
