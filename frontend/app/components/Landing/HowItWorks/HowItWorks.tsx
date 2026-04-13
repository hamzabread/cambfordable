'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const HowItWorks = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlayStateChange = () => {
    setIsPlaying(videoRef.current ? !videoRef.current.paused : false);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">See It In Action</span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cambfordable</span> Works
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Learn how to leverage our platform to deliver engaging online courses and connect with learners worldwide
          </p>
        </div>

        {/* Video Container */}
        <div className="relative group">
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-1000 -z-10"></div>
          
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            {/* Video */}
            <video
              ref={videoRef}
              className="w-full h-auto"
              onPlay={handlePlayStateChange}
              onPause={handlePlayStateChange}
            >
              <source src="/assets/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play Button Overlay (shows when paused) */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50 transition cursor-pointer group/play"
                onClick={togglePlayPause}
              >
                <div className="bg-white rounded-full p-6 transform group-hover/play:scale-110 transition duration-300 shadow-2xl">
                  <Play className="w-12 h-12 text-blue-600 fill-blue-600" />
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transform translate-y-12 group-hover:translate-y-0 transition duration-300">
              <div className="flex items-center justify-between">
                <button
                  onClick={togglePlayPause}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="text-sm font-medium">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span className="text-sm font-medium">Play</span>
                    </>
                  )}
                </button>
                
                <div className="text-white text-sm">
                  <span className="opacity-75">Watch how it works</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Below Video */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Enroll in Courses</h3>
                <p className="text-sm text-gray-600 mt-1">Browse and enroll in courses that match your learning goals</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-100">
                  <span className="text-indigo-600 font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Learn Daily</h3>
                <p className="text-sm text-gray-600 mt-1">Attend live online classes, complete assignments, and take quizzes</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Get Feedback</h3>
                <p className="text-sm text-gray-600 mt-1">Receive personalized feedback on homeworks and track your progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
