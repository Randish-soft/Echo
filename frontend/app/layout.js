import './globals.css';

export const metadata = {
  title: 'Echo — Documentation Generator',
  description: 'Transform your GitHub repository into comprehensive documentation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {/* Page content (each page can render its own header/nav if needed) */}
        <main className="min-h-screen">{children}</main>

        {/* Global footer (subtle, non-intrusive) */}
        <footer className="border-t border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-slate-400">
            Echo • Built with ❤️ by Randish • Powered by C++ &amp; Next.js
          </div>
        </footer>
      </body>
    </html>
  );
}
