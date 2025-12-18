"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  User,
  LogOut,
  X,
  Menu,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "My Courses", icon: BookOpen, href: "/courses" },
    { label: "Class Schedule", icon: Calendar, href: "/schedule" },
    { label: "Quizzes", icon: BarChart3, href: "/quizzes" },
    { label: "Homework", icon: FileText, href: "/homework" },
    { label: "Messages", icon: MessageSquare, href: "/messages" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // Get current page label for breadcrumb
  const getCurrentLabel = () => {
    const item = menuItems.find((m) => m.href === pathname);
    return item?.label || "Dashboard";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-linear-to-b from-slate-900 to-slate-800 text-white flex-col h-screen shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Cambridge</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                  isActive
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Breadcrumb Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-40 ">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-slate-900">
              {getCurrentLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-xl lg:hidden z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Close Button */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cambfordable</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                  isActive
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;