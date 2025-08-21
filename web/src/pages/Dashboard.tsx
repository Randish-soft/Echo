import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-600">
          Generate and maintain clean documentation for your repos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/docs" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold mb-1">Repository Docs</h2>
          <p className="text-slate-600 text-sm">
            Generate, view, and edit project documentation.
          </p>
        </Link>

        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Connected Repos</h2>
          <p className="text-slate-600 text-sm">Link GitHub repos and configure settings.</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Recent Activity</h2>
          <p className="text-slate-600 text-sm">Track the last generations and updates.</p>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
