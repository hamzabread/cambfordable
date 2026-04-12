'use client';
import React from 'react';
import { Star } from 'lucide-react';

export default function StudentsReviews() {
  const reviews = [
    {
      id: 1,
      name: "Sarah J.",
      subject: "O-Levels Mathematics",
      rating: 5,
      review: "I finally stopped memorizing and started understanding. My weekly feedback notes were so specific that I always knew exactly what to improve next.",
    },
    {
      id: 2,
      name: "Ahmed H.",
      subject: "A-Levels Physics",
      rating: 5,
      review: "What helped me most was being able to directly ask questions after class. The personalized quiz reviews made weak areas very obvious and easy to fix.",
    },
    {
      id: 3,
      name: "Emma W.",
      subject: "AI & Machine Learning",
      rating: 5,
      review: "The classes felt personal, not generic. Every homework submission came back with thoughtful comments, and that made a huge difference in my confidence.",
    },
    {
      id: 4,
      name: "Rajesh K.",
      subject: "A-Levels Chemistry",
      rating: 5,
      review: "I used to panic before tests. Now I walk in prepared because the review on each quiz showed me my exact mistakes and how to avoid repeating them.",
    },
    {
      id: 5,
      name: "Fatima A.",
      subject: "O-Levels English",
      rating: 5,
      review: "I loved how approachable the teacher was. I could communicate directly whenever I got stuck, and the feedback felt like real mentorship.",
    },
    {
      id: 6,
      name: "Marcus C.",
      subject: "Deep Learning Specialization",
      rating: 5,
      review: "The teaching is clear, practical, and honest. Instead of just scores, I got personalized comments on every task, which helped me level up quickly.",
    },
    {
      id: 7,
      name: "Noah M.",
      subject: "A-Levels Mathematics",
      rating: 5,
      review: "I really appreciate that the feedback is never copy-paste. Each homework review felt written for me, and it kept me motivated the whole term.",
    },
    {
      id: 8,
      name: "Hira S.",
      subject: "Computer Science",
      rating: 5,
      review: "The direct communication with the teacher made this feel premium. I always got timely guidance and detailed notes after quizzes.",
    },
  ];

  const marqueeReviews = [...reviews, ...reviews];

  return (
    <div className="bg-[#13203a] py-18 px-4 sm:px-6 lg:px-8 overflow-hidden border-y border-[#24385d]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#FBF9F6] mb-4">
            What Our Students Say
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Join hundreds of satisfied students who have achieved their academic goals
          </p>
        </div>

        {/* Marquee */}
        <div className="relative">
          <div className="marquee-track flex gap-6 w-max">
            {marqueeReviews.map((review, idx) => (
              <div
                key={`${review.id}-${idx}`}
                className="w-[320px] sm:w-90 bg-[#111d34] rounded-2xl p-6 shadow-sm border border-[#263758] hover:shadow-[0_18px_35px_rgba(0,0,0,0.38)] transition-all duration-300"
              >
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#f7c95c] text-[#f7c95c]"
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-slate-100 text-sm leading-relaxed mb-6 min-h-23">
                  "{review.review}"
                </p>

                {/* Student Info */}
                <div className="pt-4 border-t border-[#2e4468]">
                  <p className="font-semibold text-[#FBF9F6] text-sm">{review.name}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{review.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-track {
          animation: marqueeScroll 35s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}