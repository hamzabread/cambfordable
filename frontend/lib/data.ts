export const profile = {
	name: "Hamza Elahi",
	role: "Software Developer",
	tagline: "Backend-leaning full-stack engineer building scalable web, IoT and AI products.",
	location: "Islamabad, Pakistan",
	email: "hamzaval2000@gmail.com",
	phone: "+92 321 5554608",
	github: "https://github.com/hamzabread",
	linkedin: "https://www.linkedin.com/in/hamza-elahi",
	resumeUrl: "/Hamza-Elahi-Resume.pdf",
};

export const summary = `Software Developer and Computer Science student at GIKI specializing in Artificial Intelligence. I focus on shipping scalable web and IoT solutions in Agile teams — system architecture, backend services, and data-driven engineering workflows are where I do my best work.`;

export type Experience = {
	company: string;
	role: string;
	period: string;
	location: string;
	highlights: string[];
};

export const experience: Experience[] = [
	{
		company: "Quecko",
		role: "Frontend Developer (Part-time)",
		period: "Aug 2025 — Present",
		location: "Islamabad, Pakistan",
		highlights: [
			"Spearheaded frontend architecture in an Agile cycle, achieving a 30% performance lift via code-splitting.",
			"Cut technical debt by 15% by refactoring legacy logic and coordinating a 5-person cross-functional team across weekly sprints.",
			"Delivered 5+ production projects on Upwork with a 100% client satisfaction rating.",
		],
	},
	{
		company: "Quecko",
		role: "Frontend Developer Intern",
		period: "May 2025 — Aug 2025",
		location: "Islamabad, Pakistan",
		highlights: [
			"Resolved 40+ high-priority tickets using systematic troubleshooting during rapid release cycles.",
			"Maintained a 100% on-time delivery rate for high-traffic platform features under strict deployment windows.",
		],
	},
];

export type Project = {
	title: string;
	subtitle: string;
	client: boolean;
	stack: string[];
	description: string;
	highlights: string[];
	links: { label: string; href: string }[];
	accent: "violet" | "cyan" | "pink" | "lime";
	year: string;
};

export const projects: Project[] = [
	{
		title: "Cambfordable",
		subtitle: "Live EdTech learning platform",
		client: true,
		year: "2025",
		stack: ["Next.js", "FastAPI", "PostgreSQL", "Zoom SDK", "JWT"],
		description:
			"A live-streaming classroom that handles 50+ concurrent students with anti-cheating signals and structured homework workflows.",
		highlights: [
			"Built live-streaming for 50+ concurrent participants via Zoom SDK with zero session drops.",
			"Designed core features for real learning: secure quiz workflows with anti-cheating signals and homework management.",
			"Resolved complex API integration bottlenecks across the video layer.",
		],
		links: [
			{ label: "Live", href: "https://cambfordable.com" },
			{ label: "Code", href: "https://github.com/hamzabread/cambfordable" },
		],
		accent: "pink",
	},
	{
		title: "Smart Attendance System",
		subtitle: "AI-powered computer vision attendance",
		client: true,
		year: "2025",
		stack: ["FastAPI", "React Native", "Face Recognition AI", "Docker", "PostgreSQL"],
		description:
			"A computer-vision pipeline that automates record-keeping for 200+ students with high accuracy and zero manual logs.",
		highlights: [
			"Constructed a CV pipeline reaching 92% identity-detection accuracy across 200+ students.",
			"Reduced manual entry time by 80% with a centralized PostgreSQL backend and automated reports.",
			"Containerized with Docker for consistent, reliable deployments across environments.",
		],
		links: [
			{ label: "Code", href: "https://github.com/hamzabread/smart-attendance" },
		],
		accent: "cyan",
	},
	{
        title: "Peky",
		subtitle: "A Healthier Choice — Full-stack e-commerce platform",
		client: true,
		year: "2025",
		stack: ["Next.js", "AWS Cognito", "Tailwind", "Railway", "PostgreSQL"],
		description:
			"End-to-end e-commerce platform with secure auth, atomic real-time inventory and SSR-driven conversion.",
		highlights: [
			"Engineered a full-stack auth system with AWS Cognito (+20% secure registration throughput).",
			"Optimized user conversion by 12% through Server-Side Rendering and atomic real-time inventory sync.",
		],
		links: [
			{ label: "Frontend", href: "https://github.com/hamzabread/Peky" },
			{ label: "Backend", href: "https://github.com/AmmarRiaz123/myapp-backend" },
		],
		accent: "violet",
		
	},
	{
		title: "Audio-Visual Manipulation Detection System",
		subtitle: "FastAPI, LangGraph, React, PyTorch, MTCNN",
		client: false,
		year: "2026",
		stack: ["FastAPI", "LangGraph", "React", "PyTorch", "MTCNN"],
		description:
			"A multimodal forensic system for detecting manipulated audio-visual content with automated reporting and cross-modal consistency checks.",
		highlights: [
			"Engineered a FastAPI/React multimodal framework achieving 66.7% accuracy and 0.72 ROC-AUC in cross-modal detection.",
			"Architected a LangGraph orchestration system using LLM tool-calling to automate context-aware forensic reporting.",
		],
		links: [
			{ label: "Code", href: "https://github.com/abdul1ah/Self-Supervised-Audio-Visual-Consistency-and-Manipulation-Detection-System" },
		],
		accent: "lime",
	},
];

export const skills = {
	Languages: ["C#", "JavaScript / TS", "Python", "C++", "SQL"],
	Frameworks: ["Next.js", "React", "Node / Express", ".NET Core", "ASP.NET Web API", "FastAPI", "Flask"],
	Data: ["PostgreSQL", "EF Core", "ORM design", "Data persistence"],
	Infra: ["Docker", "AWS", "Railway", "MQTT", "Microservices"],
	Practices: ["Agile", "System architecture", "Troubleshooting", "Technical leadership"],
};

export const hobbies = [
	{
		title: "Chess",
		blurb: "Tactical puzzles over morning coffee. Always chasing a better Elo.",
		icon: "♞",
	},
	{
		title: "Rubik's cubes",
		blurb: "Solving cubes is just compiling algorithms with my hands.",
		icon: "▦",
	},
	{
		title: "Football",
		blurb: "On the pitch when I'm not at a keyboard.",
		icon: "⚽",
	},
	{
		title: "Video games",
		blurb: "Story-driven RPGs and the occasional competitive run.",
		icon: "🎮",
	},
	{
		title: "Backend craft",
		blurb: "I genuinely love designing APIs, schemas and microservices.",
		icon: "{ }",
	},
	{
		title: "Coding",
		blurb: "Side projects, late nights, and the joy of a clean diff.",
		icon: "</>",
	},
];

export const education = {
	school: "Ghulam Ishaq Khan Institute (GIKI)",
	degree: "BS in Computer Science — Specialization in Artificial Intelligence",
	period: "Sep 2023 — May 2027",
	location: "Swabi, Pakistan",
};

export const stats = [
	{ value: "5+", label: "Production projects shipped" },
	{ value: "100%", label: "Client satisfaction on Upwork" },
	{ value: "92%", label: "CV detection accuracy (Smart Attendance)" },
	{ value: "30%", label: "Frontend perf gain at Quecko" },
];