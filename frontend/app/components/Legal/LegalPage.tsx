import { ReactNode } from "react";
import Header from "../Landing/Header/Header";
import Footer from "../Landing/Footer/Footer";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-[#FBF9F6] px-4 py-14 sm:px-6">
        <article className="mx-auto max-w-3xl rounded-2xl border border-[#e5ddd2] bg-white p-6 text-slate-700 shadow-sm sm:p-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#162842] [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-7 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          <h1 className="text-3xl font-bold text-[#162842]">{title}</h1>
          <p className="!mt-2 text-sm text-slate-500">Last updated {updated}</p>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
