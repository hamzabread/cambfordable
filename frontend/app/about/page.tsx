import React from "react";
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

export default function AboutPage() {
  const platformFeatures: PlatformFeature[] = [
    {
      icon: <Video className="w-7 h-7" />,
      title: "Live Online Classes",
      description:
        "Attend structured live classes with a clear schedule, Zoom-based sessions, and class resources in one place.",
    },
    {
      icon: <ShieldAlert className="w-7 h-7" />,
      title: "Quizzes With Anti-Cheating Signals",
      description:
        "Quiz attempts track tab switches, fullscreen exits, and auto-submit behavior so teachers can review suspicious activity fairly.",
    },
    {
      icon: <ClipboardCheck className="w-7 h-7" />,
      title: "Homework Submissions",
      description:
        "Submit homework files directly, track deadlines, and keep your work organized course-by-course.",
    },
    {
      icon: <BookCheck className="w-7 h-7" />,
      title: "Personalized Quiz and Homework Reviews",
      description:
        "Receive tailored remarks and scores from instructors and TAs so feedback is specific to your mistakes and progress.",
    },
    {
      icon: <MessageSquareText className="w-7 h-7" />,
      title: "Direct Messaging During Learning",
      description:
        "Use in-class chat and direct communication channels to ask questions quickly and stay connected with your teacher.",
    },
    {
      icon: <AlarmClock className="w-7 h-7" />,
      title: "Deadline and Progress Awareness",
      description:
        "Keep track of upcoming classes, active quizzes, due homework, and your course progress from one dashboard.",
    },
  ];

  const flow: FlowStep[] = [
    {
      step: "01",
      title: "Enroll and Access Courses",
      detail:
        "Students enroll into courses and immediately get access to live classes, quizzes, homework, and study updates.",
    },
    {
      step: "02",
      title: "Learn Live, Practice Regularly",
      detail:
        "Attend online classes, complete homework, and attempt timed quizzes in a consistent learning cycle.",
    },
    {
      step: "03",
      title: "Get Personalized Feedback",
      detail:
        "Teachers and TAs review submissions with individualized scores and remarks on both quizzes and homework.",
    },
    {
      step: "04",
      title: "Improve With Clarity",
      detail:
        "Students use direct communication and detailed reviews to fix weaknesses before the next assignment or assessment.",
    },
  ];

  return (
    <>
      <Header />

      <div className="bg-white">
        <section className="bg-linear-to-br from-[#eef4fb] via-[#e8f0fa] to-[#f8fbff] py-18 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#1e3557]/20 bg-white px-4 py-1 text-sm font-semibold text-[#1e3557]">
                <CheckCircle className="w-4 h-4" />
                Platform Overview
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mt-5 leading-tight">
                Cambfordable Is Built For Real Learning Outcomes
              </h1>

              <p className="text-lg text-gray-700 mt-6 leading-relaxed">
                Cambfordable combines live online teaching, secure quiz workflows,
                structured homework management, and personalized reviews into one
                unified learning platform. It is designed so students do not just
                submit tasks, but actually improve after every class, quiz, and
                assignment.
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
              <img
                src="/assets/online-tutorials-concept_52683-37480.avif"
                alt="Cambfordable platform"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="py-18 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Core Platform Features
              </h2>
              <p className="text-lg text-gray-700 mt-4 max-w-3xl mx-auto">
                Every feature in Cambfordable is aligned to a single goal: better
                understanding, cleaner accountability, and faster improvement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {platformFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-7 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1e3557] text-white flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f3f7fc] py-18 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                What Makes Cambfordable Different
              </h2>
              <div className="w-16 h-1 bg-[#1e3557] rounded-full mt-4" />

              <p className="text-gray-700 text-lg leading-relaxed mt-6">
                Most platforms stop at "content delivery." Cambfordable goes
                further by connecting teaching, assessment integrity, detailed
                marking, and communication into one loop.
              </p>

              <ul className="space-y-4 mt-7">
                {[
                  "Live classes are integrated with scheduling and classroom tools.",
                  "Quizzes include anti-cheating monitoring flags for fair review.",
                  "Homework and quizzes both support individualized comments and scores.",
                  "Students can directly message and ask questions during learning flow.",
                  "Teachers and TAs can review pending submissions efficiently.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-gray-800">
                    <CheckCircle className="w-5 h-5 text-[#1e3557] mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-md">
              <img
                src="/assets/kimberly-farmer-lUaaKCUANVI-unsplash.jpg"
                alt="Teacher and student experience"
                className="w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        <section className="py-18 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                How Learning Flows On Cambfordable
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flow.map((item) => (
                <article
                  key={item.step}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <p className="text-sm font-bold text-[#1e3557]">STEP {item.step}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1e3557] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              One Platform. Better Classes. Better Feedback. Better Results.
            </h2>
            <p className="text-lg text-blue-100 mt-5 leading-relaxed">
              Cambfordable gives students the structure to stay consistent and
              the feedback to improve with purpose, every single week.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}