import Nav from "../components/Portfolio/Nav";
import Hero from "../components/Portfolio/hero/Hero";
import About from "../components/Portfolio/About";
import Experience from "../components/Portfolio/Experience";
import Projects from "../components/Portfolio/Projects";
import Certifications from "../components/Portfolio/Certifications";
import Skills from "../components/Portfolio/Skills";
import Play from "../components/Portfolio/Play";
import Contact from "../components/Portfolio/Contact";
import Cursor from "../components/Portfolio/Cursor";
import SmoothScroll from "../components/Portfolio/SmoothScroll";

export default function MeetTheDeveloper() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#09080f] text-white">
      <SmoothScroll />
      <Cursor />
      <Nav />
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Certifications />
      <Skills />
      <Play />
      <Contact />
    </main>
  );
}