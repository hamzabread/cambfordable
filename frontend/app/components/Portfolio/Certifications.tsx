"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { certifications, type Certification } from "../../../lib/data";
import { SectionLabel } from "./About";
import { useRef } from "react";
import Image from "next/image";
import MaskWords from "../../../components/MaskWords";

const accentColors = [
  {
    border: "border-violet-500/40 hover:border-violet-500/70",
    glow: "from-violet-600/15 to-transparent",
    text: "text-violet-300",
    dot: "bg-violet-400",
    spotlight: "rgba(139,92,246,0.05)",
  },
  {
    border: "border-cyan-500/40 hover:border-cyan-500/70",
    glow: "from-cyan-500/15 to-transparent",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
    spotlight: "rgba(6,182,212,0.05)",
  },
  {
    border: "border-pink-500/40 hover:border-pink-500/70",
    glow: "from-pink-500/15 to-transparent",
    text: "text-pink-300",
    dot: "bg-pink-400",
    spotlight: "rgba(236,72,153,0.05)",
  },
  {
    border: "border-lime-500/40 hover:border-lime-500/70",
    glow: "from-lime-500/15 to-transparent",
    text: "text-lime-300",
    dot: "bg-lime-400",
    spotlight: "rgba(132,204,22,0.05)",
  },
];

export default function Certifications() {
  return (
    <section id="certifications" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="04" title="Certifications" color="text-violet-400" />

      <div className="mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl">
          <MaskWords
            text={[
              "Validated",
              "skills,",
              <span key="g" className="gradient-text">proven</span>,
              <span key="g2" className="gradient-text ml-2.5">expertise.</span>,
            ]}
            stagger={0.05}
            duration={0.55}
          />
        </h2>
        <p className="text-ink-mute max-w-xs text-sm">
          Credentials, specializations, and professional development courses completed.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((c, i) => (
          <CertificationCard key={c.title} cert={c} index={i} />
        ))}
      </div>
    </section>
  );
}

function CertificationCard({ cert, index }: { cert: Certification; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 160, damping: 22, mass: 0.3 });
  const sy = useSpring(my, { stiffness: 160, damping: 22, mass: 0.3 });

  const a = accentColors[index % accentColors.length];

  const bg = useMotionTemplate`radial-gradient(circle at ${sx}% ${sy}%, ${a.spotlight.replace(")", ", 1)")}, transparent 50%)`;

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <motion.a
      ref={ref}
      href={cert.url}
      target="_blank"
      rel="noreferrer"
      onMouseMove={onMove}
      data-cursor="hover"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.38, delay: index * 0.06 }}
      className={`group relative isolate overflow-hidden rounded-3xl card border p-6 flex flex-col justify-between transition-colors duration-300 ${a.border}`}
    >
      {/* Mouse spotlight */}
      <motion.span aria-hidden style={{ background: bg }}
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Corner glow */}
      <div className={`absolute -top-24 -right-24 h-56 w-56 rounded-full border ${a.glow} blur-3xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none`} />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${a.dot}`} />
            <span className="font-mono text-[11px] uppercase tracking-[0.17em] text-ink-mute">
              {cert.issuer}
            </span>
          </div>
          <div className="flex items-center gap-1 text-ink-mute group-hover:text-ink transition-colors duration-200">
            <span className="font-mono text-[10px] hidden sm:inline">Verify</span>
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl leading-tight font-semibold mt-3 text-white group-hover:text-white/95 transition-colors">
          {cert.title}
        </h3>
      </div>

      {/* Certificate Image preview */}
      <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden mt-6 border border-white/10 bg-[#12101a]/50 shadow-inner group-hover:border-white/20 transition-colors duration-300">
        <Image
          src={cert.image}
          alt={cert.title}
          fill
          sizes="(max-width: 768px) 100vw, 30vw"
          className="object-cover object-top scale-[1.01] group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#09080f]/50 via-transparent to-transparent pointer-events-none" />
      </div>
    </motion.a>
  );
}
