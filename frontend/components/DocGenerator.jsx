"use client";

import { useState, useRef, useEffect } from "react";
import apiService from "../app/services/apiService";

export default function DocGenerator({ repositories = [], onDocumentGenerated }) {
  const [selectedRepo, setSelectedRepo] = useState("");
  const [docType, setDocType] = useState("internal");
  const [audience, setAudience] = useState("developers");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [editedDoc, setEditedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const iframeRef = useRef(null);

  // Update edited document when generated doc changes
  useEffect(() => {
    if (generatedDoc && !isEditing) {
      setEditedDoc(generatedDoc);
    }
  }, [generatedDoc, isEditing]);

  // Generate PDF preview
  useEffect(() => {
    if (editedDoc) {
      generatePdfPreview();
    }
  }, [editedDoc]);

  const generatePdfPreview = async () => {
    try {
      // Convert markdown to PDF (you'll need a PDF generation service)
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedDoc })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback: Show markdown in iframe with print styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
              code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
              h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
              h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${convertMarkdownToHtml(editedDoc)}</body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      setPdfUrl(URL.createObjectURL(blob));
    }
  };

  const convertMarkdownToHtml = (markdown) => {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  const handleGenerateDocumentation = async () => {
    if (!selectedRepo) {
      alert("Please select a repository first");
      return;
    }

    setIsGenerating(true);
    setGeneratedDoc("");
    setEditedDoc("");
    setPdfUrl("");

    try {
      const result = await apiService.generateDocumentation(selectedRepo, docType, audience);
      setGeneratedDoc(result.documentation || result.docs || "");
      setIsEditing(false);
      
      if (onDocumentGenerated) {
        onDocumentGenerated(result);
      }
    } catch (error) {
      console.error("Documentation generation failed:", error);
      alert(`Failed to generate documentation: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = () => {
    // Save the edited document
    console.log("Saving edited document:", editedDoc);
    // You can send this to your backend or handle locally
    setIsEditing(false);
    alert("Document saved successfully!");
  };

  const handleExportPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `documentation-${selectedRepo}.pdf`;
      link.click();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Generate & Edit Documentation</h2>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Select Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            >
              <option value="">Choose a repository</option>
              {repositories.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Documentation Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            >
              <option value="developers">Developers</option>
              <option value="users">End Users</option>
              <option value="managers">Managers</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={handleGenerateDocumentation}
            disabled={isGenerating || !selectedRepo}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 
                     text-white font-medium py-3 px-6 rounded-lg transition-colors
                     disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate Documentation"}
          </button>
        </div>

        {/* Editor and Preview Section */}
        {(generatedDoc || editedDoc) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Editor Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Document Editor</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    {isEditing ? "Preview" : "Edit"}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleSaveEdits}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={editedDoc}
                  onChange={(e) => setEditedDoc(e.target.value)}
                  className="w-full h-96 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                           text-white font-mono text-sm resize-none"
                  placeholder="Edit your documentation here..."
                />
              ) : (
                <div className="h-96 overflow-auto px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                              text-white font-mono text-sm whitespace-pre-wrap">
                  {editedDoc}
                </div>
              )}
            </div>

            {/* PDF Preview Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">PDF Preview</h3>
                <button
                  onClick={handleExportPDF}
                  disabled={!pdfUrl}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 
                           text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Export PDF
                </button>
              </div>

              <div className="h-96 bg-white rounded-lg border border-slate-600 overflow-hidden">
                {pdfUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    Preview will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}