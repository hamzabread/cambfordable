"use client";

import { motion } from "framer-motion";
import { experience } from "../../../lib/data";
import { SectionLabel } from "./About";
import MaskWords from "../../../components/MaskWords";

const jobColors = [
  { border: "border-violet-500/60", dot: "bg-violet-400", ring: "ring-violet-500/20", badge: "text-violet-300" },
  { border: "border-cyan-500/60",   dot: "bg-cyan-400",   ring: "ring-cyan-500/20",   badge: "text-cyan-300" },
];

export default function Experience() {
  return (
    <section id="experience" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="02" title="Experience" color="text-cyan-400" />

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42 }}
          className="lg:col-span-5 lg:sticky lg:top-32 self-start"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            <MaskWords
              text={[
                "Building",
                "products,",
                <span key="g" className="gradient-text">shipping</span>,
                <span key="g2" className="gradient-text">outcomes.</span>,
              ]}
              stagger={0.05}
              duration={0.55}
            />
          </h2>
          <p className="mt-5 text-ink-mute leading-relaxed max-w-md">
            From frontend architecture to client delivery — here&apos;s where I&apos;ve been
            spending my time professionally.
          </p>
        </motion.div>

        <div className="lg:col-span-7 relative">
          {/* Gradient timeline line */}
          <div className="absolute left-3 top-3 bottom-3 w-px"
            style={{ background: "linear-gradient(to bottom, #8b5cf6, #06b6d4, transparent)" }} />

          <ol className="space-y-7">
            {experience.map((job, i) => {
              const c = jobColors[i] ?? jobColors[0];
              return (
                <motion.li
                  key={`${job.company}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="relative pl-11"
                >
                  <span className="absolute left-0 top-3 grid h-7 w-7 place-items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot} ring-4 ${c.ring}`} />
                  </span>

                  <div className={`card rounded-2xl p-6 md:p-7 border ${c.border}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className={`text-xs font-mono uppercase tracking-[0.15em] font-semibold ${c.badge}`}>
                          {job.company}
                        </div>
                        <h3 className="font-display text-2xl md:text-3xl mt-1 text-ink">{job.role}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs text-ink-mute">{job.period}</div>
                        <div className="font-mono text-[10px] text-ink-dim uppercase tracking-[0.18em] mt-0.5">{job.location}</div>
                      </div>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      {job.highlights.map((h, idx) => (
                        <li key={idx} className="flex gap-3 text-ink-mute leading-relaxed text-sm">
                          <span className={`mt-2 h-1.5 w-1.5 rounded-full ${c.dot} shrink-0`} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
