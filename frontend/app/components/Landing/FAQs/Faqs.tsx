"use client";
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  borderColor: string;
}

export default function FAQSection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "What qualifications do you have?",
      answer: "I hold certified qualifications in O-Levels Mathematics and Physics, A-Levels Chemistry and Physics, and specialized certifications in Artificial Intelligence and Machine Learning from Stanford and Coursera. All my credentials are verified and up-to-date.",
      category: "Qualifications",
      borderColor: "border-emerald-500"
    },
    {
      id: 2,
      question: "How do one-on-one sessions work?",
      answer: "Each session is tailored to your individual learning pace and style. We use interactive tools, screen sharing, and real-time problem-solving. Sessions are typically 1-2 hours long, and you can schedule them according to your convenience.",
      category: "Sessions",
      borderColor: "border-blue-500"
    },
    {
      id: 3,
      question: "What subjects do you teach?",
      answer: "I specialize in O-Levels and A-Levels subjects including Mathematics, Physics, Chemistry, and English Literature. I also offer specialized training in Artificial Intelligence, Machine Learning, and Deep Learning for students interested in tech.",
      category: "Subjects",
      borderColor: "border-green-500"
    },
    {
      id: 4,
      question: "How much does tutoring cost?",
      answer: "Pricing varies based on the subject and level. O-Levels and A-Levels sessions typically range from $25-40 per hour, while AI specialization courses are priced differently. Please contact me for a customized quote based on your needs.",
      category: "Pricing",
      borderColor: "border-purple-500"
    },
    {
      id: 5,
      question: "Can you help with exam preparation?",
      answer: "Absolutely! I specialize in exam preparation for Cambridge O-Levels and A-Levels. I provide practice papers, past questions, time management strategies, and targeted revision plans to help you achieve your best grades.",
      category: "Exams",
      borderColor: "border-cyan-500"
    },
    {
      id: 6,
      question: "What if I need to cancel or reschedule?",
      answer: "I understand that schedules change. You can reschedule sessions with at least 24 hours notice without any penalty. For cancellations, please provide as much advance notice as possible so I can accommodate other students.",
      category: "Policies",
      borderColor: "border-orange-500"
    },
    {
      id: 7,
      question: "Do you provide study materials?",
      answer: "Yes, I provide comprehensive study materials including notes, practice questions, past papers, and reference guides. All materials are tailored to your specific exam board and curriculum requirements.",
      category: "Materials",
      borderColor: "border-red-500"
    },
    {
      id: 8,
      question: "How do I get started?",
      answer: "Getting started is simple! Click the 'Enroll Now' button, fill out a brief questionnaire about your learning goals, and I'll contact you to schedule your first session. We'll discuss your needs and create a personalized learning plan.",
      category: "Getting Started",
      borderColor: "border-pink-500"
    }
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8" style={{
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900"><defs><linearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" style="stop-color:%23f8fafc;stop-opacity:1" /><stop offset="100%25" style="stop-color:%23e2e8f0;stop-opacity:1" /></linearGradient><pattern id="dots" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="%231e3557" opacity="0.05"/></pattern></defs><rect width="1440" height="900" fill="url(%23grad1)"/><rect width="1440" height="900" fill="url(%23dots)"/><circle cx="100" cy="80" r="200" fill="%2310b981" opacity="0.08"/><circle cx="1200" cy="800" r="300" fill="%233b82f6" opacity="0.08"/><circle cx="600" cy="450" r="150" fill="%238b5cf6" opacity="0.05"/></svg>')`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Find answers to common questions about my tutoring services, qualifications, and policies
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`bg-white border-2 ${faq.borderColor} rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
            >
              <button
                onClick={() => toggleExpand(faq.id)}
                className="w-full cursor-pointer px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 group"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#1e3557] transition-colors">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {faq.category}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 ml-4 transition-transform duration-300 ${
                    expandedId === faq.id ? 'transform rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-[#1e3557]" />
                </div>
              </button>

              {/* Answer */}
              {expandedId === faq.id && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 animate-slideDown">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-10 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Still have questions?
          </h2>
          <p className="text-gray-700 mb-6">
            Feel free to reach out directly. I'm always happy to discuss your learning goals and how I can help you achieve them.
          </p>
          <button  className="bg-[#1e3557] cursor-pointer hover:bg-[#152848] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg">
            Contact Me
          </button>
        </div>

        {/* Stats Footer */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-gray-300">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">8</p>
            <p className="text-gray-700 font-medium">Common Questions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">24/7</p>
            <p className="text-gray-700 font-medium">Access to Resources</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">100%</p>
            <p className="text-gray-700 font-medium">Satisfaction Guarantee</p>
          </div>
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
    </div>
  );
}