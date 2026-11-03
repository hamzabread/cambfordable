"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import type { PortalUser } from "@/lib/portal";
import { logout } from "@/lib/auth";
import NotificationMenu from "../Portal/NotificationMenu";

type HeaderUser = Pick<PortalUser, "username" | "email"> & Partial<PortalUser>;

interface HeaderProps {
  user: HeaderUser | null;
  onMenuToggle: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const globalDestinations = [
  { terms: ["courses", "classes"], href: "/courses" },
  { terms: ["assignments", "homework"], href: "/homework" },
  { terms: ["quizzes", "tests"], href: "/quizzes" },
  { terms: ["schedule", "calendar", "live"], href: "/schedule" },
  { terms: ["messages", "chat"], href: "/messages" },
  { terms: ["profile", "settings", "account", "password"], href: "/profile" },
  { terms: ["results", "grades", "marks"], href: "/results" },
];

// A page name only wins when the search is clearly that word ("quiz",
// "quizzes"); anything else, including single letters, searches courses.
function destinationFor(query: string) {
  if (query.length < 3) return undefined;
  return globalDestinations.find((item) =>
    item.terms.some((term) => term.startsWith(query) || query === term.replace(/s$/, "")),
  );
}

export default function Header({
  user,
  onMenuToggle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search courses, assignments...",
}: HeaderProps) {
  const router = useRouter();
  const [internalSearch, setInternalSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<"profile" | "notifications" | null>(null);
  const profileOpen = openMenu === "profile";
  const setProfileOpen = (next: boolean | ((open: boolean) => boolean)) =>
    setOpenMenu((current) => {
      const value = typeof next === "function" ? next(current === "profile") : next;
      return value ? "profile" : current === "profile" ? null : current;
    });
  const menusRef = useRef<HTMLDivElement>(null);
  const value = searchValue ?? internalSearch;

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menusRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const setValue = (nextValue: string) => {
    if (onSearchChange) onSearchChange(nextValue);
    else setInternalSearch(nextValue);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (onSearchChange) return;
    const query = value.trim().toLowerCase();
    if (!query) return;
    const destination = destinationFor(query);
    router.push(destination?.href ?? `/courses?search=${encodeURIComponent(value.trim())}`);
  };

  const handleLogout = () => logout();

  const displayName = user?.full_name || user?.username || "Student";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center border-b border-[#e5eaf2] bg-white px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuToggle}
        className="mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/dashboard" className="flex h-10 shrink-0 items-center text-base font-bold tracking-tight text-[#13253e] sm:text-lg">
        Academic Portal
      </Link>

      <form onSubmit={handleSearch} className="relative ml-auto mr-2 hidden w-full max-w-[420px] sm:block lg:mx-auto">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search portal"
          className="h-10 w-full rounded-full border border-[#e2e8f0] bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <div ref={menusRef} className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
        <NotificationMenu
          open={openMenu === "notifications"}
          onOpenChange={(next) => setOpenMenu(next ? "notifications" : null)}
        />
        <Link href="/messages" aria-label="Messages" className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#0866ef] sm:flex">
          <MessageSquare className="h-[18px] w-[18px]" />
        </Link>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-10 items-center gap-2 rounded-lg px-1 transition hover:bg-slate-100"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#075bc7] ring-2 ring-white">
              {initials || "S"}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <UserRound className="h-4 w-4" /> Profile
                </Link>
                <Link href="/profile#security" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Settings className="h-4 w-4" /> Change password
                </Link>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
