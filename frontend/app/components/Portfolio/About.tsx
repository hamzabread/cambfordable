"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { education, profile, stats, summary } from "../../../lib/data";
import MaskWords from "../../../components/MaskWords";

// Each stat gets its own color
const statAccents = [
  { num: "text-violet-300", bg: "border-violet-500/60" },
  { num: "text-cyan-300", bg: "border-cyan-500/60" },
  { num: "text-pink-300", bg: "border-pink-500/60" },
  { num: "text-lime-300", bg: "border-lime-500/60" },
];

export default function About() {
  return (
    <section id="about" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="01" title="About" color="text-violet-400" />

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="lg:col-span-5"
        >
          <div className="relative aspect-4/5 w-full max-w-md rounded-3xl overflow-hidden glow-ring">
            <Image
              src="/assets/me.jpeg" alt="Hamza Elahi" fill priority
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#09080f] via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">Currently</div>
                <div className="text-sm text-ink mt-0.5">{profile.location}</div>
              </div>
              <div className="font-mono text-xs text-ink-mute">{new Date().getFullYear()}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoCard label="Email" value={profile.email} />
            <InfoCard label="Phone" value={profile.phone} />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.42, delay: 0.07, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="lg:col-span-7"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            <MaskWords
              text={[
                "Backend",
                "craftsman",
                "with",
                "a",
                <span key="g" className="gradient-text">full-stack</span>,
                <span key="g2" className="gradient-text">reach.</span>,
              ]}
              stagger={0.05}
              duration={0.55}
            />
          </h2>
          <p className="mt-6 text-ink-mute leading-relaxed max-w-2xl">{summary}</p>
          <p className="mt-4 text-ink-mute leading-relaxed max-w-2xl">
            Off the keyboard I solve Rubik&apos;s cubes, push my chess rating, kick a
            football around, and lose weekends to a good RPG. Patterns,
            systems, the satisfaction of figuring things out, same instinct
            that pulls me toward backend work.
          </p>

          {/* Colorful stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`card rounded-2xl p-4 border ${statAccents[i].bg}`}
              >
                <div className={`font-display text-3xl md:text-4xl tracking-tight font-bold ${statAccents[i].num}`}>
                  {s.value}
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em] font-mono text-ink-mute leading-snug">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Education */}
          <div className="mt-5 card rounded-2xl p-5 border border-accent/50">
            <div className="text-[11px] uppercase tracking-[0.2em] font-mono text-accent-violet">Education</div>
            <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-ink font-medium">{education.school}</div>
                <div className="text-ink-mute text-sm">{education.degree}</div>
              </div>
              <div className="font-mono text-xs text-ink-mute whitespace-nowrap">{education.period}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-ink-dim">{label}</div>
      <div className="mt-1 text-ink text-sm font-mono truncate">{value}</div>
    </div>
  );
}

export function SectionLabel({
  index, title, color = "text-accent-violet",
}: {
  index: string; title: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className="flex items-center gap-3"
    >
      <span className={`font-mono text-xs font-bold ${color} tracking-[0.15em]`}>/ {index}</span>
      <span className="h-px w-8 bg-white/15" />
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink-mute">{title}</span>
    </motion.div>
  );
}
