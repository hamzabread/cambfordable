'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { MaskedHeading, Reveal, Stagger, StaggerItem } from '../../Motion/Motion';

const steps = [
  {
    title: 'Enroll in Courses',
    body: 'Browse and enroll in courses that match your learning goals',
    tone: 'bg-[#e3ecf8] text-[#1E3557]',
  },
  {
    title: 'Learn Daily',
    body: 'Attend live online classes, complete assignments, and take quizzes',
    tone: 'bg-[#dbeefa] text-[#127fba]',
  },
  {
    title: 'Get Feedback',
    body: 'Receive personalized feedback on homeworks and track your progress',
    tone: 'bg-[#fbecc9] text-[#8a5a00]',
  },
];

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
    <section className="py-16 md:py-24 bg-[#eef4fb] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(27,150,216,0.10),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(244,205,135,0.18),transparent_45%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <MaskedHeading
            as="h2"
            trigger="view"
            text="How Cambfordable Works"
            className="text-4xl md:text-5xl font-bold text-[#132848] tracking-[-0.02em] mb-4"
          />
          <Reveal delay={0.35}>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              See how live classes, homework and personal feedback fit together on Cambfordable.
            </p>
          </Reveal>
        </div>

        <div className="relative group">
          <Reveal variant="window" duration={1.1} amount={0.35}>
            <div className="relative bg-[#0c1425] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(19,40,72,0.25)]">
              <video
                ref={videoRef}
                className="w-full h-auto"
                preload="metadata"
                onPlay={handlePlayStateChange}
                onPause={handlePlayStateChange}
              >
                <source src="/assets/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {!isPlaying && (
                <button
                  type="button"
                  aria-label="Play the introduction video"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition group/play"
                  onClick={togglePlayPause}
                >
                  <span className="bg-white rounded-full p-6 transition duration-300 ease-out group-hover/play:scale-110 shadow-2xl">
                    <Play className="w-12 h-12 text-[#1E3557] fill-[#1E3557]" />
                  </span>
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 translate-y-12 group-hover:translate-y-0 group-focus-within:translate-y-0 transition duration-300">
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3557] hover:bg-[#152a48] text-white rounded-lg transition duration-200"
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

                  <span className="text-white/75 text-sm">Watch how it works</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Stagger as="ol" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" gap={0.1} delay={0.15}>
            {steps.map((step, index) => (
              <StaggerItem
                as="li"
                key={step.title}
                className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-[0_6px_20px_rgba(19,40,72,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(19,40,72,0.12)]"
              >
                <span className={`flex items-center justify-center h-10 w-10 shrink-0 rounded-lg font-bold ${step.tone}`}>
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
