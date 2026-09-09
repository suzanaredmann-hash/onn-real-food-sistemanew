import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
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
  title: "ONN Real Food — Gestão",
  description: "Sistema de gestão da ONN Real Food",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {session?.user && (
          <NavBar userName={session.user.name ?? ""} role={session.user.role} />
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
