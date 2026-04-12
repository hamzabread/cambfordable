import React from "react";
import Image from "next/image";

const Teach = () => {
  return (
    <>
      <div className="relative bg-[#FBF9F6] border-b border-[#e6e0d8] py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(95,133,185,0.12),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(46,169,158,0.12),transparent_40%)]" />
        <div className="relative max-w-[1350px] px-5 md:px-8 mx-auto grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr] gap-8 items-center">
          <div className="flex z-10 flex-col gap-3 max-w-[760px] rounded-3xl border border-[#dfd6ca] bg-[#FBF9F6] p-6 sm:p-8 shadow-[0_15px_50px_rgba(30,53,87,0.09)]">
            <p className="text-[15px] tracking-[0.16em] uppercase text-[#1E3557] font-bold">How we teach</p>
            <h2 className="text-4xl sm:text-[55px] leading-10 sm:leading-15 text-[#132848] font-semibold">
              Learn directly with your teacher, every week
            </h2>
            <p className="text-slate-700 text-[17px] font-medium leading-relaxed">
              We built Cambfordable to keep learning personal and practical.
              You can directly communicate with your teacher, ask questions in
              real time, and get detailed personalized reviews on every
              homework and quiz. That means no generic feedback, only clear
              guidance tailored to your progress.
            </p>
            <button className="p-4 py-2 w-fit mt-6 text-[18px] bg-[#1E3557] hover:bg-[#152a48] transition text-[#FBF9F6] rounded-md shadow-md">
              Learn more
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] rounded-[30px] border border-[#d8cec1] bg-gradient-to-br from-[#f5efe6] via-[#edf2f8] to-[#e5edf7] p-4 shadow-[0_20px_50px_rgba(19,40,72,0.14)]">
            <div className="absolute -left-4 top-10 h-16 w-16 rounded-2xl bg-[#f4cd87]/80" />
            <div className="absolute -right-4 bottom-14 h-20 w-20 rounded-3xl bg-[#c8d9f0]/90" />
            <Image
              width={600}
              height={1000}
              src="/assets/teach/teach.png"
              alt="Teacher discussing lesson progress"
              className="w-full rounded-3xl object-cover"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Teach;
