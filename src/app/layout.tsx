import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SisaPangan Solo | Platform Penyelamatan Pangan Solo Raya",
    template: "%s | SisaPangan Solo",
  },
  description:
    "SisaPangan Solo menghubungkan donor pangan (UMKM, restoran, ritel), relawan penyelamat makanan, dan penerima manfaat untuk mengurangi pemborosan makanan (food waste) di Solo Raya.",
  keywords: [
    "food rescue Solo",
    "penyelamatan pangan Surakarta",
    "food waste Solo Raya",
    "donasi makanan Solo",
    "relawan pangan Solo",
    "berbagi makanan Solo",
    "kurangi sampah makanan",
  ],
  authors: [{ name: "SisaPangan Solo Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "SisaPangan Solo | Platform Penyelamatan Pangan Solo Raya",
    description:
      "Hubungkan donor pangan, relawan, dan penerima manfaat untuk meminimalkan food waste di kawasan Solo Raya secara aman dan terpantau.",
    url: "/",
    siteName: "SisaPangan Solo",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SisaPangan Solo | Platform Penyelamatan Pangan Solo Raya",
    description:
      "Donasikan makanan surplus, koordinasikan relawan, dan salurkan ke masyarakat yang membutuhkan di Solo Raya.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
