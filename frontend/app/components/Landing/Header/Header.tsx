"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname !== "/login" && pathname !== "/signup";

  return (
    <>
      <header className="bg-[#1E3557] top-0 z-20 w-full left-0 p-2.5 pb-[23px] pt-[22px] md:py-[30px] md:px-[60px]">
        {/* Desktop Nav */}
        <nav className="hidden md:flex justify-between items-center">
          <Link href="/">
            <p className="text-white font-bold text-2xl">Cambfordable</p>
          </Link>
          {isHome && (
            <div className="flex items-center gap-10">
              <ul className="flex gap-10">
                <li className="group relative text-white cursor-pointer">
                  <Link href="/" className="relative font-light">
                    Home
                  </Link>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
                </li>
                <li className="group relative text-white cursor-pointer">
                  <a href="/" className="relative font-light">
                    Our Teachers
                  </a>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
                </li>
                <li className="group relative text-white cursor-pointer">
                  <Link href="/contact" className="relative font-light">
                    Contact
                  </Link>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
                </li>
                <li className="group relative text-white cursor-pointer">
                  <Link href="/about" className="relative font-light">
                    More
                  </Link>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
                </li>
              </ul>
            </div>
          )}
          {isHome && (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="p-3 py-1.5 cursor-pointer text-[18px] bg-white text-black rounded-md">
                  Login
                </button>
              </Link>

              <button className="p-4 py-1.5 cursor-pointer text-[18px] border border-white/50 text-white rounded-md">
                Join
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Nav */}
        <nav className="flex md:hidden justify-between items-center">
          <a href="/">
            <p className="text-white font-semibold text-xl">Cambfordable</p>
          </a>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                fill="none"
                viewBox="0 0 36 36"
              >
                <path
                  d="M31.5057 18C31.5057 18.298 31.3873 18.5838 31.1766 18.7945C30.9659 19.0052 30.6801 19.1236 30.3821 19.1236H5.66337C5.36538 19.1236 5.0796 19.0052 4.86888 18.7945C4.65817 18.5838 4.53979 18.298 4.53979 18C4.53979 17.702 4.65817 17.4163 4.86888 17.2055C5.0796 16.9948 5.36538 16.8765 5.66337 16.8765H30.3821C30.6801 16.8765 30.9659 16.9948 31.1766 17.2055C31.3873 17.4163 31.5057 17.702 31.5057 18ZM5.66337 10.135H30.3821C30.6801 10.135 30.9659 10.0166 31.1766 9.80589C31.3873 9.59518 31.5057 9.30939 31.5057 9.0114C31.5057 8.71341 31.3873 8.42762 31.1766 8.21691C30.9659 8.00619 30.6801 7.88782 30.3821 7.88782H5.66337C5.36538 7.88782 5.0796 8.00619 4.86888 8.21691C4.65817 8.42762 4.53979 8.71341 4.53979 9.0114C4.53979 9.30939 4.65817 9.59518 4.86888 9.80589C5.0796 10.0166 5.36538 10.135 5.66337 10.135ZM30.3821 25.8651H5.66337C5.36538 25.8651 5.0796 25.9835 4.86888 26.1942C4.65817 26.4049 4.53979 26.6907 4.53979 26.9887C4.53979 27.2867 4.65817 27.5724 4.86888 27.7832C5.0796 27.9939 5.36538 28.1122 5.66337 28.1122H30.3821C30.6801 28.1122 30.9659 27.9939 31.1766 27.7832C31.3873 27.5724 31.5057 27.2867 31.5057 26.9887C31.5057 26.6907 31.3873 26.4049 31.1766 26.1942C30.9659 25.9835 30.6801 25.8651 30.3821 25.8651Z"
                  fill="#FFF"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Offcanvas */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isOpen ? "" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-[#1e3557] transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <p className="text-white font-bold text-xl">Cambfordable</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-6">
              <li className="group relative text-white cursor-pointer">
                <Link
                  href="/"
                  className="relative font-light"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
              </li>
              <li className="group relative text-white cursor-pointer">
                <a
                  href="/"
                  className="relative font-light"
                  onClick={() => setIsOpen(false)}
                >
                  Our Teachers
                </a>
                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
              </li>
              <li className="group relative text-white cursor-pointer">
                <Link
                  href="/contact"
                  className="relative font-light"
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </Link>
                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
              </li>
              <li className="group relative text-white cursor-pointer">
                <a
                  href="/about"
                  className="relative font-light"
                  onClick={() => setIsOpen(false)}
                >
                  More
                </a>
                <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-b border-gray-600">
              <div className="flex flex-col gap-3 absolute bottom-2.5 left-2.5 right-2.5">
                <button className="w-full bg-white rounded-md px-5 py-3 text-[#1e3557] font-semibold">
                  Login
                </button>
                <button className="w-full border border-white/50 text-white rounded-md px-5 py-3 font-semibold">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
