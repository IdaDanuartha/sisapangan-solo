"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#dampak", label: "Dampak" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center font-bold"
          aria-label="SisaPangan Solo"
        >
          <img src="/images/logo_full.png" alt="SisaPangan Logo" className="h-[56px] w-auto object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi utama">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={[
                "text-sm font-medium transition-colors hover:text-[#2F6E4F]",
                scrolled ? "text-[#5B655D]" : "text-[#2F6E4F]",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth CTA */}
        {mounted && isLoggedIn !== null ? (
          isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/app/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Daftar
                </Button>
              </Link>
            </div>
          )
        ) : (
          <div className="hidden md:flex items-center gap-2 opacity-0">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
            <Button variant="primary" size="sm">
              Daftar
            </Button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-[8px] text-[#2F6E4F] hover:bg-[#E4F0E8] transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E4F0E8] px-4 pb-4 pt-2 shadow-lg">
          <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#5B655D] hover:bg-[#F4F6F3] hover:text-[#2F6E4F] transition-colors"
              >
                {link.label}
              </a>
            ))}
            {mounted && isLoggedIn !== null ? (
              isLoggedIn ? (
                <div className="mt-3 pt-3 border-t border-[#F4F6F3]">
                  <Link href="/app/dashboard" className="w-full">
                    <Button variant="primary" size="sm" className="w-full" onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#F4F6F3]">
                  <Link href="/login" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setMenuOpen(false)}>
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full" onClick={() => setMenuOpen(false)}>
                      Daftar
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#F4F6F3] opacity-0">
                <Button variant="secondary" size="sm" className="w-full">
                  Masuk
                </Button>
                <Button variant="primary" size="sm" className="w-full">
                  Daftar
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
