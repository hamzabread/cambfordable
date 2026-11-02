"use client";

import { ReactNode, useRef } from "react";
import {
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";

// One easing for the whole site: a confident, decelerating arrival.
export const EASE = [0.16, 1, 0.3, 1] as const;

type RevealVariant = "rise" | "fade" | "maskUp" | "maskLeft" | "window" | "pop";

const VARIANTS: Record<RevealVariant, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  // Uncovers from the bottom edge, like a page sliding up from behind a card.
  maskUp: {
    hidden: { clipPath: "inset(100% 0% 0% 0%)" },
    show: { clipPath: "inset(0% 0% 0% 0%)" },
  },
  maskLeft: {
    hidden: { clipPath: "inset(0% 100% 0% 0%)" },
    show: { clipPath: "inset(0% 0% 0% 0%)" },
  },
  // A framed window opening out to full size.
  window: {
    hidden: { clipPath: "inset(9% 7% 9% 7% round 28px)", scale: 1.05 },
    show: { clipPath: "inset(0% 0% 0% 0% round 16px)", scale: 1 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.6, rotate: -14 },
    show: { opacity: 1, scale: 1, rotate: 0 },
  },
};

const REDUCED: Variants = { hidden: { opacity: 0 }, show: { opacity: 1 } };

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
  ol: motion.ol,
  dl: motion.dl,
  span: motion.span,
  p: motion.p,
} as const;

type Tag = keyof typeof TAGS;

/** Reduced motion keeps meaning (fades) and drops travel, blur and masks. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: ReactNode;
  as?: Tag;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  /** How much of the element must be on screen before it plays. */
  amount?: number;
  className?: string;
}

