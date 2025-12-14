import React from "react";
import Image from "next/image";

const Teach = () => {
  return (
    <>
      <div className=" relative bg-[#FBFDFF]">
        <div className="max-w-[1300px] px-5 mx-auto flex flex-col md:flex-row justify-between gap-5 items-center py-10">
          <div className="flex z-10 flex-col gap-2.5 max-w-[600px]">
            <p className="text-[16px] text-black font-bold">How we teach</p>
            <h2 className="text-4xl sm:text-[55px] leading-10 sm:leading-15 text-black font-semibold">
              One on one sessions to learn online
            </h2>
            <p className="text-black text-[17px] font-medium">
              We built Cambfordable to cut through the noise. No clutter. No
              distraction. Just clear instruction, thoughtful pacing, and real
              connection with your tutors. Enjoy one-on-one sessions that
              prioritize your learning style and pace.
            </p>
            <button className="p-4 py-2 w-fit mt-6 text-[18px] bg-[#1E3557] text-white rounded-md">
              Learn more
            </button>
          </div>
          <Image
            width={600}
            height={1000}
            src="/assets/teach/teach.png"
            alt="people"
            className="shrink"
          />
        </div>
      </div>
    </>
  );
};

export default Teach;
