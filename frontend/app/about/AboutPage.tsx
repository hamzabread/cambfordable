import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlarmClock,
  BookCheck,
  CheckCircle,
  ClipboardCheck,
  MessageSquareText,
  ShieldAlert,
  Video,
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

type PlatformFeature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type FlowStep = {
  step: string;
  title: string;
  detail: string;
};

const platformFeatures: PlatformFeature[] = [
  {
    icon: <Video className="w-6 h-6" />,
    title: "Live Online Classes",
    description:
      "Attend structured live classes with a clear schedule, Zoom-based sessions, and class resources in one place.",
  },
  {
    icon: <ShieldAlert className="w-6 h-6" />,
    title: "Quizzes With Anti-Cheating Signals",
    description:
      "Quiz attempts track tab switches, fullscreen exits, and auto-submit behavior so teachers can review suspicious activity fairly.",
  },
  {
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "Homework Submissions",
    description:
      "Submit homework files directly, track deadlines, and keep your work organized course-by-course.",
  },
  {
    icon: <BookCheck className="w-6 h-6" />,
    title: "Personalized Quiz and Homework Reviews",
    description:
      "Receive tailored remarks and scores from instructors and TAs so feedback is specific to your mistakes and progress.",
  },
  {
    icon: <MessageSquareText className="w-6 h-6" />,
    title: "Direct Messaging During Learning",
    description:
      "Use in-class chat and direct communication channels to ask questions quickly and stay connected with your teacher.",
  },
  {
    icon: <AlarmClock className="w-6 h-6" />,
    title: "Deadline and Progress Awareness",
    description:
      "Keep track of upcoming classes, active quizzes, due homework, and your course progress from one dashboard.",
  },
];

const flow: FlowStep[] = [
  {
    step: "1",
    title: "Enroll and Access Courses",
    detail:
      "Students enroll into courses and immediately get access to live classes, quizzes, homework, and study updates.",
  },
  {
    step: "2",
    title: "Learn Live, Practice Regularly",
    detail:
      "Attend online classes, complete homework, and attempt timed quizzes in a consistent learning cycle.",
  },
  {
    step: "3",
    title: "Get Personalized Feedback",
    detail:
      "Teachers and TAs review submissions with individualized scores and remarks on both quizzes and homework.",
  },
  {
    step: "4",
    title: "Improve With Clarity",
    detail:
      "Students use direct communication and detailed reviews to fix weaknesses before the next assignment or assessment.",
  },
];

const differences = [
  "Live classes are integrated with scheduling and classroom tools.",
  "Quizzes include anti-cheating monitoring flags for fair review.",
  "Homework and quizzes both support individualized comments and scores.",
  "Students can directly message and ask questions during learning flow.",
  "Teachers and TAs can review pending submissions efficiently.",
];

