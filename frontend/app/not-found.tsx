import Link from "next/link";
import Header from "./components/Landing/Header/Header";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[80vh] items-center justify-center bg-[#FBF9F6] px-4">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0866ef]">Error 404</p>
          <h1 className="mt-2 text-3xl font-bold text-[#162842]">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-slate-600">
            The link may be old or mistyped. Try one of these instead.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-lg bg-[#1e3557] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152848]">
              Home page
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-[#1e3557] px-5 py-2.5 text-sm font-semibold text-[#1e3557] hover:bg-white">
              Student portal
            </Link>
            <Link href="/contact" className="rounded-lg px-5 py-2.5 text-sm font-semibold text-[#1e3557] underline">
              Contact us
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
