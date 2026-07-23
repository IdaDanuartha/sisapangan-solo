import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Globe, MessageCircle, Rss, Sprout } from "lucide-react";

export function CtaBannerSection() {
  return (
    <section className="py-16 bg-[#F4F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-[#E4F0E8] border border-[#2F6E4F]/15 px-8 py-12 text-center overflow-hidden">
          {/* Decorative leaf SVGs */}
          <svg
            className="absolute -top-6 -left-4 w-24 h-24 text-[#2F6E4F]/10 pointer-events-none"
            aria-hidden="true"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M10 90 Q30 10 90 10 Q80 50 50 70 Q30 80 10 90Z" />
          </svg>
          <svg
            className="absolute -bottom-6 -right-4 w-28 h-28 text-[#2F6E4F]/10 pointer-events-none rotate-180"
            aria-hidden="true"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M10 90 Q30 10 90 10 Q80 50 50 70 Q30 80 10 90Z" />
          </svg>

          {/* Center icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm mb-5 mx-auto">
            <Sprout size={28} className="text-[#2F6E4F]" aria-label="tumbuh bersama" />
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold text-[#1E4A35] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bergabunglah dengan Komunitas Kami yang Berkembang!
          </h2>
          <p className="text-[#5B655D] text-sm max-w-lg mx-auto mb-7 leading-relaxed">
            Jadilah bagian dari gerakan penyelamatan pangan di Solo Raya.
            Daftarkan diri sekarang dan mulai berkontribusi hari ini.
          </p>

          <Link href="/register">
            <Button
              variant="primary"
              size="lg"
              id="cta-banner-main"
              className="bg-[#2F6E4F] hover:bg-[#1E4A35]"
            >
              Gabung Sekarang
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const footerLinks = {
  quickLinks: [
    { label: "Beranda", href: "#beranda" },
    { label: "Tentang Kami", href: "#tentang" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "FAQ", href: "#faq" },
  ],
  companyProfile: [
    { label: "Tim REGEX", href: "#" },
    { label: "BYTESFEST 2026", href: "#" },
    { label: "Solo Raya", href: "#" },
    { label: "Kontak", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1B1F1C] text-[#9AA39C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img
                src="/images/logo_full.png"
                alt="SisaPangan Solo"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-xs leading-relaxed mb-6">
              Platform koordinasi penyelamatan pangan untuk kawasan Solo Raya.
              Dibangun oleh TIM REGEX untuk BYTESFEST 2026.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <p className="text-xs text-white/50 mr-1">Follow Us</p>
              {[
                { Icon: Globe, label: "Website" },
                { Icon: MessageCircle, label: "Twitter / X" },
                { Icon: Rss, label: "Blog" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-[#2F6E4F] flex items-center justify-center transition-colors"
                >
                  <Icon size={14} className="text-[#9AA39C] hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">Quick Links</p>
            <ul className="space-y-2.5">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#2F6E4F] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Profile */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">Company Profile</p>
            <ul className="space-y-2.5">
              {footerLinks.companyProfile.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#2F6E4F] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white text-sm font-semibold mb-4">Contact</p>
            <ul className="space-y-2.5 text-xs">
              <li>TIM REGEX</li>
              <li>BYTESFEST 2026</li>
              <li>Solo Raya, Jawa Tengah</li>
              <li>
                <a
                  href="mailto:hello@sisapangan.id"
                  className="hover:text-white transition-colors"
                >
                  hello@sisapangan.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2026 SisaPangan Solo · TIM REGEX. Dibuat untuk BYTESFEST 2026.</p>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
