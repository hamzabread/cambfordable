"use client";

type Props = {
  text: string;
  variant?: "light" | "outline" | "filled";
  speed?: "slow" | "normal" | "fast";
  className?: string;
};

const speedClass = {
  slow: "animate-[scroll-x_44s_linear_infinite]",
  normal: "animate-[scroll-x_28s_linear_infinite]",
  fast: "animate-[scroll-x_18s_linear_infinite]",
};

/**
 * Marimba-style massive horizontal marquee. Doubles the content for a
 * seamless infinite loop. Use as a section divider.
 */
export default function Marquee({
  text,
  variant = "outline",
  speed = "normal",
  className = "",
}: Props) {
  const items = Array(2).fill(text);

  const textClass =
    variant === "filled"
      ? "gradient-text"
      : variant === "light"
        ? "text-white/80"
        : "text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]";

  return (
    <div className={`relative w-full overflow-hidden py-6 md:py-10 ${className}`}>
      <div className={`flex whitespace-nowrap ${speedClass[speed]}`}>
        {items.map((t, i) => (
          <span
            key={i}
            className={`shrink-0 font-display tracking-tight text-[10vw] md:text-[7vw] lg:text-[5.5rem] leading-none pr-12 ${textClass}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
