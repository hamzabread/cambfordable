"use client";

import React from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE, MaskedHeading } from '../../Motion/Motion';

const Banner = () => {
  const reduced = useReducedMotion();
  // The heading leads; supporting copy and actions follow once it has landed.
  const follow = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay: reduced ? 0 : delay },
  });

  return (
    <section id='Home' className='bg-[#0c1425] mt-0'>
      <div className="relative w-full h-[55vh] md:h-[50vh] min-h-[420px] flex flex-col justify-center items-center text-center overflow-hidden">
        {/* The photo settles into place behind the heading. */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: reduced ? 1 : 1.12, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        >
          <Image
            src="/assets/banner/banner.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>

        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1323]/90 via-[#0f1f3f]/55 to-[#11244d]/85 z-5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(251,249,246,0.18),transparent_45%)] z-5" />

        <div className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
          <MaskedHeading
            text="Learn O and A-Levels"
            underline="O and A-Levels"
            delay={0.25}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight md:leading-[1.15] tracking-[-0.03em] mb-5 md:mb-7"
          />

          <motion.p
            {...follow(1.35)}
            className="reveal text-base sm:text-lg md:text-xl lg:text-2xl text-slate-100 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed"
          >
            Join structured O and A-Levels sessions, direct teacher support, and personalized quiz and homework feedback every week.
          </motion.p>

          <motion.div
            {...follow(1.55)}
            className="reveal flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center sm:items-start"
          >
            <Link href='/signup' className='bg-[#FBF9F6] hover:bg-[#f3efe9] text-[#12213b] px-6 sm:px-8 md:px-10 py-2.5 md:py-3 rounded-lg text-base md:text-lg font-semibold transition duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg'>
              Enroll Now
            </Link>

            <Link href='/about' className='border-2 border-[#FBF9F6] hover:bg-[#FBF9F6] hover:text-[#12213b] text-[#FBF9F6] px-6 sm:px-8 md:px-10 py-2.5 md:py-3 rounded-lg text-base md:text-lg font-semibold transition duration-300 hover:-translate-y-0.5'>
              Learn More
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Banner
