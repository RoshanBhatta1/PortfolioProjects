import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Closeout Automation",
  description: "AI-assisted project closeout packages for flooring contractors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <a href="/" className="text-lg font-semibold text-brand-700">
                Closeout<span className="text-gray-400">HQ</span>
              </a>
              <nav className="flex gap-4 text-sm text-gray-600">
                <a href="/" className="hover:text-brand-600">
                  Projects
                </a>
                <a href="/projects/new" className="hover:text-brand-600">
                  New Project
                </a>
                <a href="/settings" className="hover:text-brand-600">
                  Company Settings
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
