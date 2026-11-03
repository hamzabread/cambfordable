import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Cpu,
  GraduationCap,
  Medal,
  Radar,
} from "lucide-react";
import Header from "../components/Landing/Header/Header";
import Footer from "../components/Landing/Footer/Footer";
import {
  MaskedHeading,
  Reveal,
  ScrollDrawnLine,
  Stagger,
  StaggerItem,
} from "../components/Motion/Motion";

const interests = [
  "Applied computational electromagnetics and wave interaction analysis in complex geometries",
  "2-D and 3-D joint electromagnetic and seismic inverse problems",
  "Signal processing and machine learning for advanced imaging",
  "Physics-informed machine learning integrated with numerical wave propagation solvers",
  "Bayesian experimental design for efficient sensor placement",
  "Interdisciplinary engineering education and collaborative research",
];

const achievements = [
  "Finalist in the Student Poster Competition at the 2016 IEEE IST Conference",
  "Best Student Paper nomination at the 2017 IEEE Applied Computational Electromagnetics Society Conference",
  "Two bronze medals for distinction at campus and institute levels at COMSATS University Islamabad",
  "10+ years of interdisciplinary research experience at the intersection of electromagnetics, AI, and imaging",
  "Senior Member, IEEE",
];

const timeline = [
  {
    years: "2007",
    title: "B.S. Electronics Engineering",
    place: "COMSATS University Islamabad (CUI), Pakistan",
    detail: "Graduated with distinction and received two bronze medals.",
    logo: "/assets/Logos/cuilogo.png",
  },
  {
    years: "2010",
    title: "M.S. Communication Engineering",
    place: "Chalmers University of Technology, Gothenburg, Sweden",
    detail: "Advanced graduate specialization in communication engineering.",
    logo: "/assets/Logos/chalmerslogo.png",
  },
  {
    years: "2011 - 2013",
    title: "Research Engineer",
    place: "Microwave Laboratory, University of Calabria, Rende, Italy",
    detail: "Research in microwave and computational electromagnetic systems.",
    logo: "/assets/certificate/lines.jpg",
  },
  {
    years: "2007 - 2021",
    title: "Lecturer, ECE Department",
    place: "COMSATS University Islamabad",
    detail: "Taught at undergraduate and graduate levels for over a decade.",
    logo: "/assets/Logos/cuilogo.png",
  },
  {
    years: "2020",
    title: "Ph.D. Electrical Engineering",
    place: "KAUST, Saudi Arabia",
    detail: "Division of Computer, Electrical, and Mathematical Sciences and Engineering.",
    logo: "/assets/Logos/kaustlogo.png",
  },
  {
    years: "2021 - 2023",
    title: "Postdoctoral Fellow",
    place: "KFUPM, Center of Integrative Petroleum Research",
    detail: "Advanced research in applied and interdisciplinary computational problems.",
    logo: "/assets/certificate/blue-lines.jpg",
  },
  {
    years: "Present",
    title: "Assistant Professor, FCSE",
    place: "GIK Institute Pakistan",
    detail: "Leading teaching, mentoring, and research at the faculty of computer science and engineering.",
    logo: "/assets/certificate/blocks.jpg",
  },
];

const pillars = [
  {
    icon: Radar,
    title: "Forward and Inverse Electromagnetic Solvers",
    body: "Developing numerical solvers for forward and inverse electromagnetic imaging problems with practical relevance.",
  },
  {
    icon: BrainCircuit,
    title: "Scientific ML and GAN Integration",
    body: "Integrating scientific machine learning and generative adversarial neural networks with electromagnetic and acoustic wave models.",
  },
  {
    icon: Cpu,
    title: "Phased Arrays and Microwave Devices",
    body: "Designing phased array antennas and microwave devices using rigorous computational and experimental frameworks.",
  },
];

