import React from 'react'
import Image from 'next/image';

const Banner = () => {
  return (
    <section id='Home' className='bg-neutral-900 mt-0'>
      <div className="relative w-full h-[90vh] md:h-[90vh] min-h-[400px] flex flex-col justify-center items-center text-center overflow-hidden">
        {/* Background Image */}
        <Image
          src="/assets/banner/banner.png"
          alt="Background"
          fill
          priority
          className="object-cover object-center absolute inset-0 z-0"
          sizes="100vw"
        />

        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/40 z-5"></div>

        {/* Content Container */}
        <div className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight md:leading-[1.2] mb-4 md:mb-6">
            Learn O and A-Levels live online
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Join structured classes with qualified tutors. Real-time instruction, small groups, and the space to grow at your own pace.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center sm:items-start">
            <button className='bg-white hover:bg-gray-100 cursor-pointer text-black px-6 sm:px-8 md:px-10 py-2.5 md:py-3 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg'>
              Enroll Now
            </button>

            <button className='border-2 border-white hover:bg-white hover:text-black cursor-pointer text-white px-6 sm:px-8 md:px-10 py-2.5 md:py-3 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 transform hover:translate-y-[-2px]'>
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Banner