import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import AuthSession from "./components/AuthSession";
import { MotionProvider } from "./components/Motion/Motion";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const description =
  "O and A-Level classes with live lessons, assignments, quizzes and direct teacher feedback.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Cambfordable | O and A-Level classes",
    template: "%s | Cambfordable",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Cambfordable",
    title: "Cambfordable | O and A-Level classes",
    description,
    images: [{ url: "/assets/banner/banner.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cambfordable | O and A-Level classes",
    description,
  },
};

// Pinch zoom stays available; it is how many students read small text.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased bg-white`}>
        <AuthSession />
        {/* Without JavaScript nothing animates, so nothing may stay hidden. */}
        <noscript>
          <style>{".reveal,.reveal *{opacity:1!important;transform:none!important;clip-path:none!important;filter:none!important}"}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
