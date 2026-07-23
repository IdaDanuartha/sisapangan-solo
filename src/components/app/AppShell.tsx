"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  PlusCircle,
  RefreshCcw,
  MapPin,
  Map,
  Route,
  History,
  BarChart3,
  Award,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  HelpCircle,
  Package,
  Users,
  Activity
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type Role = "donor" | "volunteer" | "non-consumption" | "monitor" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navByRole: Record<Role, NavItem[]> = {
  donor: [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus", label: "Data Surplus", icon: Package },
    { href: "/app/surplus/recurring", label: "Surplus Rutin", icon: RefreshCcw },
    { href: "/app/history", label: "Riwayat", icon: History },
    // { href: "/app/badges", label: "Badge Saya", icon: Award },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  volunteer: [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus/nearby", label: "Surplus Terdekat", icon: MapPin },
    { href: "/app/pickup/route", label: "Rute Pickup", icon: Route },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  "non-consumption": [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus/nearby", label: "Surplus Terdekat", icon: MapPin },
    { href: "/app/pickup/route", label: "Rute Pickup", icon: Route },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  monitor: [
    { href: "/app/dashboard", label: "Dashboard Ringkasan", icon: LayoutDashboard },
    { href: "/app/impact", label: "Dashboard Dampak", icon: BarChart3 },
    { href: "/app/surplus/nearby", label: "Data Surplus", icon: MapPin },
    { href: "/app/monitoring", label: "Monitoring Aktivitas", icon: Activity },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  admin: [
    { href: "/app/dashboard", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/app/impact", label: "Dashboard Dampak", icon: BarChart3 },
    { href: "/app/users", label: "Kelola Pengguna", icon: Users },
    { href: "/app/drop-off", label: "Manajemen Drop-off", icon: Map },
    { href: "/app/surplus/nearby", label: "Lihat Semua Surplus", icon: MapPin },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/monitoring", label: "Monitoring Aktivitas", icon: Activity },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
};

// Bottom nav shows at most 5 items
const bottomNavByRole: Record<Role, NavItem[]> = {
  donor: [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus", label: "Surplus", icon: Package },
    { href: "/app/surplus/recurring", label: "Rutin", icon: RefreshCcw },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  volunteer: [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus/nearby", label: "Terdekat", icon: MapPin },
    { href: "/app/pickup/route", label: "Rute", icon: Route },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  "non-consumption": [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/surplus/nearby", label: "Terdekat", icon: MapPin },
    { href: "/app/pickup/route", label: "Rute", icon: Route },
    { href: "/app/history", label: "Riwayat", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  monitor: [
    { href: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/app/surplus/nearby", label: "Data", icon: MapPin },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
  admin: [
    { href: "/app/dashboard", label: "Admin", icon: LayoutDashboard },
    { href: "/app/drop-off", label: "Drop-off", icon: Map },
    { href: "/app/surplus/nearby", label: "Surplus", icon: MapPin },
    { href: "/app/history", label: "Transaksi", icon: History },
    { href: "/app/profile", label: "Profil", icon: User },
  ],
};

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-[#E4F0E8] text-[#2F6E4F]"
          : "text-[#5B655D] hover:bg-[#F4F6F3] hover:text-[#2F6E4F]",
      ].join(" ")}
    >
      <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.75} className="shrink-0" />
      <span className="truncate whitespace-nowrap">{item.label}</span>
      {isActive && (
        <ChevronRight
          size={14}
          className="ml-auto text-[#2F6E4F]"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export function AppShell({
  role,
  userName,
  children,
}: {
  role: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const resolvedRole: Role =
    role === "admin" || role === "monitor" || role === "non-consumption" || role === "volunteer"
      ? role
      : "donor";

  const navItems = navByRole[resolvedRole].filter(item => item.href !== "/app/profile");
  const bottomItems = bottomNavByRole[resolvedRole];

  const getIsActive = (href: string) => {
    if (href === "/app/dashboard") {
      return pathname === href;
    }
    if (href === "/app/surplus") {
      return pathname.startsWith("/app/surplus") && !pathname.startsWith("/app/surplus/recurring");
    }
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    setShowConfirmLogout(true);
  }

  async function confirmLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const roleLabels: Record<Role, string> = {
    donor: "Donor",
    volunteer: "Relawan",
    "non-consumption": "Pengelola Non-Konsumsi",
    monitor: "Monitor",
    admin: "Administrator",
  };

  return (
    <div className="flex h-screen bg-[#F4F6F3] overflow-hidden">
      {/* ---- Sidebar (desktop) ---- */}
      <aside
        className={[
          "hidden md:flex flex-col w-60 bg-white border-r border-[#E4F0E8] flex-shrink-0 transition-all duration-200",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#E4F0E8] flex-shrink-0">
          <Link href="/" className="flex items-center">
            <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-[#F4F6F3]">
          <p className="text-sm font-semibold text-[#1B1F1C] truncate">
            {userName}
          </p>
          <p className="text-xs text-[#9AA39C]">{roleLabels[resolvedRole]}</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Navigasi aplikasi">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={getIsActive(item.href)}
            />
          ))}
          <hr className="my-2 border-[#E4F0E8]" />
          <NavLink
            item={{ href: "/app/profile", label: "Pengaturan", icon: Settings }}
            isActive={pathname.startsWith("/app/profile")}
          />
          <NavLink
            item={{ href: "/app/help", label: "Bantuan", icon: HelpCircle }}
            isActive={pathname.startsWith("/app/help")}
          />
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t border-[#F4F6F3] space-y-0.5">
          <Link
            href="/app/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-[#5B655D] hover:bg-[#F4F6F3] transition-colors"
          >
            <Bell size={18} strokeWidth={1.75} />
            Notifikasi
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-[#D14343] hover:bg-[#FAEAEA] transition-colors"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ---- Mobile sidebar overlay ---- */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Menu navigasi mobile"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E4F0E8]">
          <Link href="/" className="flex items-center">
            <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-12 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-[8px] text-[#9AA39C] hover:bg-[#F4F6F3]"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-[#F4F6F3]">
          <p className="text-sm font-semibold text-[#1B1F1C]">{userName}</p>
          <p className="text-xs text-[#9AA39C]">{roleLabels[resolvedRole]}</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={getIsActive(item.href)}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
          <hr className="my-2 border-[#E4F0E8]" />
          <NavLink
            item={{ href: "/app/profile", label: "Pengaturan", icon: Settings }}
            isActive={pathname.startsWith("/app/profile")}
            onClick={() => setSidebarOpen(false)}
          />
          <NavLink
            item={{ href: "/app/help", label: "Bantuan", icon: HelpCircle }}
            isActive={pathname.startsWith("/app/help")}
            onClick={() => setSidebarOpen(false)}
          />
        </nav>
        <div className="px-2 py-3 border-t border-[#F4F6F3]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-[#D14343] hover:bg-[#FAEAEA]"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 bg-white border-b border-[#E4F0E8] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-[8px] text-[#5B655D] hover:bg-[#F4F6F3]"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center">
            <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-9 w-auto object-contain" />
          </Link>
          <Link href="/app/notifications" aria-label="Notifikasi" className="p-2 rounded-[8px] text-[#5B655D] hover:bg-[#F4F6F3]">
            <Bell size={20} />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* ---- Bottom Nav (mobile) ---- */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E4F0E8] z-30 safe-area-bottom"
          aria-label="Navigasi bawah"
        >
          <div className="flex items-center justify-around h-14 xs:h-16">
            {bottomItems.map((item) => {
              const isActive = getIsActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex flex-col items-center gap-0.5 px-1 xs:px-3 py-1.5 rounded-[8px] flex-1 min-w-0 max-w-[72px] transition-colors",
                    isActive ? "text-[#2F6E4F]" : "text-[#9AA39C]",
                  ].join(" ")}
                >
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  <span className="text-[9px] xs:text-[10px] font-medium leading-none truncate w-full text-center">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <Modal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        title="Konfirmasi Keluar"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D]">
            Apakah Anda yakin ingin keluar dari akun SisaPangan Anda?
          </p>
          <div className="flex justify-end gap-3 font-sans">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => setShowConfirmLogout(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmLogout}
            >
              Keluar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