/** Plays once when scrolled into view. `reveal` lets the no-script style keep it visible. */
export function Reveal({
  children,
  as = "div",
  variant = "rise",
  delay = 0,
  duration = 0.8,
  amount = 0.25,
  className = "",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = TAGS[as];
  const transition = { duration: reduced ? 0.3 : duration, delay, ease: EASE };

  // A fully clipped element counts as invisible to the browser's intersection
  // check, so masks watch an unclipped wrapper and clip an inner layer.
  if (!reduced && (variant === "maskUp" || variant === "maskLeft")) {
    return (
      <Component className={`reveal ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
        <motion.div className="reveal relative h-full w-full" variants={VARIANTS[variant]} transition={transition}>
          {children}
        </motion.div>
      </Component>
    );
  }

  return (
    <Component
      className={`reveal ${className}`}
      variants={reduced ? REDUCED : VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      transition={transition}
    >
      {children}
    </Component>
  );
}

interface StaggerProps {
  children: ReactNode;
  as?: Tag;
  className?: string;
  /** Gap between siblings; kept small so a long list never drags. */
  gap?: number;
  delay?: number;
  amount?: number;
}

/** A list that arrives as a list: children use StaggerItem. */
export function Stagger({ children, as = "div", className = "", gap = 0.07, delay = 0, amount = 0.2 }: StaggerProps) {
  const Component = TAGS[as];
  return (
    <Component
      className={`reveal ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  as = "div",
  className = "",
  variant = "rise",
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
  variant?: RevealVariant;
}) {
  const reduced = useReducedMotion();
  const Component = TAGS[as];
  return (
    <Component
      className={`reveal ${className}`}
      variants={reduced ? REDUCED : VARIANTS[variant]}
      transition={{ duration: reduced ? 0.3 : 0.7, ease: EASE }}
    >
      {children}
    </Component>
  );
}

interface MaskedHeadingProps {
  text: string;
  as?: "h1" | "h2";
  className?: string;
  /** Words to underline with a drawn pen stroke, e.g. "O and A-Levels". */
  underline?: string;
  underlineColor?: string;
  delay?: number;
  /** "mount" plays straight away (hero); "view" waits until scrolled to. */
  trigger?: "mount" | "view";
}

/**
 * Each word rises out of its own line mask; an optional hand-drawn stroke then
 * underlines a phrase, the way a student marks the key line in their notes.
 */
export function MaskedHeading({
  text,
  as = "h1",
  className = "",
  underline,
  underlineColor = "#f4cd87",
  delay = 0,
  trigger = "mount",
}: MaskedHeadingProps) {
  const reduced = useReducedMotion();
  const Heading = as === "h1" ? motion.h1 : motion.h2;
  const words = text.split(" ");
  const underlineWords = underline ? underline.split(" ") : [];
  const start = underline ? findPhrase(words, underlineWords) : -1;
  const end = start >= 0 ? start + underlineWords.length : -1;
  const wordGap = 0.08;
  const strokeDelay = delay + words.length * wordGap + 0.35;

  const word = (value: string, index: number) => (
    <span key={index} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
      <motion.span
        className="inline-block will-change-transform"
        variants={
          reduced
            ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
            : { hidden: { y: "108%", filter: "blur(8px)" }, show: { y: "0%", filter: "blur(0px)" } }
        }
        transition={{ duration: reduced ? 0.3 : 0.9, ease: EASE, delay: reduced ? 0 : delay + index * wordGap }}
      >
        {value}
      </motion.span>
    </span>
  );

  const parts: ReactNode[] = [];
  words.forEach((value, index) => {
    if (index === start) {
      parts.push(
        <span key="underlined" className="relative inline-block whitespace-nowrap">
          {words.slice(start, end).map((inner, offset) => (
            <span key={offset}>
              {word(inner, start + offset)}
              {offset < end - start - 1 ? " " : ""}
            </span>
          ))}
          <svg
            aria-hidden="true"
            viewBox="0 0 300 16"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-[0.18em] left-[-2%] h-[0.22em] w-[104%] overflow-visible"
          >
            <motion.path
              d="M3 11 C 55 4, 120 3, 175 6 S 268 10, 297 5"
              fill="none"
              stroke={underlineColor}
              strokeWidth="5"
              strokeLinecap="round"
              variants={{ hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1 } }}
              transition={{
                pathLength: { duration: reduced ? 0 : 0.75, ease: [0.65, 0, 0.35, 1], delay: reduced ? 0 : strokeDelay },
                opacity: { duration: 0.2, delay: reduced ? 0 : strokeDelay },
              }}
            />
          </svg>
        </span>,
      );
      parts.push(" ");
      return;
    }
    if (index > start && index < end) return;
    parts.push(word(value, index));
    if (index < words.length - 1) parts.push(" ");
  });

  const playProps =
    trigger === "mount"
      ? { initial: "hidden", animate: "show" }
      : { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.6 } };

  return (
    <Heading className={`reveal ${className}`} aria-label={text} {...playProps}>
      <span aria-hidden="true">{parts}</span>
    </Heading>
  );
}

function findPhrase(words: string[], phrase: string[]) {
  if (!phrase.length) return -1;
  for (let i = 0; i <= words.length - phrase.length; i++) {
    if (phrase.every((value, offset) => words[i + offset] === value)) return i;
  }
  return -1;
}

/**
 * A vertical rule that draws itself as the reader scrolls through a sequence
 * (a timeline, a set of steps). Children sit to the right of the rule.
 */
export function ScrollDrawnLine({
  children,
  className = "",
  lineClassName = "left-[19px]",
  color = "#1E3557",
}: {
  children: ReactNode;
  className?: string;
  lineClassName?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32, restDelta: 0.001 });
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div aria-hidden="true" className={`absolute top-2 bottom-2 w-px bg-slate-200 ${lineClassName}`} />
      <motion.div
        aria-hidden="true"
        className={`absolute top-2 bottom-2 w-[2px] -translate-x-[0.5px] origin-top rounded-full ${lineClassName}`}
        style={{ scaleY: reduced ? 1 : progress, backgroundColor: color }}
      />
      {children}
    </div>
  );
}
