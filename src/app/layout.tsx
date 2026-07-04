import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "OmniDocs AI Engine Platform",
  description: "Secure cross-tenant multi-vector RAG indexing terminal layer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* FIXED: This script runs instantly before paint, eliminating the light-to-dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen font-sans antialiased bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}