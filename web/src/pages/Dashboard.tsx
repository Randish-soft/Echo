import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-600">
        Welcome to <span className="font-semibold text-blue-600">RepoDocs</span>.  
        Manage repositories and generate documentation with AI assistance.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/docs"
          className="rounded-2xl border bg-white shadow-sm p-6 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">Repository Docs</h2>
          <p className="text-gray-600">
            Generate, view, and edit project documentation.
          </p>
        </Link>

        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2 text-green-600">Connected Repos</h2>
          <p className="text-gray-600">
            Link GitHub repositories and configure settings.
          </p>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-600">Recent Activity</h2>
          <p className="text-gray-600">
            View documentation generation history and updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
