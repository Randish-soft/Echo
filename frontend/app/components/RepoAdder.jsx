"use client";

import { useState } from "react";
import api from "../services/apiService";

/**
 * RepoAdder
 * Step 1: Add a GitHub repository by URL (+ optional branch)
 *
 * Props:
 * - onAdded?: (repoIdList?: string[]) => void
 * - onSkip?: () => void
 * - defaultBranch?: string (default "main")
 * - autoAdvance?: boolean (default true)  // if true, calls onAdded after success
 */
export default function RepoAdder({
  onAdded,
  onSkip,
  defaultBranch = "main",
  autoAdvance = true,
}) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState(defaultBranch);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null); // {type:'error'|'success'|'info', msg:string}

  async function handleAddRepo(e) {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setBanner({ type: "error", msg: "Please enter a GitHub repository URL." });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      // backend expects: { github_url, branch? }
      await api.addRepository(repoUrl.trim(), branch.trim() || "main");

      // Optional: fetch the new list so parent can immediately show it
      let newList;
      try {
        const data = await api.listRepositories();
        newList = data?.repositories ?? [];
      } catch {
        // non-fatal; still show success
      }

      setBanner({ type: "success", msg: "Repository indexed successfully." });
      setRepoUrl("");
      if (autoAdvance && typeof onAdded === "function") onAdded(newList);
    } catch (err) {
      const detailsMsg =
        (err?.details && (err.details.message || err.details.error || err.details.details)) ||
        err.message ||
        "Add repository failed.";
      setBanner({ type: "error", msg: detailsMsg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">1. Add Repository</h2>
        <p className="text-sm text-gray-600">
          Paste the full GitHub URL (e.g., https://github.com/user/repo). Branch is optional.
        </p>
      </header>

      {banner && (
        <div
          className={`rounded-lg p-3 text-sm border ${
            banner.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : banner.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {banner.msg}
        </div>
      )}

      <form onSubmit={handleAddRepo} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">GitHub Repository URL</label>
          <input
            type="url"
            required
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Branch (optional)</label>
          <input
            type="text"
            placeholder={defaultBranch}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add Repository"}
          </button>

          {typeof onSkip === "function" && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg border px-4 py-2"
              disabled={busy}
            >
              Skip (already added)
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
