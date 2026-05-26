"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { hobbies } from "../../../lib/data";
import { SectionLabel } from "./About";
import MaskWords from "../../../components/MaskWords";

// Each hobby card gets a unique tint
const hobbyColors = [
  { bg: "hover:border-violet-500/30", glow: "from-violet-600/18", icon: "text-violet-300" },
  { bg: "hover:border-cyan-500/30",   glow: "from-cyan-500/18",   icon: "text-cyan-300" },
  { bg: "hover:border-pink-500/30",   glow: "from-pink-500/18",   icon: "text-pink-300" },
  { bg: "hover:border-lime-500/30",   glow: "from-lime-500/18",   icon: "text-lime-300" },
  { bg: "hover:border-orange-500/30", glow: "from-orange-500/18", icon: "text-orange-300" },
  { bg: "hover:border-yellow-500/30", glow: "from-yellow-500/18", icon: "text-yellow-300" },
];

export default function Play() {
  return (
    <section id="play" className="relative py-20 md:py-28 container-px mx-auto max-w-7xl">
      <SectionLabel index="05" title="Off the keyboard" color="text-orange-400" />

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42 }}
          className="lg:col-span-5"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            <MaskWords
              text={[
                "Patterns,",
                <span key="g" className="gradient-text">everywhere.</span>,
              ]}
              stagger={0.06}
              duration={0.6}
            />
          </h2>
          <p className="mt-5 text-ink-mute leading-relaxed max-w-md">
            Chess openings, Rubik&apos;s algorithms, clever free-kicks — all the
            same chase. Break it down, find the pattern, put it back together
            better. Same instinct that pulls me toward backend systems.
          </p>

          <div className="mt-8 relative aspect-[4/5] w-full max-w-sm rounded-3xl overflow-hidden glow-ring">
            <Image
              src="/assets/alsome.jpeg" alt="Hamza" fill
              sizes="(max-width: 768px) 100vw, 30vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09080f]/80 via-transparent to-transparent" />
          </div>
        </motion.div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hobbies.map((h, i) => {
            const c = hobbyColors[i % hobbyColors.length];
            return (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`group card rounded-2xl p-6 overflow-hidden relative border border-white/10 transition-all duration-300 ${c.bg}`}
              >
                <div className={`absolute -bottom-6 -right-6 h-28 w-28 rounded-full border ${c.glow} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none`} />
                <div className="relative flex items-start justify-between">
                  <span className={`font-display text-3xl leading-none ${c.icon}`}>{h.icon}</span>
                  <span className="font-mono text-[10px] text-ink-dim uppercase tracking-[0.2em]">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="relative mt-4 font-display text-xl md:text-2xl text-ink">{h.title}</h3>
                <p className="relative mt-1.5 text-sm text-ink-mute leading-relaxed">{h.blurb}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
