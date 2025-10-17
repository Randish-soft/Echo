export const metadata = {
  title: "Echo — Documentation Generator",
  description: "Turn repositories into clear, useful docs."
};

import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="text-slate-100">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          
        </header>
        {children}
         <nav className="flex gap-3 text-sm">
              <Link className="rounded-md px-2 py-1 hover:bg-white/5" href="/">Home</Link>
              <Link className="rounded-md px-2 py-1 hover:bg-white/5" href="/docs">Docs</Link>
            </nav>
      </body>
    </html>
  );
}
