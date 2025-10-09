import './globals.css'

export const metadata = {
  title: 'Echo - Documentation Tool',
  description: 'Local-first documentation generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
