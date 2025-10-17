"use client";

import { useState } from "react";
import api from "../services/apiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2pdf from "html2pdf.js";

/**
 * DocGenerator
 * Step 3: Pick doc_type + audience, call /api/docs/generate, show and edit result.
 * Left: Editable Markdown
 * Right: Live PDF preview (rendered Markdown)
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
  const [banner, setBanner] = useState(null);
  const [documentation, setDocumentation] = useState("");
  const [location, setLocation] = useState("");

  // Generate documentation from API
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

  // Copy markdown to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(documentation || "");
      setBanner({ type: "success", msg: "Copied to clipboard." });
    } catch {
      setBanner({ type: "error", msg: "Copy failed." });
    }
  }

  // Export current markdown preview as PDF
  function generatePdf() {
    const element = document.getElementById("pdf-preview");
    if (!element) return;
    html2pdf()
      .from(element)
      .set({
        margin: 10,
        filename: "Echo-Documentation.pdf",
        html2canvas: { scale: 1.5 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">3. Generate Documentation</h2>
        <p className="text-sm text-gray-600">
          Repo: <code className="text-gray-800">{repoId}</code>
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

      {/* Step form for doc type and audience */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Doc Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="select mt-1"
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
            className="select mt-1"
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
            className="btn-primary disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
          {typeof onBack === "function" && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
              disabled={generating}
            >
              Back
            </button>
          )}
        </div>
      </form>

      {/* Markdown editor + Live PDF preview */}
      {(documentation || location) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editable Markdown Box */}
          <div className="flex flex-col h-[70vh]">
            <h3 className="text-sm font-semibold mb-2">Editable Markdown</h3>
            <textarea
              className="flex-1 input resize-none font-mono text-sm"
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="btn-secondary w-fit"
              >
                Copy Markdown
              </button>
            </div>
          </div>

          {/* Live Markdown → PDF Preview */}
          <div className="flex flex-col h-[70vh] overflow-hidden">
            <h3 className="text-sm font-semibold mb-2">Live PDF Preview</h3>
            <div
              id="pdf-preview"
              className="flex-1 overflow-auto bg-white border border-gray-300 rounded-lg p-4 shadow-inner text-black"
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {documentation || ""}
                </ReactMarkdown>
              </div>
            </div>
            <button
              type="button"
              onClick={generatePdf}
              className="btn-primary mt-3 w-fit"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
