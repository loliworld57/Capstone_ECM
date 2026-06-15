import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionManager from "@/components/SessionManage";
import { Toaster } from "react-hot-toast";
import 'simplebar-react/dist/simplebar.min.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECM",
  description: "Extra Center Management application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 1. Added scroll-smooth and ensured html behaves as a base layer
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--color-soft-white)] text-[var(--color-text)]`}
      >
        {/* 2. Replaced nested min-h-screen with flex-1 layout engine */}
        <div className="flex min-h-screen flex-col w-full">
          <Header />
          <SessionManager />
          
          <Toaster
            position="top-right"
            containerStyle={{ zIndex: 4000 }}
            toastOptions={{
              duration: 3000,
              style: { zIndex: 4000 },
            }}
          />

          {/* 3. Replaced min-h-0 with h-auto to prevent inner layout boxing */}
          <main className="flex flex-1 flex-col h-auto w-full">
            {children}
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
}