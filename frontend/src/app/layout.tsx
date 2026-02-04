import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amazon PPC Analyzer",
  description: "Analyze Amazon PPC performance and generate bulk upload files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <DataProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
