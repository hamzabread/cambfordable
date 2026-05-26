"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  text: string | (string | ReactNode)[];
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  trigger?: "view" | "mount";
  once?: boolean;
};

/**
 * Marimba-style word reveal. Each word sits in an overflow-hidden line and
 * slides up from y=100% on enter. Snappy by default.
 */
export default function MaskWords({
  text,
  className = "",
  wordClassName = "",
  delay = 0,
  stagger = 0.045,
  duration = 0.55,
  trigger = "view",
  once = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });
  const active = trigger === "mount" ? true : inView;

  const tokens: (string | ReactNode)[] = Array.isArray(text) ? text : text.split(" ");

  const word: Variants = {
    hidden: { y: "110%" },
    show: (i: number) => ({
      y: "0%",
      transition: {
        duration,
        delay: delay + i * stagger,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {tokens.map((token, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom pb-[0.05em] -mb-[0.05em]"
        >
          <motion.span
            custom={i}
            variants={word}
            initial="hidden"
            animate={active ? "show" : "hidden"}
            className={`inline-block ${wordClassName}`}
          >
            {typeof token === "string" ? (
              <>
                {token}
                {i < tokens.length - 1 && "\u00A0"}
              </>
            ) : (
              token
            )}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
