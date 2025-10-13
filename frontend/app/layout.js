import './globals.css'

export const metadata = {
  title: 'Echo - Documentation Generator',
  description: 'Automated code documentation generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">Echo</h1>
                <span className="ml-3 text-gray-500 text-sm">Documentation Generator</span>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </a>
                <a href="/repositories" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Repositories
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 text-sm">
              Echo - Built with ❤️ by Randish | Powered by C++ & Next.js
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}