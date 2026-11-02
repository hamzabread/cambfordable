"use client";

import { ReactNode, useState } from "react";
import Sidebar from "../Dashboard/Sidebar";
import Header from "../Dashboard/Header";
import type { PortalUser } from "@/lib/portal";

interface PortalLayoutProps {
  user: PortalUser;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  wide?: boolean;
}

export default function PortalLayout({
  user,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  wide = false,
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f6f8fd] text-[#0a1d35]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        role={user.is_admin ? "admin" : user.is_ta ? "ta" : "student"}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen">
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${
              wide ? "max-w-[1720px]" : "max-w-[1540px]"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[#071a32]/55 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
