"use client";

import { motion } from "framer-motion";
import { profile } from "../../../lib/data";
import { SectionLabel } from "./About";
import MaskWords from "../../../components/MaskWords";
import Magnetic from "../../../components/Magnetic";

const channels = [
  {
    label: "Email", value: profile.email, href: `mailto:${profile.email}`,
    color: "border-violet-500/60 hover:border-violet-400/80",
    dot: "bg-violet-400", text: "text-violet-300",
  },
  {
    label: "GitHub", value: "github.com/hamzabread", href: profile.github,
    color: "border-cyan-500/60 hover:border-cyan-400/80",
    dot: "bg-cyan-400", text: "text-cyan-300",
  },
  {
    label: "LinkedIn", value: "linkedin.com/in/hamza-elahi", href: profile.linkedin,
    color: "border-pink-500/60 hover:border-pink-400/80",
    dot: "bg-pink-400", text: "text-pink-300",
  },
  {
    label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}`,
    color: "border-lime-500/60 hover:border-lime-400/80",
    dot: "bg-lime-400", text: "text-lime-300",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="06" title="Get in touch" color="text-yellow-400" />

      <div className="mt-10 relative overflow-hidden rounded-4xl border border-white/8 bg-bg-panel/60 p-8 md:p-14 lg:p-20">
        {/* Decorative grid */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        {/* Colorful blobs */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-linear-to-br from-violet-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-linear-to-tl from-pink-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative">
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.93] tracking-tight max-w-4xl">
            <MaskWords
              text={[
                "Let\u2019s",
                "build",
                "something",
                <span key="g" className="gradient-text">good.</span>,
              ]}
              stagger={0.06}
              duration={0.65}
            />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.38, delay: 0.07 }}
            className="mt-5 text-ink-mute text-base md:text-lg max-w-xl"
          >
            Open to client work, full-time roles, and interesting collaborations.
            I respond fast — coffee usually before keyboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.38, delay: 0.12 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Magnetic strength={0.28}>
              <a
                href={`mailto:${profile.email}`}
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-shadow duration-200"
                style={{ background: "linear-gradient(115deg,#8b5cf6,#ec4899)" }}
              >
                Email me
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a
                href={profile.linkedin} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full glass border border-white/12 px-6 py-3 text-sm font-medium text-white/75 hover:text-white hover:border-white/25 transition-all duration-200"
              >
                Reach me on LinkedIn
              </a>
            </Magnetic>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-3">
            {channels.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: 0.06 + i * 0.05 }}
                className={`group flex items-center justify-between gap-4 card rounded-2xl px-5 py-4 border transition-all duration-200 ${c.color}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${c.text}`}>{c.label}</span>
                  </div>
                  <div className="mt-1 text-ink/80 group-hover:text-ink transition-colors text-sm">{c.value}</div>
                </div>
                <svg
                  className="h-4 w-4 text-ink-mute transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-mono text-ink-dim border-t border-white/6 pt-8">
      <div>© {new Date().getFullYear()} Hamza Elahi · Built with Next.js, Three.js &amp; coffee.</div>
      <div className="flex items-center gap-4">
        <span>Islamabad · Pakistan</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <a href="#hero" className="hover:text-ink transition-colors">Back to top ↑</a>
      </div>
    </footer>
  );
}
