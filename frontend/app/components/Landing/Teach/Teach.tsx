import React from "react";
import Image from "next/image";

const Teach = () => {
  return (
    <>
      <div className=" relative bg-[#FBFDFF] border-gray-300 border-b">
        <div className="max-w-325 px-5 mx-auto flex flex-col md:flex-row justify-between gap-5 items-center py-10">
          <div className="flex z-10 flex-col gap-2.5 max-w-150">
            <p className="text-[16px] text-black font-bold">How we teach</p>
            <h2 className="text-4xl sm:text-[55px] leading-10 sm:leading-15 text-black font-semibold">
              Learn directly with your teacher, every week
            </h2>
            <p className="text-black text-[17px] font-medium">
              We built Cambfordable to keep learning personal and practical.
              You can directly communicate with your teacher, ask questions in
              real time, and get detailed personalized reviews on every
              homework and quiz. That means no generic feedback, only clear
              guidance tailored to your progress.
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
