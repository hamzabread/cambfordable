import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  GraduationCap,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const highlights = [
  {
    title: "Personal Mentorship",
    description:
      "Direct communication with your teacher and weekly check-ins to keep your momentum strong.",
    icon: MessageCircle,
    tone: "from-[#ffe8c2] to-[#f6dba9]",
  },
  {
    title: "Exam-Proven Strategy",
    description:
      "Structured plans, paper-solving techniques, and targeted revision based on your weak areas.",
    icon: Brain,
    tone: "from-[#d9ecff] to-[#c4dff9]",
  },
  {
    title: "Real Academic Outcomes",
    description:
      "Students improve with personalized feedback loops on every quiz and homework submission.",
    icon: GraduationCap,
    tone: "from-[#d9f4e7] to-[#c7ead9]",
  },
];

export default function Impact() {
  return (
    <section className="relative overflow-hidden bg-[#0f1a2f] py-20 px-4 sm:px-6 lg:px-8 border-y border-[#1f2e4d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(104,154,232,0.25),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(38,205,164,0.2),transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#FBF9F6]/25 bg-[#FBF9F6]/8 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#FBF9F6]">
            <Sparkles className="h-4 w-4" />
            Why Students Stay With Cambfordable
          </p>

          <h2 className="mt-5 text-3xl sm:text-5xl font-bold leading-tight text-[#FBF9F6]">
            Better scores are just the result. Confidence is the real goal.
          </h2>

          <p className="mt-5 text-slate-300 text-base sm:text-lg leading-relaxed">
            We combine expert teaching, direct mentor access, and personalized
            review systems so students stop feeling lost and start feeling in
            control of their progress.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-white/12 bg-[#13213b] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.28)]"
              >
                <div
                  className={`inline-flex rounded-xl bg-linear-to-br ${item.tone} p-3 text-[#1E3557]`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#FBF9F6]">
                  {item.title}
                </h3>
                <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-[#101f37] p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-[#fbf2cf] font-semibold">
                <BadgeCheck className="h-4 w-4" />
                Trusted Academic Background
              </p>

              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <Image
                  src="/assets/Logos/kaustlogo.png"
                  alt="KAUST"
                  width={88}
                  height={28}
                  className="h-6 w-auto"
                />
                <Image
                  src="/assets/Logos/chalmerslogo.png"
                  alt="Chalmers"
                  width={102}
                  height={30}
                  className="h-6 w-auto"
                />
                <Image
                  src="/assets/Logos/cuilogo.png"
                  alt="COMSATS"
                  width={102}
                  height={30}
                  className="h-6 w-auto"
                />
              </div>

              <p className="mt-5 text-slate-300 leading-relaxed">
                Learn with a teacher who has taught across engineering and AI
                domains and knows how to turn complicated concepts into exam-ready
                clarity.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FBF9F6] p-5 sm:p-6 border border-[#e5ddd2]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1E3557]">
                Ready to Start?
              </p>
              <h3 className="mt-3 text-2xl font-bold leading-tight text-[#132848]">
                Join Cambfordable and make your next exam your strongest one.
              </h3>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E3557] px-5 py-3 text-[#FBF9F6] font-semibold hover:bg-[#162b49] transition"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-lg border border-[#1E3557]/25 px-5 py-3 text-[#1E3557] font-semibold hover:bg-[#f3efe9] transition"
                >
                  Explore Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
