"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CircleHelp,
  FileCheck2,
  ChartNoAxesColumnIncreasing,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Settings,
  X,
} from "lucide-react";

// At lg and up the sidebar is always on screen; below that it's a drawer.
const DESKTOP = "(min-width: 1024px)";
const subscribeToWidth = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  role?: "admin" | "ta" | "student";
}

const studentMenu = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Courses", icon: GraduationCap, href: "/courses" },
  { label: "Assignments", icon: FileCheck2, href: "/homework" },
  { label: "Quizzes", icon: BookOpen, href: "/quizzes" },
  { label: "Results", icon: ChartNoAxesColumnIncreasing, href: "/results" },
  { label: "Messages", icon: MessageSquareText, href: "/messages" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
];

// Staff don't have results of their own; their work is on these pages.
const adminMenu = [
  { label: "Admin dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Assignments", icon: FileCheck2, href: "/homework" },
  { label: "Quizzes", icon: BookOpen, href: "/quizzes" },
  { label: "Messages", icon: MessageSquareText, href: "/messages" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
];

const taMenu = [
  { label: "Grading", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Assignments", icon: FileCheck2, href: "/homework" },
  { label: "Quizzes", icon: BookOpen, href: "/quizzes" },
  { label: "Messages", icon: MessageSquareText, href: "/messages" },
  { label: "Schedule", icon: CalendarDays, href: "/schedule" },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, role = "student" }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = role === "admin" ? adminMenu : role === "ta" ? taMenu : studentMenu;
  const desktop = useSyncExternalStore(subscribeToWidth, () => window.matchMedia(DESKTOP).matches, () => true);
  // A closed drawer is off screen; keep its links out of the tab order too.
  const hidden = !desktop && !sidebarOpen;

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <aside
      inert={hidden}
      aria-hidden={hidden || undefined}
      className={`fixed inset-y-0 left-0 z-50 flex w-[252px] shrink-0 flex-col bg-[#081b33] px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-7 flex items-start justify-between px-1">
        <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0866ef]">
            <GraduationCap className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[17px] font-bold tracking-tight">Cambfordable</span>
            <span className="block text-xs font-medium text-slate-300">Learning without limits</span>
          </span>
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {role === "student" && (
        <Link
          href="/contact"
          onClick={() => setSidebarOpen(false)}
          className="mb-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0866ef] text-sm font-bold shadow-lg shadow-blue-950/20 transition hover:bg-[#075bda]"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Contact admissions
        </Link>
      )}

      <nav className="space-y-1" aria-label="Portal navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#0866ef] text-white shadow-md shadow-blue-950/20"
                  : "text-slate-300 hover:bg-white/7 hover:text-white"
              }`}
            >
              <Icon className="h-[17px] w-[17px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/profile"
          onClick={() => setSidebarOpen(false)}
          className={`mb-1 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
            pathname === "/profile"
              ? "bg-[#0866ef] text-white"
              : "text-slate-300 hover:bg-white/7 hover:text-white"
          }`}
        >
          <Settings className="h-[17px] w-[17px]" />
          Profile and settings
        </Link>
        <Link
          href="/contact"
          onClick={() => setSidebarOpen(false)}
          className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/7 hover:text-white"
        >
          <CircleHelp className="h-[17px] w-[17px]" />
          Help
        </Link>
      </div>
    </aside>
  );
}
