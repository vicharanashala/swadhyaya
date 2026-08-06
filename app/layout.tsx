import type { Metadata, Viewport } from "next";
import { DM_Sans, Lexend, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/chrome/TopNav";
import { SideRail } from "@/components/chrome/SideRail";
import { MobileNav } from "@/components/chrome/MobileNav";
import { A11ySettings } from "@/components/chrome/A11ySettings";
import { GlobalProctorBanner } from "@/components/proctor/GlobalProctorBanner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif",
});

// Lexend — used as the accessibility-friendly fallback when the user
// toggles "Dyslexia-friendly font" in the A11y settings panel.
const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
});

function safeAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    return new URL(raw).toString();
  } catch {
    return "http://localhost:3000";
  }
}

const APP_URL = safeAppUrl();
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Swadhyaya";
const APP_DESCRIPTION =
  "Learn linear algebra by playing. From a number on a line to SVD, eigen, and PCA — see it, drag it, discover the formula. No memorization, no jargon.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Linear Algebra, Intuition-First`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "linear algebra",
    "intuition",
    "math",
    "interactive learning",
    "eigenvalues",
    "SVD",
    "PCA",
    "Strang",
    "Sudarshan Iyengar",
  ],
  authors: [{ name: "Mudita Agrawal" }],
  creator: "Mudita Agrawal",
  publisher: APP_NAME,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Linear Algebra, Intuition-First`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Linear algebra, intuition-first`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Linear Algebra, Intuition-First`,
    description: APP_DESCRIPTION,
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1614",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${sourceSerif.variable} ${lexend.variable}`}
    >
      <body className="bg-canvas text-ink min-h-screen">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <TopNav />
        <div className="flex">
          <SideRail />
          <main
            id="main-content"
            className="flex-1 min-h-[calc(100vh-56px)] pb-14 md:pb-0"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
        <MobileNav />
        <A11ySettings />
        <GlobalProctorBanner />
      </body>
    </html>
  );
}