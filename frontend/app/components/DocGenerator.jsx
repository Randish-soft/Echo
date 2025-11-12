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
  const [streamingText, setStreamingText] = useState("");
  const [progress, setProgress] = useState(0);

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

  // Generate documentation from API with progress simulation
  async function handleGenerate(e) {
    e.preventDefault();
    if (!repoId) {
      setBanner({ type: "error", msg: "No repository selected." });
      return;
    }
    setBanner(null);
    setDocumentation("");
    setLocation("");
    setStreamingText("");
    setProgress(0);
    setGenerating(true);

    // Smooth progress bar animation during generation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev; // Stay at 85% until response arrives
        return prev + Math.random() * 3;
      });
    }, 300);

    try {
      const res = await api.generateDocumentation(repoId, docType, audience);

      // Complete progress to 100%
      setProgress(100);
      clearInterval(progressInterval);

      const docText = res?.documentation || "";
      setLocation(res?.location || "");

      // Wait a moment to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 300));

      // Streaming effect - show text progressively (slower for visibility)
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < docText.length) {
          const chunkSize = Math.min(30, docText.length - currentIndex);
          currentIndex += chunkSize;
          const chunk = docText.substring(0, currentIndex);
          setStreamingText(chunk);
        } else {
          clearInterval(streamInterval);
          setDocumentation(docText);
          setStreamingText("");
          setGenerating(false);
          setBanner({ type: "success", msg: "Documentation generated." });
          if (typeof onDone === "function") onDone(res);
        }
      }, 100); // Slower speed for better visibility
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setGenerating(false);
      const msg =
        (err?.details && (err.details.message || err.details.error || err.details.details)) ||
        err.message ||
        "Generation failed.";
      setBanner({ type: "error", msg });
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
        <h2 className="text-xl font-semibold text-stone-900">3. Generate Documentation</h2>
        <p className="text-sm text-stone-600">
          Repo: <code className="text-stone-800 bg-stone-100 px-2 py-0.5" style={{borderRadius: '8px'}}>{repoId}</code>
        </p>
      </header>

      {banner && (
        <div
          className={`p-3 text-sm border ${
            banner.type === "error"
              ? "bg-red-50 text-red-700 border-red-300"
              : banner.type === "success"
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-blue-50 text-blue-700 border-blue-300"
          }`}
          style={{borderRadius: '15px'}}
        >
          {banner.msg}
        </div>
      )}

      {/* Progress Bar */}
      {generating && (
        <div className="bg-stone-50 border border-stone-300 p-6 space-y-3" style={{borderRadius: '15px'}}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Generating Documentation</h3>
              <p className="text-sm text-stone-600">This may take 1-3 minutes depending on system performance...</p>
            </div>
            <span className="text-2xl font-bold text-stone-900">{Math.round(progress)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#faf7f5',
            borderRadius: '15px',
            border: '1px solid #785a46',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #8b5e3c, #6d4a2e)',
              transition: 'width 0.3s ease',
              width: `${progress}%`,
              animation: 'shimmer 2s infinite'
            }} />
          </div>
        </div>
      )}

      {/* Streaming Text Preview */}
      {streamingText && (
        <div className="bg-white border border-stone-300 p-6 space-y-3" style={{borderRadius: '15px'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Live Preview - Writing...</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-stone-600">Generating</span>
            </div>
          </div>
          <div className="streaming-text">
            {streamingText}
            <span className="inline-block w-2 h-5 bg-stone-800 animate-pulse ml-1"></span>
          </div>
        </div>
      )}

      {/* Step form for doc type and audience */}
      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Internal Documentation */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-stone-900">Internal Documentation</h3>
            <p className="text-xs text-stone-600 mb-3">For developers and technical teams</p>
            <div className="space-y-2">
              {internalDocs.map((doc) => (
                <label
                  key={doc.value}
                  className={`block p-3 border cursor-pointer transition ${
                    docType === doc.value
                      ? "border-stone-800 bg-stone-50"
                      : "border-stone-300 hover:border-stone-500 bg-white"
                  }`}
                  style={{borderRadius: '15px'}}
                >
                  <input
                    type="radio"
                    name="docType"
                    value={doc.value}
                    checked={docType === doc.value}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mr-2 accent-stone-800"
                  />
                  <span className="font-medium text-sm text-stone-900">{doc.label}</span>
                  <p className="text-xs text-stone-600 ml-5 mt-1">{doc.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* External Documentation */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-stone-900">External Documentation</h3>
            <p className="text-xs text-stone-600 mb-3">For end users and external stakeholders</p>
            <div className="space-y-2">
              {externalDocs.map((doc) => (
                <label
                  key={doc.value}
                  className={`block p-3 border cursor-pointer transition ${
                    docType === doc.value
                      ? "border-stone-800 bg-stone-50"
                      : "border-stone-300 hover:border-stone-500 bg-white"
                  }`}
                  style={{borderRadius: '15px'}}
                >
                  <input
                    type="radio"
                    name="docType"
                    value={doc.value}
                    checked={docType === doc.value}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mr-2 accent-stone-800"
                  />
                  <span className="font-medium text-sm text-stone-900">{doc.label}</span>
                  <p className="text-xs text-stone-600 ml-5 mt-1">{doc.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Audience Selection */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Target Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full md:w-64 border border-stone-300 px-3 py-2 text-stone-900 focus-visible:outline-none focus-visible:border-stone-500"
            style={{borderRadius: '15px'}}
          >
            <option value="developers">Developers</option>
            <option value="users">End Users</option>
            <option value="managers">Managers/Stakeholders</option>
            <option value="technical">Technical Reviewers</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-stone-300">
          <button
            type="submit"
            disabled={!repoId || generating}
            className="bg-black text-white px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
            style={{borderRadius: '15px'}}
          >
            {generating ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Generating (1-3 min)...
              </>
            ) : (
              "Generate Documentation"
            )}
          </button>
          {typeof onBack === "function" && (
            <button
              type="button"
              onClick={onBack}
              className="border border-stone-300 bg-white text-stone-700 px-6 py-2.5 hover:bg-stone-50 transition-colors"
              style={{borderRadius: '15px'}}
              disabled={generating}
            >
              Back
            </button>
          )}
        </div>

        {/* AI Notice */}
        <div className="bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900" style={{borderRadius: '15px'}}>
          <strong>Note:</strong> Documentation is generated using AI (local LLM - llama3.1:8b).
          Generation typically takes 1-3 minutes depending on system performance.
          For formal regulatory submissions (ISO, EU Commission), please have this reviewed
          and verified by appropriate personnel.
        </div>
      </form>

      {/* Markdown editor + Live PDF preview */}
      {(documentation || location) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editable Markdown Box */}
          <div className="flex flex-col h-[70vh]">
            <h3 className="text-sm font-semibold mb-2 text-stone-900">Editable Markdown</h3>
            <textarea
              className="editor-textarea"
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="border border-stone-300 bg-white text-stone-700 px-6 py-2.5 hover:bg-stone-50 transition-colors"
                style={{borderRadius: '15px'}}
              >
                Copy Markdown
              </button>
            </div>
          </div>

          {/* Live Markdown → PDF Preview */}
          <div className="flex flex-col h-[70vh] overflow-hidden">
            <h3 className="text-sm font-semibold mb-2 text-stone-900">Live PDF Preview</h3>
            <div
              id="pdf-preview"
              className="pdf-preview"
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
              className="bg-stone-700 text-white px-6 py-2.5 hover:bg-stone-800 transition-colors mt-3"
              style={{borderRadius: '15px'}}
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
