import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OmniDocs AI",
  description: "Enterprise Document Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 
        CRITICAL FIX: Remove any hardcoded 'bg-zinc-950', 'bg-black', 
        or dark text utility classes from this body tag. 
      */}
      <body className="antialiased selection:bg-blue-500/20">
        {children}
      </body>
    </html>
  );
}