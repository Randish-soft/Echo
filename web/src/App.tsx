import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RepoDocs from "./pages/RepoDocs";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-blue-600">
              RepoDocs
            </Link>
            <nav className="space-x-4">
              <Link to="/" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/docs" className="hover:text-blue-600">
                Repo Docs
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/docs" element={<RepoDocs />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} RepoDocs. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
