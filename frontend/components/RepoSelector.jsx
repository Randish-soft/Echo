"use client";

import { useEffect, useState } from "react";
import api from "../app/services/apiService";

/**
 * RepoSelector
 * Step 2: Select a repository (radio list) with refresh support.
 *
 * Props:
 * - initialSelectedId?: string
 * - autoAdvance?: boolean (default false)  // if true, calls onContinue immediately after a pick
 * - onContinue?: (repoId: string) => void // fired when user presses Continue (or auto-advance)
 * - onBack?: () => void                   // optional Back handler
 */
export default function RepoSelector({
  initialSelectedId = "",
  autoAdvance = false,
  onContinue,
  onBack,
}) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState(initialSelectedId);
  const [banner, setBanner] = useState(null); // {type:'error'|'success'|'info', msg}

  async function loadRepos(silent = false) {
    try {
      if (!silent) setLoading(true);
      setBanner(null);
      const data = await api.listRepositories(); // { status, repositories: string[], count }
      const list = data?.repositories ?? [];
      setRepos(list);

      // keep selection if it still exists, otherwise clear
      if (list.length && !list.includes(selectedRepoId)) {
        setSelectedRepoId(list[0]);
        if (autoAdvance && typeof onContinue === "function") {
          onContinue(list[0]);
        }
      } else if (!list.length) {
        setSelectedRepoId("");
      }
    } catch (err) {
      setBanner({ type: "error", msg: err.message || "Failed to load repositories." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePick(id) {
    setSelectedRepoId(id);
    if (autoAdvance && typeof onContinue === "function") onContinue(id);
  }

  function handleContinue() {
    if (!selectedRepoId) {
      setBanner({ type: "error", msg: "Please select a repository first." });
      return;
    }
    if (typeof onContinue === "function") onContinue(selectedRepoId);
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">2. Select Repository</h2>
          <p className="text-sm text-gray-600">Choose a repository to generate documentation for.</p>
        </div>
        <button
          onClick={() => loadRepos()}
          className="rounded-lg border px-3 py-1 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
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

      {repos.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-gray-600">
          No repositories found yet. Add one in Step 1, then click Refresh.
        </div>
      ) : (
        <ul className="space-y-2">
          {repos.map((rid) => (
            <li key={rid}>
              <label className="flex items-center gap-3 rounded-lg border p-3">
                <input
                  type="radio"
                  name="repo"
                  value={rid}
                  checked={selectedRepoId === rid}
                  onChange={() => handlePick(rid)}
                />
                <span className="text-sm">{rid}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3 pt-2">
        {typeof onBack === "function" && (
          <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2">
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedRepoId}
          className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