export function OurTeachersPage() {
  return (
    <div className="bg-[#f8fbff] text-slate-900">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url(/assets/certificate/alt-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #e9f3fc 0%, #d8e8f6 45%, #eff6fd 100%)",
            }}
          />

          <div className="relative max-w-[1320px] mx-auto px-4 sm:px-8 py-14 lg:py-20">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg bg-white/90 border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1E3557] hover:bg-white transition"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <MaskedHeading
                  text="Dr. Ali Imran Sandhu"
                  underline="Imran Sandhu"
                  underlineColor="#1b96d8"
                  delay={0.15}
                  className="text-4xl sm:text-6xl leading-[1.08] tracking-[-0.03em] font-bold text-[#0f172a]"
                />

                <Reveal delay={0.75}>
                <p className="mt-5 text-xl font-semibold text-[#1E3557]">
                  Assistant Professor FCSE • Senior Member IEEE
                </p>

                <p className="mt-6 text-lg leading-relaxed text-slate-700 max-w-[62ch]">
                  Dr. Sandhu is a humble, self-motivated, and detail-oriented
                  academic with excellent communication skills and broad
                  cross-cultural training. He combines deep theoretical
                  foundations with practical research experience to mentor
                  students with precision and care.
                </p>
                </Reveal>

                <Stagger as="dl" className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3" gap={0.08} delay={0.95}>
                  {[
                    ["Research Experience", "10+ Years"],
                    ["Degrees", "BS • MS • Ph.D."],
                    ["Current Role", "Assistant Professor"],
                  ].map(([label, value]) => (
                    <StaggerItem key={label} className="rounded-2xl bg-white/90 border border-slate-200 p-4 shadow-[0_4px_14px_rgba(19,40,72,0.05)]">
                      <dt className="text-xs font-medium text-slate-500">{label}</dt>
                      <dd className="mt-1 text-xl font-bold text-[#1E3557]">{value}</dd>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>

              <div className="relative max-w-[560px] mx-auto w-full">
                <Reveal variant="pop" delay={0.9} className="absolute -right-6 -top-6">
                  <div className="w-28 h-28 rounded-3xl bg-[#d8eb9a]/70" />
                </Reveal>
                <Reveal variant="pop" delay={1.05} className="absolute -left-8 top-20 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#f3c3c3]/85" />
                </Reveal>

                <div className="relative rounded-[2rem] p-4 sm:p-6 border border-white/75 bg-white/70 backdrop-blur-sm shadow-[0_30px_70px_rgba(16,41,74,0.18)]">
                  <Reveal variant="maskUp" duration={1.3} delay={0.2} className="relative h-[520px] rounded-[1.5rem] overflow-hidden">
                    <Image
                      src="/assets/certificate/ali-imran.jpg"
                      alt="Dr. Ali Imran Sandhu"
                      fill
                      sizes="(max-width: 1024px) 90vw, 520px"
                      className="object-cover"
                      priority
                    />
                  </Reveal>

                  <Reveal delay={0.9} className="absolute left-8 right-8 -bottom-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl">
                    <p className="text-2xl font-bold text-slate-900">Dr. Ali Imran Sandhu</p>
                    <p className="text-sm font-semibold text-slate-600">
                      Numerical Electromagnetics • Scientific ML • Wave Imaging
                    </p>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <Image src="/assets/Logos/kaustlogo.png" alt="KAUST" width={70} height={24} className="h-5 w-auto" />
                      <Image src="/assets/Logos/chalmerslogo.png" alt="Chalmers" width={80} height={24} className="h-5 w-auto" />
                      <Image src="/assets/Logos/cuilogo.png" alt="COMSATS" width={75} height={24} className="h-5 w-auto" />
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
          <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-6" gap={0.1}>
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <StaggerItem
                  as="article"
                  key={pillar.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_14px_rgba(19,40,72,0.04)] transition-shadow duration-300 hover:shadow-[0_20px_44px_rgba(19,40,72,0.12)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#e6f0fb] text-[#1E3557] flex items-center justify-center transition duration-300 ease-out group-hover:bg-[#1E3557] group-hover:text-white group-hover:-rotate-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-[#0f172a]">{pillar.title}</h2>
                  <p className="mt-3 text-slate-600 leading-relaxed">{pillar.body}</p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Reveal>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-slate-900">Biography and Qualifications</h2>

                <p className="mt-6 text-slate-700 leading-relaxed text-lg">
                  Ali Imran Sandhu (Senior Member, IEEE) received the B.S.
                  degree in Electronics Engineering from COMSATS University
                  Islamabad (CUI), Lahore, Pakistan, in 2007; M.S. degree in
                  Communication Engineering from Chalmers University of
                  Technology, Gothenburg, Sweden, in 2010; and Ph.D. degree in
                  Electrical Engineering from KAUST, Thuwal, Saudi Arabia, in
                  2020.
                </p>

                <p className="mt-5 text-slate-700 leading-relaxed text-lg">
                  From 2011 to 2013, he served as a Research Engineer at the
                  Microwave Laboratory, University of Calabria, Italy. From
                  August 2007 to September 2021, he taught as a Lecturer at CUI.
                  During September 2021 to August 2023, he worked as a
                  postdoctoral fellow at KFUPM. He is currently serving as an
                  Assistant Professor at the Faculty of Computer Science and
                  Engineering, GIK Institute Pakistan.
                </p>

              </Reveal>

              <div className="rounded-3xl bg-[#f3f8fd] border border-slate-200 p-6 sm:p-8 self-start">
                <h2 className="text-2xl font-bold text-slate-900">Research Interests</h2>
                <Stagger as="ul" className="mt-5 space-y-3.5" gap={0.07}>
                  {interests.map((interest) => (
                    <StaggerItem as="li" key={interest} className="flex items-start gap-3 text-slate-700">
                      <BookOpen className="w-5 h-5 mt-0.5 shrink-0 text-[#1b96d8]" />
                      <span>{interest}</span>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1000px] mx-auto px-4 sm:px-8 py-16 lg:py-20">
          <MaskedHeading
            as="h2"
            trigger="view"
            text="Academic and Career Timeline"
            className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-slate-900"
          />
          <ScrollDrawnLine className="mt-10" lineClassName="left-[23px]" color="#1E3557">
            <ol className="space-y-6">
              {timeline.map((item) => (
                <li key={`${item.years}-${item.title}`} className="relative pl-16">
                  <Reveal variant="pop" className="absolute left-0 top-3">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-4 border-[#f8fbff] bg-white shadow-[0_6px_18px_rgba(19,40,72,0.18)]">
                      <Image src={item.logo} alt="" width={40} height={40} className="h-full w-full object-cover" />
                    </span>
                  </Reveal>
                  <Reveal delay={0.08} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_14px_rgba(19,40,72,0.05)]">
                    <p className="text-sm font-bold tabular-nums text-[#1b96d8]">{item.years}</p>
                    <h3 className="mt-0.5 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{item.place}</p>
                    <p className="text-slate-700 mt-3">{item.detail}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </ScrollDrawnLine>
        </section>

        <section className="bg-[#ebf4fd] border-y border-slate-200">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
            <MaskedHeading
              as="h2"
              trigger="view"
              text="Recognition and Distinction"
              className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-slate-900"
            />

            <Stagger as="ul" className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4" gap={0.07}>
              {achievements.map((achievement) => (
                <StaggerItem
                  as="li"
                  key={achievement}
                  className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3 shadow-[0_4px_14px_rgba(19,40,72,0.04)]"
                >
                  <Medal className="w-5 h-5 mt-0.5 shrink-0 text-[#c08a1e]" />
                  <p className="text-slate-700">{achievement}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
          <Reveal variant="window" duration={1.1} className="rounded-3xl bg-gradient-to-r from-[#102645] via-[#1E3557] to-[#355f8c] p-8 sm:p-12 text-white relative overflow-hidden">
            <Image
              src="/assets/certificate/lines.jpg"
              alt=""
              fill
              sizes="1320px"
              className="object-cover opacity-20"
            />

            <div className="relative z-10">
              <MaskedHeading
                as="h2"
                trigger="view"
                text="Learning with Dr. Ali Imran means rigorous thinking, modern engineering methods, and globally informed mentorship."
                underline="rigorous thinking,"
                className="text-3xl sm:text-5xl font-bold leading-[1.12] tracking-[-0.02em] max-w-[860px]"
              />

              <Reveal delay={0.4}>
              <p className="mt-5 text-lg text-blue-100 max-w-[780px]">
                From numerical wave solvers to AI-driven imaging systems, his
                guidance combines strong fundamentals and frontier-level
                innovation.
              </p>
              </Reveal>

              <Stagger className="mt-8 flex flex-wrap gap-3" gap={0.08} delay={0.6}>
                <StaggerItem as="span" variant="pop" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Ph.D. KAUST
                </StaggerItem>
                <StaggerItem as="span" variant="pop" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" />
                  Physics-Informed ML
                </StaggerItem>
                <StaggerItem as="span" variant="pop" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <Radar className="w-4 h-4" />
                  Inverse Imaging
                </StaggerItem>
                <StaggerItem as="span" variant="pop">
                  <Link href="/signup" className="rounded-full bg-[#FBF9F6] px-5 py-2 text-sm font-bold text-[#12213b] inline-flex items-center gap-2 transition hover:bg-white">
                    Learn with Dr. Ali Imran
                  </Link>
                </StaggerItem>
              </Stagger>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
