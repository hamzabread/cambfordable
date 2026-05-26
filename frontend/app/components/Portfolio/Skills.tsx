"use client";

import { motion } from "framer-motion";
import { skills } from "../../../lib/data";
import { SectionLabel } from "./About";
import MaskWords from "../../../components/MaskWords";

// One vivid color per skill category
const catStyles = [
  { header: "text-violet-300", tag: "bg-violet-500/12 text-violet-300 border-violet-500/20", border: "border-violet-500/50" },
  { header: "text-cyan-300",   tag: "bg-cyan-500/12 text-cyan-300 border-cyan-500/20",       border: "border-cyan-400/50" },
  { header: "text-pink-300",   tag: "bg-pink-500/12 text-pink-300 border-pink-500/20",       border: "border-pink-500/50" },
  { header: "text-lime-300",   tag: "bg-lime-500/12 text-lime-300 border-lime-500/20",       border: "border-lime-400/50" },
  { header: "text-orange-300", tag: "bg-orange-500/12 text-orange-300 border-orange-500/20", border: "border-orange-400/50" },
];

const allSkills = Object.values(skills).flat();
const marqueeItems = [...allSkills, ...allSkills];

export default function Skills() {
  return (
    <section id="skills" className="relative py-20 md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionLabel index="04" title="Stack" color="text-lime-400" />

        <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl">
            <MaskWords
              text={[
                "Tools",
                "I",
                "reach",
                "for",
                <span key="g" className="gradient-text">on</span>,
                <span key="g2" className="gradient-text ml-3">a</span>,
                <span key="g3" className="gradient-text">Tuesday.</span>,
              ]}
              stagger={0.045}
              duration={0.55}
            />
          </h2>
          <p className="text-ink-mute max-w-xs text-sm">
            I lean toward backend, but I&apos;m comfortable end-to-end.
            Always reaching for the right tool.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(skills).map(([category, items], i) => {
            const c = catStyles[i % catStyles.length];
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`card rounded-2xl p-5 group border ${c.border}`}
              >
                <div className="mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={`font-semibold text-sm mt-0.5 ${c.header}`}>{category}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((s) => (
                    <span key={s} className={`rounded-full border px-2.5 py-0.5 text-xs font-mono transition-opacity duration-200 ${c.tag}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Colorful marquee */}
      <div className="relative mt-20 overflow-hidden marquee-mask py-5 border-y border-white/6"
        style={{ background: "linear-gradient(to right, rgba(139,92,246,0.06), rgba(6,182,212,0.06), rgba(236,72,153,0.06))" }}>
        <div className="flex gap-10 animate-scroll-x whitespace-nowrap">
          {marqueeItems.map((s, i) => (
            <span key={`${s}-${i}`}
              className="font-display text-3xl md:text-5xl text-white/18 hover:text-white/60 transition-colors duration-200 cursor-default">
              {s}
              <span className="mx-5 gradient-text text-2xl md:text-4xl">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
