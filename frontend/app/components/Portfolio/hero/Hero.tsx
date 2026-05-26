"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { profile } from "../../../../lib/data";
import { fadeUp } from "../../../../lib/motion";
import MaskWords from "../../../../components/MaskWords";
import Magnetic from "../../../../components/Magnetic";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="loader-bar w-40 rounded-full" />
    </div>
  ),
});

export default function Hero() {
  return (
    <section id="hero" className="relative w-full overflow-hidden py-20 md:py-24">
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#09080f]/15 to-[#09080f] pointer-events-none" />

      <div className="relative z-10 container-px mx-auto max-w-7xl pt-10 md:pt-16 pb-16 md:pb-24 flex flex-col justify-between">
        <div>
          {/* Status badge */}
          <motion.div
            initial="hidden" animate="show" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-mono text-white/55"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Software developer · Islamabad, PK
          </motion.div>

          {/* Name — mask reveal */}
          <h1 className="mt-6 font-display text-[15vw] sm:text-[12vw] md:text-[8.5vw] xl:text-[7.5rem] leading-[0.93] tracking-tight">
            <span className="block text-white/92">
              <MaskWords text="Hamza" trigger="mount" delay={0.1} stagger={0.06} duration={0.7} />
            </span>
            <span className="block">
              <MaskWords
                text={[<span key="e" className="gradient-text">Elahi.</span>]}
                trigger="mount"
                delay={0.22}
                duration={0.7}
              />
            </span>
          </h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp} custom={4} initial="hidden" animate="show"
            className="mt-7 max-w-lg text-base md:text-lg text-white/55 leading-relaxed"
          >
            I build{" "}
            <span className="text-white/85">scalable web, IoT and AI products</span>{" "}
            from the backend up. Currently at{" "}
            <span className="text-accent-violet font-medium">Quecko</span>,
            shipping client work in{" "}
            <span className="text-white/85">Next.js</span>,{" "}
            <span className="text-white/85">.NET</span> and{" "}
            <span className="text-white/85">FastAPI</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} custom={5} initial="hidden" animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic strength={0.28}>
              <a href="#projects"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-shadow duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/40"
                style={{ background: "#8ed4ff" }}
              >
                See my work
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a href={profile.github} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full glass border border-white/12 px-5 py-3 text-sm font-medium text-white/75 hover:text-white hover:border-white/25 transition-all duration-200"
              >
                <GitHubIcon className="h-4 w-4" /> GitHub
              </a>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a href={profile.linkedin} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full glass border border-white/12 px-5 py-3 text-sm font-medium text-white/75 hover:text-white hover:border-white/25 transition-all duration-200"
              >
                <LinkedInIcon className="h-4 w-4" /> LinkedIn
              </a>
            </Magnetic>
          </motion.div>
        </div>

        {/* Bottom meta */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-16 flex flex-col md:flex-row md:items-end md:justify-between gap-5"
        >
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-white/30">
            <div>Currently · Frontend @ Quecko</div>
            <div>Studying · CS / AI @ GIKI</div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-white/30">
            <span className="hidden md:inline">scroll</span>
            <span className="relative inline-flex h-8 w-5 rounded-full border border-white/20">
              <motion.span
                animate={{ y: [2, 14, 2] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1/2 top-1 -translate-x-1/2 h-1.5 w-1 rounded-full bg-accent-violet/80"
              />
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.18-.01-2.14-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.2 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.7a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4zM20 19h-3v-5.6c0-3.36-4-3.1-4 0V19h-3V8h3v1.6c1.4-2.59 7-2.78 7 2.48V19z" />
    </svg>
  );
}
