"use client";

import React from "react";
import { Download, Mail, Github, Linkedin, Twitter } from "lucide-react";

export default function BiographySection() {
  const socialLinks = [
    { icon: Mail, href: "#", label: "Email" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const education = [
    {
      degree: "Ph.D. in Electrical Engineering",
      gpa: "(4.0/4.0)",
      year: "2020",
      institution: "King Abdullah University of Science and Technology (KAUST)",
      color: "from-blue-500 to-blue-600",
    },
    {
      degree: "M.S. in Communication Engineering",
      gpa: "(4.0/4.0)",
      year: "2010",
      institution: "Chalmers University of Technology, Sweden",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      degree: "B.S. in Electronics Engineering",
      gpa: "(3.99/4.0)",
      year: "2007",
      institution: "COMSATS University Islamabad",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const interests = [
    "Electrical Engineering",
    "Computer Science",
    "Artificial Intelligence",
    "Applied Industry Solutions",
    "International Collaboration",
    "Engineering Education",
  ];

  return (
    <div className="py-16 relative px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F3F3F3" }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute z-0 inset-0 h-full w-full object-cover"
      >
        <source src="/assets/certificate/bg-vid.mp4" type="video/mp4" />
      </video>
      <div className="max-w-7xl z-10 mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            {/* Profile Image */}
            <div className="mb-8">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden border-4 border-blue-400 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">C</span>
                </div>
              </div>

              {/* Name and Title */}
              <div className="text-center relative z-10">
                <h1 className="text-3xl text-black font-bold mb-2">Ali Imran</h1>
                <p className="text-slate-500 z-10 text-sm mb-1">
                  Senior Member IEEE USA
                </p>
                <p className="text-slate-400 text-xs">
                  Ph.D. Electrical Engineering
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex z-10 relative justify-center gap-4 mb-8">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
                    style={{ backgroundColor: "#1E3557" }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                );
              })}
            </div>

            {/* Download CV Button */}
            <button className="w-full relative z-10 px-4 py-2.5 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mb-8 hover:opacity-90" style={{ backgroundColor: "#1E3557" }}>
              <Download className="w-4 h-4" />
              Download CV
            </button>

            {/* Quick Stats */}
            <div className="space-y-3 z-10 relative">
              <div className="rounded-lg p-4" style={{ backgroundColor: "#E8EEF7" }}>
                <p className="text-slate-600 text-xs mb-1">Member Since</p>
                <p className="font-bold" style={{ color: "#1E3557" }}>IEEE USA</p>
              </div>
            </div>
          </div>

          {/* Right Column - Biography */}
          <div className="lg:col-span-2 z-10 relative">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl text-black font-bold mb-6">Biography</h2>
              <div className="w-16 h-1 rounded-full" style={{ backgroundColor: "#1E3557" }}></div>
            </div>

            {/* Main Bio */}
            <div className="space-y-6 mb-8 z-10 relative">
              <p className="leading-relaxed text-justify" style={{ color: "#4A5568" }}>
                I am a Senior Member of Institute of Electrical and Electronics
                Engineers (IEEE USA), holding a Ph.D. in Electrical Engineering
                from King Abdullah University of Science and Technology (KAUST)
                in 2020, an M.S. in Communication Engineering from Chalmers
                University of Technology, Sweden, in 2010 and a B.S. in
                Electronics Engineering from COMSATS University Islamabad, in
                2007.
              </p>

              <p className="leading-relaxed text-justify" style={{ color: "#4A5568" }}>
                I am fundamentally an electrical engineer with a multitude of
                expertise in engineering, computer science and artificial
                intelligence. I always wished to get trained and contribute to
                technically applied industry. The thirst of studying among
                international students brought me to CHALMERS University of
                Technology, Gothenburg, Sweden, where I accomplished my
                master's in communication engineering, and where for the first
                time, I experienced (i) academia and industry collaborating and
                solving applied problems, and (ii) industries valuing and
                onboarding multitude of talent. The passion for completing
                education brought me to King Abdullah University of Science and
                Technology (KAUST), KSA, for a Ph.D. in electrical engineering.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 z-10 relative md:grid-cols-2 gap-8">
              {/* Interests */}
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: "#1E3557" }}>Interests</h3>
                <ul className="space-y-2">
                  {interests.map((interest, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-lg font-bold mt-1" style={{ color: "#1E3557" }}>
                        •
                      </span>
                      <span style={{ color: "#4A5568" }}>{interest}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Education */}
              <div className="z-10 relative">
                <h3 className="text-xl font-bold mb-4" style={{ color: "#1E3557" }}>Education</h3>
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${edu.color} flex items-center justify-center text-white font-bold text-sm`}
                      >
                        📚
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: "#1E3557" }}>
                          {edu.degree}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#718096" }}>
                          {edu.institution}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs font-semibold" style={{ color: "#1E3557" }}>
                            {edu.year}
                          </span>
                          <span className="text-xs" style={{ color: "#A0AEC0" }}>
                            {edu.gpa}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full z-10 relative mt-12 h-px" style={{ backgroundColor: "#E2E8F0" }}></div>

        {/* Footer CTA */}
        <div className="mt-12 z-10 relative text-center">
          <p className="mb-6" style={{ color: "#4A5568" }}>
            Interested in collaboration or consultation?
          </p>
          <button className="px-8 py-3 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" style={{ backgroundColor: "#1E3557" }}>
            Get In Touch
          </button>
        </div>
      </div>
    </div>
  );
}