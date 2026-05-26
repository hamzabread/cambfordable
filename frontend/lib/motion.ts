import type { Variants } from "framer-motion";

export const ease = [0.25, 0.1, 0.25, 1] as const;

export const fadeUp: Variants = {
	hidden: { opacity: 0, y: 14 },
	show: (i: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.42,
			delay: i * 0.055,
			ease: [0.25, 0.1, 0.25, 1],
		},
	}),
};

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] },
	},
};