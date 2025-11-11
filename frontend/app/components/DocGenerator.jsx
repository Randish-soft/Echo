"use client";

import { useState, useEffect } from "react";
import api from "../services/apiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  // Documentation type options organized by category
  const internalDocs = [
    { value: "internal_api", label: "API Documentation", desc: "REST endpoints, schemas, parameters" },
    { value: "internal_database", label: "Database Documentation", desc: "Schemas, relationships, migrations" },
    { value: "internal_architecture", label: "Architecture Documentation", desc: "System design, components, patterns" },
    { value: "internal_onboarding", label: "Developer Onboarding", desc: "Setup, workflow, first contribution" },
    { value: "internal_conventions", label: "Code Conventions", desc: "Style guide, best practices" },
    { value: "internal_technical_spec", label: "Technical Specification", desc: "Detailed technical specs" }
  ];

  const externalDocs = [
    { value: "external_user_manual", label: "User Manual", desc: "How to use features, workflows" },
    { value: "external_installation", label: "Installation Guide", desc: "Setup, configuration, requirements" },
    { value: "external_faq", label: "FAQ", desc: "Common questions and answers" },
    { value: "external_troubleshooting", label: "Troubleshooting Guide", desc: "Common issues and solutions" },
    { value: "external_release_notes", label: "Release Notes", desc: "Changes, features, bug fixes" },
    { value: "external_integration", label: "Integration Guide", desc: "How to integrate with other systems" }
  ];

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
  async function generatePdf() {
    const element = document.getElementById("pdf-preview");
    if (!element) return;

    // Dynamically import html2pdf only on client side
    const html2pdf = (await import("html2pdf.js")).default;

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
      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Internal Documentation */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Internal Documentation</h3>
            <p className="text-xs text-gray-600 mb-3">For developers and technical teams</p>
            <div className="space-y-2">
              {internalDocs.map((doc) => (
                <label
                  key={doc.value}
                  className={`block p-3 border rounded-lg cursor-pointer transition ${
                    docType === doc.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="docType"
                    value={doc.value}
                    checked={docType === doc.value}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="font-medium text-sm">{doc.label}</span>
                  <p className="text-xs text-gray-600 ml-5 mt-1">{doc.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* External Documentation */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">External Documentation</h3>
            <p className="text-xs text-gray-600 mb-3">For end users and external stakeholders</p>
            <div className="space-y-2">
              {externalDocs.map((doc) => (
                <label
                  key={doc.value}
                  className={`block p-3 border rounded-lg cursor-pointer transition ${
                    docType === doc.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="docType"
                    value={doc.value}
                    checked={docType === doc.value}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="font-medium text-sm">{doc.label}</span>
                  <p className="text-xs text-gray-600 ml-5 mt-1">{doc.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Audience Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="select w-full md:w-64"
          >
            <option value="developers">Developers</option>
            <option value="users">End Users</option>
            <option value="managers">Managers/Stakeholders</option>
            <option value="technical">Technical Reviewers</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={!repoId || generating}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Generating (30-60s)...
              </>
            ) : (
              "Generate Documentation"
            )}
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

        {/* AI Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <strong>Note:</strong> Documentation is generated using AI (local LLM).
          For formal regulatory submissions (ISO, EU Commission), please have this reviewed
          and verified by appropriate personnel.
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
