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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-600 font-black text-white">
                E
              </div>
              <div className="leading-tight">
                <div className="text-lg font-bold">Echo</div>
                <div className="text-xs text-slate-400">Documentation Generator</div>
              </div>
            </div>
            <nav className="flex gap-3 text-sm">
              <Link className="rounded-md px-2 py-1 hover:bg-white/5" href="/">Home</Link>
              <Link className="rounded-md px-2 py-1 hover:bg-white/5" href="/docs">Docs</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-slate-500">
          Echo • Built with ❤️ by Randish • Powered by C++ &amp; Next.js
        </footer>
      </body>
    </html>
  );
}
