import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionManager from "@/components/SessionManage";
import { Toaster } from "react-hot-toast";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--color-soft-white)] text-[var(--color-text)]`}
      >
        <div className="flex min-h-screen flex-col">
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

          <main className="flex min-h-0 flex-1 flex-col">
            {children}
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
}
