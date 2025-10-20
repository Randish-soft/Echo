"use client";

import { useState } from "react";
import apiService from "../app/services/apiService";

export default function RepoAdder({ onAdded, onSkip, defaultBranch = "main", autoAdvance = true }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState(defaultBranch);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setMessage({ type: "error", text: "Please enter a GitHub repository URL" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      console.log("🔄 Adding repository:", repoUrl);
      
      const result = await apiService.addRepository(repoUrl, branch || "main");
      console.log("✅ Repository added successfully:", result);

      setMessage({ 
        type: "success", 
        text: `Repository "${result.repo_id}" added successfully!` 
      });

      // Clear form
      setRepoUrl("");
      setBranch(defaultBranch);

      // Fetch updated repository list
      try {
        const repos = await apiService.listRepositories();
        console.log("📂 Updated repositories:", repos);
        
        if (autoAdvance && onAdded) {
          onAdded(repos.repositories || []);
        }
      } catch (listError) {
        console.error("Failed to fetch repository list:", listError);
        // Continue anyway
        if (autoAdvance && onAdded) {
          onAdded();
        }
      }

    } catch (error) {
      console.error("❌ Failed to add repository:", error);
      
      let errorMessage = error.message || "Failed to add repository";
      
      // Provide more user-friendly error messages
      if (error.message.includes("Cannot connect to backend")) {
        errorMessage = "Cannot connect to the backend server. Please make sure the backend is running on localhost:8000";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. The repository might be large or the server is busy. Please try again.";
      } else if (error.details) {
        errorMessage = error.details.details || error.details.error || errorMessage;
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Add Repository</h2>
        <p className="text-slate-400 mb-6">
          Paste the full GitHub URL to clone and analyze a repository
        </p>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg border ${
            message.type === "error" 
              ? "bg-red-500/10 border-red-500/20 text-red-300"
              : "bg-green-500/10 border-green-500/20 text-green-300"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="github-url" className="block text-sm font-medium text-slate-200 mb-2">
              GitHub Repository URL *
            </label>
            <input
              id="github-url"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                       text-white placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all duration-200"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-slate-200 mb-2">
              Branch (optional)
            </label>
            <input
              id="branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                       text-white placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 
                       text-white font-medium py-3 px-6 rounded-lg transition-colors
                       disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Repository...
                </span>
              ) : (
                "Add Repository"
              )}
            </button>

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 
                         rounded-lg transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}