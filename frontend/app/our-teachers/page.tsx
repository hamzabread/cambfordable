import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  BrainCircuit,
  Cpu,
  GraduationCap,
  Medal,
  Radar,
  Sparkles,
} from "lucide-react";
import Header from "../components/Landing/Header/Header";
import Footer from "../components/Landing/Footer/Footer";

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

export default function OurTeachersPage() {
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
              className="inline-flex items-center gap-2 rounded-lg bg-white/90 border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1E3557] hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#1E3557]/20 bg-white/75 px-4 py-1 text-sm font-bold text-[#1E3557]">
                  <Sparkles className="w-4 h-4" />
                  Featured Teacher Profile
                </p>

                <h1 className="mt-5 text-4xl sm:text-6xl leading-tight font-bold text-[#0f172a]">
                  Dr. Ali Imran Sandhu
                </h1>

                <p className="mt-4 text-xl font-semibold text-[#1E3557]">
                  Assistant Professor FCSE • Senior Member IEEE
                </p>

                <p className="mt-6 text-lg leading-relaxed text-slate-700">
                  Dr. Sandhu is a humble, self-motivated, and detail-oriented
                  academic with excellent communication skills and broad
                  cross-cultural training. He combines deep theoretical
                  foundations with practical research experience to mentor
                  students with precision and care.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Research Experience</p>
                    <p className="text-2xl font-bold text-[#1E3557]">10+ Years</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Degrees</p>
                    <p className="text-2xl font-bold text-[#1E3557]">BS • MS • Ph.D.</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Current Role</p>
                    <p className="text-2xl font-bold text-[#1E3557]">Assistant Professor</p>
                  </div>
                </div>
              </div>

              <div className="relative max-w-[560px] mx-auto w-full">
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-3xl bg-[#d8eb9a]/70" />
                <div className="absolute -left-8 top-20 w-16 h-16 rounded-2xl bg-[#f3c3c3]/85" />

                <div className="relative rounded-[2rem] p-4 sm:p-6 border border-white/75 bg-white/70 backdrop-blur-sm shadow-[0_30px_70px_rgba(16,41,74,0.18)]">
                  <div className="relative h-[520px] rounded-[1.5rem] overflow-hidden">
                    <Image
                      src="/assets/certificate/ali-imran.jpg"
                      alt="Dr. Ali Imran Sandhu"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="absolute left-8 right-8 -bottom-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl">
                    <p className="text-2xl font-bold text-slate-900">Dr. Ali Imran Sandhu</p>
                    <p className="text-sm font-semibold text-slate-600">
                      Numerical Electromagnetics • Scientific ML • Wave Imaging
                    </p>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <Image src="/assets/Logos/kaustlogo.png" alt="KAUST" width={70} height={24} className="h-5 w-auto" />
                      <Image src="/assets/Logos/chalmerslogo.png" alt="Chalmers" width={80} height={24} className="h-5 w-auto" />
                      <Image src="/assets/Logos/cuilogo.png" alt="COMSATS" width={75} height={24} className="h-5 w-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#e6f0fb] text-[#1E3557] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-[#0f172a]">{pillar.title}</h2>
                  <p className="mt-3 text-slate-600 leading-relaxed">{pillar.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Biography and Qualifications</h2>
                <div className="w-16 h-1 mt-4 rounded-full bg-[#1E3557]" />

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

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="relative rounded-2xl overflow-hidden h-40">
                    <Image src="/assets/certificate/ali-imran.jpg" alt="Dr. Ali Imran portrait" fill className="object-cover" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden h-40">
                    <Image src="/assets/certificate/blocks.jpg" alt="Decorative texture" fill className="object-cover" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Research Interests</h2>
                <ul className="mt-5 space-y-3">
                  {interests.map((interest) => (
                    <li key={interest} className="flex items-start gap-3 text-slate-700">
                      <BookOpen className="w-5 h-5 mt-0.5 text-[#1E3557]" />
                      <span>{interest}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Academic and Career Timeline</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {timeline.map((item) => (
              <article
                key={`${item.years}-${item.title}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <Image src={item.logo} alt={item.title} width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1E3557]">{item.years}</p>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{item.place}</p>
                    <p className="text-slate-700 mt-3">{item.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#ebf4fd] border-y border-slate-200">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Recognition and Distinction</h2>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement}
                  className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3"
                >
                  <Medal className="w-5 h-5 mt-0.5 text-[#1E3557]" />
                  <p className="text-slate-700">{achievement}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative rounded-2xl overflow-hidden h-44">
                <Image src="/assets/certificate/blue-lines.jpg" alt="Blue abstract background" fill className="object-cover" />
              </div>
              <div className="relative rounded-2xl overflow-hidden h-44">
                <Image src="/assets/certificate/ali-imran.jpg" alt="Ali Imran profile" fill className="object-cover" />
              </div>
              <div className="relative rounded-2xl overflow-hidden h-44">
                <Image src="/assets/certificate/17973903.jpg" alt="Research background texture" fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16">
          <div className="rounded-3xl bg-gradient-to-r from-[#102645] via-[#1E3557] to-[#355f8c] p-8 sm:p-12 text-white relative overflow-hidden">
            <Image
              src="/assets/certificate/lines.jpg"
              alt="Decorative line art"
              fill
              className="object-cover opacity-20"
            />

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/35 px-4 py-1 text-sm font-semibold">
                <Award className="w-4 h-4" />
                Mentorship and Research Excellence
              </p>

              <h2 className="mt-5 text-3xl sm:text-5xl font-bold max-w-[860px]">
                Learning with Dr. Ali Imran means rigorous thinking, modern
                engineering methods, and globally informed mentorship.
              </h2>

              <p className="mt-5 text-lg text-blue-100 max-w-[780px]">
                From numerical wave solvers to AI-driven imaging systems, his
                guidance combines strong fundamentals and frontier-level
                innovation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Ph.D. KAUST
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" />
                  Physics-Informed ML
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                  <Radar className="w-4 h-4" />
                  Inverse Imaging
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
