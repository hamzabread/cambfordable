"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { projects, type Project } from "../../../lib/data";
import { SectionLabel } from "./About";
import { useRef } from "react";
import MaskWords from "../../../components/MaskWords";

const accentMap = {
  violet: {
    border: "border-violet-500/70",
    glow: "from-violet-600/22 to-transparent",
    text: "text-violet-300",
    dot: "bg-violet-400",
    tag: "bg-violet-500/14 text-violet-300 border border-violet-500/22",
    spotlight: "rgba(139,92,246,0.07)",
  },
  cyan: {
    border: "border-cyan-400/70",
    glow: "from-cyan-500/22 to-transparent",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
    tag: "bg-cyan-500/14 text-cyan-300 border border-cyan-500/22",
    spotlight: "rgba(6,182,212,0.07)",
  },
  pink: {
    border: "border-pink-500/70",
    glow: "from-pink-500/22 to-transparent",
    text: "text-pink-300",
    dot: "bg-pink-400",
    tag: "bg-pink-500/14 text-pink-300 border border-pink-500/22",
    spotlight: "rgba(236,72,153,0.07)",
  },
  lime: {
    border: "border-lime-400/70",
    glow: "from-lime-500/22 to-transparent",
    text: "text-lime-300",
    dot: "bg-lime-400",
    tag: "bg-lime-500/14 text-lime-300 border border-lime-500/22",
    spotlight: "rgba(132,204,22,0.07)",
  },
} as const;

export default function Projects() {
  return (
    <section id="projects" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="03" title="Selected work" color="text-pink-400" />

      <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl">
          <MaskWords
            text={[
              "Real",
              "products,",
              <span key="g" className="gradient-text">real</span>,
              <span key="g2" className="gradient-text ml-2.5">users.</span>,
            ]}
            stagger={0.05}
            duration={0.55}
          />
        </h2>
        <p className="text-ink-mute max-w-xs text-sm">
          Most were shipped for clients. The last one is my personal
          R&amp;D playground for backend systems.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {projects.map((p, i) => <ProjectCard key={p.title} project={p} index={i} />)}
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 160, damping: 22, mass: 0.3 });
  const sy = useSpring(my, { stiffness: 160, damping: 22, mass: 0.3 });

  const a = accentMap[project.accent];
  const isFeatured = index === 0;

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
      href={project.links[0]?.href ?? "#"}
      target="_blank" rel="noreferrer"
      onMouseMove={onMove}
      data-cursor="hover"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.38, delay: index * 0.06 }}
      className={`group relative isolate overflow-hidden rounded-3xl card border p-7 md:p-8 ${a.border} ${isFeatured ? "md:col-span-2" : ""}`}
    >
      {/* Mouse spotlight */}
      <motion.span aria-hidden style={{ background: bg }}
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Corner glow */}
      <div className={`absolute -top-24 -right-24 h-64 w-64 rounded-full border ${a.glow} blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${a.dot}`} />
          <span className="font-mono text-[11px] uppercase tracking-[0.17em] text-ink-mute">
            {project.client ? "Client work" : "Personal R&D"} · {project.year}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-mute group-hover:text-ink transition-colors duration-200">
          <span className="font-mono text-xs hidden md:inline">{project.links[0]?.label ?? "Open"}</span>
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h3 className={`relative mt-5 font-display text-ink tracking-tight leading-tight ${isFeatured ? "text-5xl md:text-6xl lg:text-7xl" : "text-3xl md:text-4xl"
        }`}>{project.title}</h3>
      <div className={`relative mt-1.5 font-medium text-sm md:text-base ${a.text}`}>{project.subtitle}</div>

      <p className={`relative mt-4 text-ink-mute leading-relaxed text-sm ${isFeatured ? "max-w-2xl" : ""}`}>
        {project.description}
      </p>

      <ul className="relative mt-4 space-y-2">
        {project.highlights.slice(0, isFeatured ? 3 : 2).map((h, i) => (
          <li key={i} className="flex gap-3 text-sm text-ink/75 leading-relaxed">
            <span className={`mt-2 h-1 w-1 rounded-full ${a.dot} shrink-0`} />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      {/* Stack chips */}
      <div className="relative mt-5 flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <span key={s} className={`rounded-full px-3 py-0.5 text-[11px] font-mono ${a.tag}`}>{s}</span>
        ))}
      </div>

      {project.links.length > 1 && (
        <div className="relative mt-5 flex items-center gap-5 text-xs font-mono">
          {project.links.map((l) => (
            <span key={l.href} className={`inline-flex items-center gap-1.5 text-ink-mute group-hover:${a.text} transition-colors`}>
              <span className={`h-1 w-1 rounded-full ${a.dot}`} />{l.label}
            </span>
          ))}
        </div>
      )}
    </motion.a>
  );
}
