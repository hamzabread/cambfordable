'use client';
import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentsReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      subject: "O-Levels Mathematics",
      rating: 5,
      review: "Exceptional teaching quality! The instructor explains complex concepts in such a simple and engaging way. I improved from a B to an A* in just 3 months.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      id: 2,
      name: "Ahmed Hassan",
      subject: "A-Levels Physics",
      rating: 5,
      review: "Best decision I made for my A-Levels. The structured approach and personalized feedback really helped me understand the core concepts deeply.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      id: 3,
      name: "Emma Williams",
      subject: "AI & Machine Learning",
      rating: 5,
      review: "The AI course was incredibly well-structured and practical. I learned so much in a short time and feel confident applying these concepts professionally.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    },
    {
      id: 4,
      name: "Rajesh Kumar",
      subject: "A-Levels Chemistry",
      rating: 5,
      review: "Outstanding instructor! Clear explanations, patient with questions, and always willing to go the extra mile. My grades have improved significantly.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    },
    {
      id: 5,
      name: "Fatima Al-Mansouri",
      subject: "O-Levels English",
      rating: 5,
      review: "I was struggling with English, but this tutor made it so interesting and manageable. The one-on-one sessions really made all the difference!",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      id: 6,
      name: "Marcus Chen",
      subject: "Deep Learning Specialization",
      rating: 5,
      review: "Highly knowledgeable and engaging teaching style. The course content is comprehensive and up-to-date with industry standards. Highly recommended!",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
  };

  const goToSlide = (index:number) => {
    setCurrentIndex(index);
  };

  // Get visible slides (showing 3 cards on desktop, 1 on mobile)
  const getVisibleSlides = () => {
    const visibleCount = 3;
    const slides = [];
    for (let i = 0; i < visibleCount; i++) {
      slides.push(reviews[(currentIndex + i) % reviews.length]);
    }
    return slides;
  };

  return (
    <div className="bg-[#E8EAEE] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            What My Students Say
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Join hundreds of satisfied students who have achieved their academic goals
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Reviews Grid - Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getVisibleSlides().map((review, idx) => (
              <div
                key={review.id}
                className="bg-[#F5F7FA] rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:translate-y-[-4px] flex flex-col animate-fadeIn"
              >
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-gray-800 text-gray-800"
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1">
                  "{review.review}"
                </p>

                {/* Student Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {review.subject}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute cursor-pointer left-0 top-1/2 transform -translate-y-1/2 -translate-x-16 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-all duration-300 shadow-lg hidden lg:flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute cursor-pointer right-0 top-1/2 transform -translate-y-1/2 translate-x-16 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-all duration-300 shadow-lg hidden lg:flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Mobile Navigation Buttons */}
          <div className="flex lg:hidden justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-all duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-all duration-300"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dots Pagination */}
        <div className="flex justify-center gap-2 mt-10">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gray-900 w-8'
                  : 'bg-gray-400 w-2 hover:bg-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-12 border-t border-gray-300">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">500+</p>
            <p className="text-gray-700 font-medium">Students Taught</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">4.9★</p>
            <p className="text-gray-700 font-medium">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">99%</p>
            <p className="text-gray-700 font-medium">Pass Rate</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}