"use client";

import { useState } from "react";
import api from "../app/services/apiService";

/**
 * DocGenerator
 * Step 3: Pick doc_type + audience, call /api/docs/generate, show result.
 *
 * Props:
 * - repoId: string (required)
 * - defaultDocType?: "internal" | "external" (default "internal")
 * - defaultAudience?: "developers" | "users" | "managers" (default "developers")
 * - onBack?: () => void
 * - onDone?: (output?: { documentation?: string; location?: string }) => void
 */
export default function DocGenerator({
  repoId,
  defaultDocType = "internal",
  defaultAudience = "developers",
  onBack,
  onDone,
}) {
  const [docType, setDocType] = useState(defaultDocType);
  const [audience, setAudience] = useState(defaultAudience);
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState(null); // {type, msg}
  const [documentation, setDocumentation] = useState("");
  const [location, setLocation] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    if (!repoId) {
      setBanner({ type: "error", msg: "No repository selected." });
      return;
    }
    setBanner(null);
    setDocumentation("");
    setLocation("");
    setGenerating(true);
    try {
      const res = await api.generateDocumentation(repoId, docType, audience);
      setDocumentation(res?.documentation || "");
      setLocation(res?.location || "");
      setBanner({ type: "success", msg: "Documentation generated." });
      if (typeof onDone === "function") onDone(res);
    } catch (err) {
      const msg =
        (err?.details && (err.details.message || err.details.error || err.details.details)) ||
        err.message ||
        "Generation failed.";
      setBanner({ type: "error", msg });
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(documentation || "");
      setBanner({ type: "success", msg: "Copied to clipboard." });
    } catch {
      setBanner({ type: "error", msg: "Copy failed." });
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">3. Generate Documentation</h2>
        <p className="text-sm text-gray-600">Repo: <code className="text-gray-800">{repoId}</code></p>
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

      <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Doc Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="internal">internal</option>
            <option value="external">external</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="developers">developers</option>
            <option value="users">users</option>
            <option value="managers">managers</option>
          </select>
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            disabled={!repoId || generating}
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
          {typeof onBack === "function" && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border px-4 py-2"
              disabled={generating}
            >
              Back
            </button>
          )}
        </div>
      </form>

      {(documentation || location) && (
        <div className="space-y-3">
          {location && (
            <div className="text-sm text-gray-700">
              Saved at: <code className="break-all">{location}</code>
            </div>
          )}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Output</h3>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-lg border px-2 py-1 text-xs"
            >
              Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border bg-gray-50 p-4 text-sm max-h-[60vh] overflow-auto">
            {documentation || "(no content returned)"}
          </pre>
        </div>
      )}
    </section>
  );
}
