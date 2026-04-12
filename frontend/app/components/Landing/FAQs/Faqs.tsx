"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Cog } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "Do you cover full O Level and A Level syllabuses?",
      answer:
        "Yes. We follow complete Cambridge-focused syllabus pathways and build your study plan around your current level and exam timeline.",
    },
    {
      id: 2,
      question: "Which subjects are currently available on Cambfordable?",
      answer:
        "Current tracks include core O/A Levels subjects and selected AI-oriented modules. If you are targeting a specific paper, contact us and we will confirm availability.",
    },
    {
      id: 3,
      question: "How is this different from recorded video platforms?",
      answer:
        "You get direct teacher communication, live support, and personalized homework and quiz reviews, not just pre-recorded content.",
    },
    {
      id: 4,
      question: "Will I receive feedback on every homework and quiz?",
      answer:
        "Yes. Feedback is part of the learning system on Cambfordable, so you can understand mistakes quickly and improve week by week.",
    },
    {
      id: 5,
      question: "Can I use Cambfordable from more than one device?",
      answer:
        "Yes. You can study from laptop, tablet, or phone as long as you sign in with your account and have a stable internet connection.",
    },
    {
      id: 6,
      question: "Can Cambfordable guarantee an A or A*?",
      answer:
        "No honest platform can guarantee grades. What we do guarantee is structured teaching, guided practice, and actionable feedback to maximize your performance.",
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section
      className="py-18 px-4 sm:px-6 lg:px-8 bg-[#FBF9F6]"
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 900\"><defs><pattern id=\"dots\" x=\"40\" y=\"40\" width=\"80\" height=\"80\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"%231e3557\" opacity=\"0.05\"/></pattern></defs><rect width=\"1440\" height=\"900\" fill=\"%23FBF9F6\"/><rect width=\"1440\" height=\"900\" fill=\"url(%23dots)\"/><circle cx=\"140\" cy=\"120\" r=\"240\" fill=\"%23bdd7ff\" opacity=\"0.20\"/><circle cx=\"1240\" cy=\"780\" r=\"280\" fill=\"%23cfe2ff\" opacity=\"0.26\"/><circle cx=\"640\" cy=\"420\" r=\"150\" fill=\"%23b8d2f6\" opacity=\"0.18\"/></svg>')",
        backgroundAttachment: "scroll",
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.25fr] gap-8 lg:gap-12 items-start">
        <div className="pt-3 lg:pt-6">
          <h2 className="text-5xl sm:text-6xl font-semibold leading-[1.05] text-[#132848]">
            Got Questions?
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-700">
            Find all the answers to common questions here. If you still need
            extra support, book a free consultation with our team.
          </p>

          <Link
            href="/contact"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-black px-8 py-3 text-base font-semibold text-white hover:bg-[#121212] transition"
          >
            CONTACT US
          </Link>

          <div className="mt-14 hidden lg:flex items-center gap-3 text-[#5e81b5]">
            <Cog className="h-14 w-14" />
            <Cog className="h-11 w-11" />
            <Cog className="h-16 w-16" />
          </div>
        </div>

        <div className="space-y-5">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-2xl border border-[#cfe0f6] bg-[#fdfbf8]/95 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(faq.id)}
                className="w-full cursor-pointer px-5 sm:px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-[#eef4ff] transition-colors"
              >
                <h3 className="text-xl font-semibold leading-snug text-[#20314f]">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-6 w-6 text-[#5677a8] transition-transform duration-300 ${
                    expandedId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedId === faq.id && (
                <div className="px-5 sm:px-6 py-4 border-t border-[#d9e7fa] animate-slideDown bg-[#eef4ff]">
                  <p className="text-slate-700 leading-relaxed text-base">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}