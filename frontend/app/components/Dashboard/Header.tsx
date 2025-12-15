"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Settings, User, LogOut, ChevronDown } from "lucide-react";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
}

interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
}

const Header = ({ user }: HeaderProps) => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  if (!user) {
    return (
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left - Empty for now */}
        <div></div>

        {/* Right - User Menu & Notifications */}
        <div className="flex items-center gap-6">
          {/* Notification Bell */}
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <Settings className="w-6 h-6" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200"></div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user.username.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown className="w-4 h-4 text-slate-600" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 transition text-sm">
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 transition text-sm">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-slate-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button (Top Right) */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;