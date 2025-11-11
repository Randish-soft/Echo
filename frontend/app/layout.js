export const metadata = {
  title: "Echo — Documentation Generator",
  description: "Turn repositories into clear, useful docs."
};

import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
