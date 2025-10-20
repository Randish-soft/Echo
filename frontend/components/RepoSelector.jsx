"use client";

import { useEffect, useState } from "react";
import apiService from "../app/services/apiService";

export default function RepoSelector({ repositories = [], onRepoSelected, onBack }) {
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  // Load repositories on component mount
  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    try {
      setLoading(true);
      setBanner(null);
      
      // If repositories are passed as props, use them
      // Otherwise, fetch from API
      if (repositories && repositories.length > 0) {
        setSelectedRepoId(repositories[0] || "");
      } else {
        const data = await apiService.listRepositories();
        const repoList = data?.repositories || [];
        if (repoList.length > 0) {
          setSelectedRepoId(repoList[0]);
        }
      }
    } catch (err) {
      setBanner({ 
        type: "error", 
        msg: err.message || "Failed to load repositories." 
      });
    } finally {
      setLoading(false);
    }
  }

  function handleRepoChange(repoId) {
    setSelectedRepoId(repoId);
  }

  function handleContinue() {
    if (!selectedRepoId) {
      setBanner({ type: "error", msg: "Please select a repository first." });
      return;
    }
    if (onRepoSelected) {
      onRepoSelected(selectedRepoId);
    }
  }

  const displayRepositories = repositories && repositories.length > 0 ? repositories : [];

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">2. Select Repository</h2>
            <p className="text-slate-400">
              Choose a repository to generate documentation for.
            </p>
          </div>
          <button
            onClick={loadRepos}
            disabled={loading}
            className="px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800 
                     rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {banner && (
          <div
            className={`mb-4 rounded-lg p-3 border ${
              banner.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-300"
                : banner.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-blue-500/10 border-blue-500/20 text-blue-300"
            }`}
          >
            {banner.msg}
          </div>
        )}

        {displayRepositories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No repositories found.</p>
            <button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add a Repository First
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
                Available Repositories
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {displayRepositories.map((repoId) => (
                  <label
                    key={repoId}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRepoId === repoId
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-slate-800 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="repo"
                      value={repoId}
                      checked={selectedRepoId === repoId}
                      onChange={() => handleRepoChange(repoId)}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-200 font-mono text-sm">{repoId}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 
                           rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleContinue}
                disabled={!selectedRepoId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 
                         text-white font-medium py-3 px-6 rounded-lg transition-colors
                         disabled:cursor-not-allowed"
              >
                Continue to Documentation
              </button>
            </div>
          </div>
        )}

        {displayRepositories.length > 0 && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Repository Info</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <p>📁 Total repositories: {displayRepositories.length}</p>
              {selectedRepoId && (
                <p>
                  ✅ Selected: <code className="bg-slate-700 px-2 py-1 rounded">{selectedRepoId}</code>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}