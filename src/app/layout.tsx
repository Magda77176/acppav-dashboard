import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "JARVIS Mission Control",
  description: "Écosystème autonome d'agents IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-black text-gray-300 min-h-screen">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