export function AboutPage() {
  return (
    <>
      <Header />

      <div className="bg-white">
        <section className="relative overflow-hidden bg-linear-to-br from-[#eef4fb] via-[#e8f0fa] to-[#f8fbff] py-18 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <MaskedHeading
                text="Cambfordable Is Built For Real Learning Outcomes"
                underline="Outcomes"
                underlineColor="#1b96d8"
                delay={0.15}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0f1f38] leading-[1.08] tracking-[-0.03em]"
              />

              <Reveal delay={1}>
                <p className="text-lg text-slate-700 mt-7 leading-relaxed max-w-[62ch]">
                  Cambfordable combines live online teaching, secure quiz workflows,
                  structured homework management, and personalized reviews into one
                  unified learning platform. It is designed so students do not just
                  submit tasks, but actually improve after every class, quiz, and
                  assignment.
                </p>
              </Reveal>
            </div>

            <Reveal variant="window" duration={1.2} delay={0.3} className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-[0_30px_60px_rgba(19,40,72,0.16)]">
              <Image
                src="/assets/online-tutorials-concept_52683-37480.avif"
                alt="A student learning online with a tutor"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 600px"
                className="object-cover"
              />
            </Reveal>
          </div>
        </section>

        <section className="py-18 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <MaskedHeading
                as="h2"
                trigger="view"
                text="Core Platform Features"
                className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#0f1f38]"
              />
              <Reveal delay={0.3}>
                <p className="text-lg text-slate-700 mt-4 max-w-3xl mx-auto">
                  Every feature in Cambfordable is aligned to a single goal: better
                  understanding, cleaner accountability, and faster improvement.
                </p>
              </Reveal>
            </div>

            <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" gap={0.08} amount={0.1}>
              {platformFeatures.map((feature) => (
                <StaggerItem
                  as="article"
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-[#f8fbff] p-7 shadow-[0_4px_14px_rgba(19,40,72,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(19,40,72,0.10)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1e3557] text-white flex items-center justify-center mb-5 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {feature.description}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="bg-[#f3f7fc] py-18 lg:py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <MaskedHeading
                as="h2"
                trigger="view"
                text="What Makes Cambfordable Different"
                className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#0f1f38]"
              />

              <Reveal delay={0.25}>
                <p className="text-slate-700 text-lg leading-relaxed mt-6 max-w-[62ch]">
                  Most platforms stop at &ldquo;content delivery.&rdquo; Cambfordable goes
                  further by connecting teaching, assessment integrity, detailed
                  marking, and communication into one loop.
                </p>
              </Reveal>

              <Stagger as="ul" className="space-y-4 mt-7" gap={0.08} delay={0.3}>
                {differences.map((point) => (
                  <StaggerItem as="li" key={point} className="flex items-start gap-3 text-slate-800">
                    <CheckCircle className="w-5 h-5 text-[#1b96d8] mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <Reveal variant="maskLeft" duration={1.2} className="rounded-3xl bg-white border border-slate-200 p-5 shadow-[0_20px_50px_rgba(19,40,72,0.10)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/assets/kimberly-farmer-lUaaKCUANVI-unsplash.jpg"
                  alt="A stack of textbooks on a study desk"
                  fill
                  sizes="(max-width: 1024px) 92vw, 600px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-18 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <MaskedHeading
                as="h2"
                trigger="view"
                text="How Learning Flows On Cambfordable"
                className="text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#0f1f38]"
              />
            </div>

            {/* The line draws as you read down the steps: the path is the point. */}
            <ScrollDrawnLine lineClassName="left-[23px]" color="#1b96d8">
              <ol className="space-y-10">
                {flow.map((item) => (
                  <li key={item.step} className="relative pl-16">
                    <Reveal variant="pop" className="absolute left-0 top-0">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#1e3557] text-lg font-bold text-white shadow-[0_6px_18px_rgba(19,40,72,0.25)]">
                        {item.step}
                      </span>
                    </Reveal>
                    <Reveal delay={0.1}>
                      <h3 className="text-2xl font-bold text-slate-900 pt-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-700 leading-relaxed mt-3 max-w-[60ch]">
                        {item.detail}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </ScrollDrawnLine>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#1e3557] py-18 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(27,150,216,0.25),transparent_45%),radial-gradient(circle_at_85%_100%,rgba(244,205,135,0.18),transparent_45%)]" />
          <div className="relative max-w-4xl mx-auto text-center">
            <MaskedHeading
              as="h2"
              trigger="view"
              text="One Platform. Better Classes. Better Feedback. Better Results."
              className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white"
            />
            <Reveal delay={0.4}>
              <p className="text-lg text-blue-100 mt-5 leading-relaxed">
                Cambfordable gives students the structure to stay consistent and
                the feedback to improve with purpose, every single week.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/signup" className="rounded-lg bg-[#FBF9F6] px-7 py-3 font-semibold text-[#12213b] shadow-md transition hover:-translate-y-0.5 hover:bg-white">
                  Create an account
                </Link>
                <Link href="/contact" className="rounded-lg border-2 border-white/70 px-7 py-3 font-semibold text-white transition hover:bg-white/10">
                  Talk to us
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
