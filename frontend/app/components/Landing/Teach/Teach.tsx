import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MaskedHeading, Reveal } from "../../Motion/Motion";

const Teach = () => {
  return (
    <>
      <div className="relative bg-[#FBF9F6] border-b border-[#e6e0d8] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(95,133,185,0.12),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(46,169,158,0.12),transparent_40%)]" />
        <div className="relative max-w-[1350px] px-5 md:px-8 mx-auto grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr] gap-8 lg:gap-12 items-center">
          <Reveal className="flex z-10 flex-col gap-4 max-w-[760px] rounded-3xl border border-[#dfd6ca] bg-[#FBF9F6] p-6 sm:p-10 shadow-[0_15px_50px_rgba(30,53,87,0.09)]">
            <MaskedHeading
              as="h2"
              trigger="view"
              text="Learn directly with your teacher, every week"
              underline="every week"
              delay={0.2}
              className="text-4xl sm:text-[52px] leading-[1.1] tracking-[-0.03em] text-[#132848] font-semibold"
            />
            <p className="text-slate-700 text-[17px] font-medium leading-relaxed max-w-[62ch]">
              We built Cambfordable to keep learning personal and practical.
              You can directly communicate with your teacher, ask questions in
              real time, and get detailed personalized reviews on every
              homework and quiz. That means no generic feedback, only clear
              guidance tailored to your progress.
            </p>
            <Link href="/about" className="px-5 py-2.5 w-fit mt-4 text-[17px] font-semibold bg-[#1E3557] hover:bg-[#152a48] transition text-[#FBF9F6] rounded-lg shadow-md">
              Learn more
            </Link>
          </Reveal>

          <div className="relative mx-auto w-full max-w-[620px]">
            <Reveal variant="pop" delay={0.5} className="absolute -left-4 top-10 z-10">
              <div className="h-16 w-16 rounded-2xl bg-[#f4cd87]/80" />
            </Reveal>
            <Reveal variant="pop" delay={0.65} className="absolute -right-4 bottom-14 z-10">
              <div className="h-20 w-20 rounded-3xl bg-[#c8d9f0]/90" />
            </Reveal>
            <Reveal variant="maskLeft" duration={1.1} className="rounded-[30px] border border-[#d8cec1] bg-gradient-to-br from-[#f5efe6] via-[#edf2f8] to-[#e5edf7] p-4 shadow-[0_20px_50px_rgba(19,40,72,0.14)]">
              <Image
                width={600}
                height={1000}
                src="/assets/teach/teach.png"
                alt="Teacher discussing lesson progress"
                className="w-full rounded-3xl object-cover"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </>
  );
};

export default Teach;
