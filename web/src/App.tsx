import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RepoDocs from "./pages/RepoDocs";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
          <div className="container-narrow py-3 flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              RepoDocs
            </Link>
            <nav className="flex items-center gap-2">
              <Link to="/" className="btn-ghost">Dashboard</Link>
              <Link to="/docs" className="btn-primary">Repo Docs</Link>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="container-narrow py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/docs" element={<RepoDocs />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white">
          <div className="container-narrow py-4 text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} RepoDocs
          </div>
        </footer>
      </div>
    </Router>
  );
}
export default App;
