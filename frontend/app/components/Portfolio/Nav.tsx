"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Work" },
  { id: "skills", label: "Stack" },
  { id: "play", label: "Play" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("about");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = "about";
      for (const l of links) {
        const el = document.getElementById(l.id);
        if (el && el.getBoundingClientRect().top <= 130) current = l.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
      >
        <div
          className={`container-px mx-auto flex items-center justify-between transition-all duration-300 ${
            scrolled
              ? "max-w-5xl rounded-full glass border border-white/10 px-4 md:px-6 py-2"
              : "max-w-7xl"
          }`}
        >
          {/* Logo */}
          <a href="#hero" className="group flex items-center gap-2 text-sm font-mono">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg font-display text-sm font-bold text-white shadow-lg"
              style={{ background: "#8ed4ff" }}>
              H
            </span>
            <span className="hidden sm:inline text-white/60 group-hover:text-white/90 transition">
              hamza<span className="gradient-text font-bold">.</span>elahi
            </span>
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-0.5 text-sm">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`}
                className={`relative px-3 py-1.5 rounded-full transition-colors duration-200 ${
                  active === l.id ? "text-white" : "text-white/55 hover:text-white/85"
                }`}
              >
                {active === l.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/8 border border-white/12"
                    transition={{ type: "spring", stiffness: 440, damping: 38 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </a>
            ))}
          </nav>

          {/* Available badge */}
          <a href="#contact"
            className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-80"
            style={{ background: "#8ed4ff" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
            Available
          </a>

          {/* Mobile burger */}
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full glass"
          >
            <span className="relative h-3 w-4">
              {[0, "top-1.5", "bottom-0"].map((pos, i) => (
                <span key={i} className={`absolute inset-x-0 h-px bg-white transition-all ${
                  i === 0 ? `top-0 ${open ? "translate-y-1.5 rotate-45" : ""}` :
                  i === 1 ? `top-1.5 ${open ? "opacity-0" : ""}` :
                  `bottom-0 ${open ? "-translate-y-1.5 -rotate-45" : ""}`
                }`} />
              ))}
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="fixed top-20 left-4 right-4 z-50 md:hidden rounded-2xl p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
          >
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}
                className="block px-3 py-3 text-base text-white/70 hover:text-white border-b border-white/6 last:border-0 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
