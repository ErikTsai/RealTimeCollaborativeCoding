import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"; // Utility from shadcn

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Simple Collab Editor",
  description: "Real-time collaborative code editing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {/* You could add a global header/navbar here if needed */}
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
          {children}
        </main>
        {/* You could add a global footer here */}
      </body>
    </html>
  );
}
