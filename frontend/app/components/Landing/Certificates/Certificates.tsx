"use client";

import React from "react";
import { Download, Mail, Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";

export default function BiographySection() {
  const socialLinks = [
    { icon: Mail, href: "#", label: "Email" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
  ];

  const interests = [
    "Electrical Engineering EE CE",
    "Computer Science",
    "Artificial Intelligence",
    "Applied Industry Solutions",
    "International Collaboration",
    "Engineering Education",
  ];

  return (
    <div
      className="py-16 relative px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "#F3F3F3",
        backgroundImage: "url(/assets/certificate/alt-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      {/* Blur Overlay */}
      <div className="absolute inset-0 z-0 backdrop-blur-[3px]"></div>

      <div className="max-w-7xl z-10 mx-auto relative">
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
              <div className="text-center">
                <h1 className="text-3xl text-black font-bold mb-2">
                  Ali Imran
                </h1>
                <p className="text-slate-800 font-extrabold text-sm mb-1">
                  Senior Member IEEE USA
                </p>
                <p className="text-slate-900 font-extrabold text-sm">
                  Ph.D. Electrical Engineering
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-4 mb-8">
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
            <button
              className="w-full px-4 py-2.5 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mb-8 hover:opacity-90"
              style={{ backgroundColor: "#1E3557" }}
            >
              <Download className="w-4 h-4" />
              Download CV
            </button>

            {/* Quick Stats */}
            <div className="space-y-3">
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "#E8EEF7" }}
              >
                <p className="text-slate-600 text-xs mb-1">Member Since</p>
                <p className="font-bold" style={{ color: "#1E3557" }}>
                  IEEE USA
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Biography */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl text-black font-bold mb-6">Biography</h2>
              <div
                className="w-16 h-1 rounded-full"
                style={{ backgroundColor: "#1E3557" }}
              ></div>
            </div>

            {/* Main Bio */}
            <div className="space-y-6 mb-8">
              <p
                className="leading-relaxed text-justify font-bold"
                style={{ color: "#000" }}
              >
               I hold a Ph.D. in Electrical Engineering from King Abdullah University of Science and Technology (KAUST),
               an M.S. in Communication Engineering from Chalmers University of Technology in Sweden, and 
               a B.S. in Electronics Engineering from COMSATS University Islamabad. 
               Each milestone has been a chapter in a journey filled with rich experiences, brilliant mentors, and wonderful people.
              </p>

              <p
                className="leading-relaxed text-justify font-bold"
                style={{ color: "#000" }}
              >
               I am fundamentally an electronics engineer at heart, a passion kindled in early childhood by watching 
               my father — a radar technician who served the Pakistan Air Force for 25 years. 
               He taught me to love the hum of machines, the logic of circuits, and the discipline of service. 
               That fascination stayed with me through my undergraduate years at CUI, where I consistently ranked among the top three students,
                earned semesterly scholarships, graduated with distinction, and was honored with two bronze medals for academic excellence.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Interests */}
              <div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#000" }}
                >
                  Interests
                </h3>
                <ul className="space-y-2">
                  {interests.map((interest, idx) => (
                    <li key={idx} className="flex font-semibold items-center gap-3">
                      <span
                        className="text-lg font-bold mt-1"
                        style={{ color: "#000" }}
                      >
                        •
                      </span>
                      <span style={{ color: "#000" }}>{interest}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Education - Hardcoded */}
              <div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#111" }}
                >
                  Education
                </h3>
                <div className="space-y-4">
                  {/* Ph.D. */}
                  <div className="flex gap-3">
                    <img src="assets/Logos/kaustlogo.png" className="w-10 h-10" alt="KAUST" />
                    <div className="flex-1">
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#111" }}
                      >
                        Ph.D. in Electrical Engineering
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#111" }}
                      >
                        King Abdullah University of Science and Technology (KAUST), Saudi Arabia
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#111" }}
                        >
                          2020
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#111" }}
                        >
                          (3.55/4.0)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MS */}
                  <div className="flex gap-3">
                    <img src="assets/Logos/chalmerslogo.png" className="w-10 h-10" alt="Chalmers" />
                    <div className="flex-1">
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#111" }}
                      >
                        MS in Electrical (Wireless Communication) Engineering
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#111" }}
                      >
                        Chalmers University of Technology, Sweden
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#111" }}
                        >
                          2010
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#111" }}
                        >
                          (4.5/5.0)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BS */}
                  <div className="flex gap-3 relative">
                    <img src="assets/Logos/cuilogo.png" className="w-20 h-10 left-[-20px] absolute" alt="COMSATS" />
                    <div className="flex-1 ml-13">
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#111" }}
                      >
                        BS in Electronics Engineering
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#111" }}
                      >
                        COMSATS University Islamabad, Pakistan
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#111" }}
                        >
                          2007
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "#111" }}
                        >
                          (3.62/4.0)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full mt-12 h-px"
          style={{ backgroundColor: "#E2E8F0" }}
        ></div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="mb-6" style={{ color: "#000" }}>
            Interested in collaboration or consultation?
          </p>
          <button
            className="px-8 py-3 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: "#1E3557" }}
          >
            Get In Touch
          </button>
        </div>
      </div>
    </div>
  );
}