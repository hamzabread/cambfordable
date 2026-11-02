import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Medal, Sparkles } from "lucide-react";
import { MaskedHeading, Reveal, Stagger, StaggerItem } from "../../Motion/Motion";

const tags = [
  "Senior Member IEEE",
  "Ph.D. KAUST",
  "MS Chalmers",
  "BS COMSATS",
  "10+ Years Research",
];

export default function Teacher() {
  return (
    <section
      className="relative overflow-hidden border-b border-slate-200"
      style={{
        background:
          "linear-gradient(180deg, #edf5fd 0%, #dcedfa 40%, #c8e1f4 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url(/assets/certificate/certificate-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative max-w-[1350px] mx-auto px-4 sm:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-12 items-center">
          <div className="relative">
            <Reveal variant="pop" delay={0.1} className="absolute -top-10 left-0">
              <div className="w-16 h-16 rounded-2xl bg-[#f1b8b8]/90" />
            </Reveal>
            <Reveal variant="pop" delay={0.2} className="absolute -top-16 left-24">
              <div className="w-20 h-24 rounded-2xl bg-[#f2dd93]/90" />
            </Reveal>
            <Reveal variant="pop" delay={0.3} className="absolute -bottom-8 left-12">
              <div className="w-14 h-14 rounded-2xl bg-[#d0e682]/80" />
            </Reveal>

            <Reveal className="relative">
              <p className="text-[22px] sm:text-[34px] leading-tight font-semibold text-slate-600 max-w-[440px]">
                Our teacher makes exam-prep easy and strategic.
              </p>
            </Reveal>

            <MaskedHeading
              as="h2"
              trigger="view"
              text="Learn from one world-class mentor."
              delay={0.15}
              className="relative mt-6 text-[40px] sm:text-[60px] leading-[1.04] tracking-[-0.03em] font-semibold text-slate-800 max-w-[680px]"
            />

            <Reveal delay={0.3}>
              <p className="mt-6 text-lg sm:text-[22px] leading-relaxed text-slate-700 max-w-[60ch]">
                Dr. Ali Imran blends deep engineering fundamentals with modern
                AI-driven research so students can study sharper, think deeper,
                and perform confidently.
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <Link
                href="/our-teachers"
                className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-[#1b96d8] px-7 py-3.5 text-white font-semibold text-lg shadow-md hover:bg-[#127fba] transition"
              >
                Our Teachers
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <Stagger as="ul" className="mt-6 flex flex-wrap gap-2.5 relative z-10" gap={0.06} delay={0.45}>
              {tags.map((tag) => (
                <StaggerItem
                  as="li"
                  key={tag}
                  variant="pop"
                  className="rounded-full border border-[#1E3557]/20 bg-[#FBF9F6]/85 px-3.5 py-1.5 text-sm font-semibold text-[#1E3557]"
                >
                  {tag}
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="relative max-w-[560px] mx-auto w-full">
            <Reveal variant="pop" delay={0.6} className="absolute -right-8 top-16 hidden lg:block">
              <div className="w-44 h-44 rounded-[2rem] border-2 border-[#cbdf86] bg-[#d8ee95]/55" />
            </Reveal>

            <div className="relative rounded-[2rem] bg-[#dbe9f5] p-4 sm:p-6 border border-[#FBF9F6]/70 shadow-[0_25px_70px_rgba(30,53,87,0.18)]">
              <Reveal variant="maskUp" duration={1.2} className="relative h-[520px] sm:h-[590px] rounded-[1.5rem] overflow-hidden bg-[#d9dee7]">
                <Image
                  src="/assets/certificate/ali-imran.jpg"
                  alt="Dr. Ali Imran Sandhu"
                  fill
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="object-cover"
                />
              </Reveal>

              <Reveal delay={0.55} className="absolute left-6 right-6 bottom-5 rounded-2xl bg-[#FBF9F6]/95 backdrop-blur-sm border border-slate-200 px-5 py-4 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[30px] sm:text-[38px] font-bold leading-none text-slate-900">
                      Dr. Ali Imran
                    </p>
                    <p className="text-sm sm:text-base mt-1 font-semibold text-slate-600">
                      Assistant Professor FCSE
                    </p>
                  </div>
                  <div className="rounded-full bg-[#e9f2fc] p-2.5 text-[#1E3557]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Image src="/assets/Logos/kaustlogo.png" alt="KAUST" width={68} height={22} className="h-5 w-auto" />
                  <Image src="/assets/Logos/chalmerslogo.png" alt="Chalmers" width={78} height={24} className="h-5 w-auto" />
                  <Image src="/assets/Logos/cuilogo.png" alt="COMSATS" width={78} height={24} className="h-5 w-auto" />
                </div>
              </Reveal>
            </div>

            <Reveal variant="pop" delay={0.8} className="absolute right-2.5 bottom-16 hidden lg:flex">
              <div className="flex items-center gap-2 rounded-xl bg-[#FBF9F6] border border-slate-200 px-3 py-2 shadow-lg">
                <Medal className="w-4 h-4 text-[#1E3557]" />
                <span className="text-xs font-bold text-slate-700">IEEE Senior Member</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
