"use client";

import { useState, useEffect, useRef } from "react";
import apiService from "../app/services/apiService";
import grammarService from "../app/services/grammarService";

export default function DocGenerator({ selectedRepo, onDocumentGenerated, onBack }) {
    const [docType, setDocType] = useState("internal");
    const [audience, setAudience] = useState("developers");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState("");
    const [editedDoc, setEditedDoc] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [grammarAnalysis, setGrammarAnalysis] = useState(null);
    const [showGrammarPanel, setShowGrammarPanel] = useState(false);
    const iframeRef = useRef(null);

    // Update edited document when generated doc changes
    useEffect(() => {
        if (generatedDoc && !isEditing) {
            setEditedDoc(generatedDoc);
        }
    }, [generatedDoc, isEditing]);

    // Generate PDF preview when edited doc changes
    useEffect(() => {
        if (editedDoc) {
            generatePdfPreview();
        }
    }, [editedDoc]);

    // Analyze grammar when editing
    useEffect(() => {
        if (isEditing && editedDoc) {
            const analysis = grammarService.analyzeText(editedDoc);
            setGrammarAnalysis(analysis);
        }
    }, [editedDoc, isEditing]);

    const generatePdfPreview = async () => {
        try {
            // Simple HTML preview for now
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Documentation - ${selectedRepo}</title>
                        <style>
                            body { 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                margin: 40px; 
                                line-height: 1.6;
                                color: #333;
                                max-width: 800px;
                                margin: 40px auto;
                                padding: 0 20px;
                            }
                            h1 { 
                                border-bottom: 3px solid #2c5aa0; 
                                padding-bottom: 10px; 
                                color: #2c5aa0;
                                margin-top: 0;
                            }
                            h2 { 
                                border-bottom: 1px solid #ddd; 
                                padding-bottom: 5px; 
                                color: #2c5aa0;
                                margin-top: 30px;
                            }
                            h3 { color: #555; margin-top: 25px; }
                            pre { 
                                background: #f8f9fa; 
                                padding: 15px; 
                                border-radius: 5px; 
                                border-left: 4px solid #2c5aa0;
                                overflow-x: auto;
                                font-family: 'Courier New', monospace;
                            }
                            code { 
                                background: #f8f9fa; 
                                padding: 2px 6px; 
                                border-radius: 3px; 
                                font-family: 'Courier New', monospace;
                            }
                            blockquote {
                                border-left: 4px solid #ddd;
                                margin: 20px 0;
                                padding-left: 20px;
                                color: #666;
                                font-style: italic;
                            }
                            table {
                                border-collapse: collapse;
                                width: 100%;
                                margin: 20px 0;
                            }
                            th, td {
                                border: 1px solid #ddd;
                                padding: 8px 12px;
                                text-align: left;
                            }
                            th {
                                background: #f8f9fa;
                            }
                            @media print {
                                body { margin: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <div>${convertMarkdownToHtml(editedDoc)}</div>
                    </body>
                </html>
            `;
            
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (error) {
            console.error('PDF preview generation failed:', error);
        }
    };

    const convertMarkdownToHtml = (markdown) => {
        if (!markdown) return '<p>No content available</p>';
        
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/&lt;(.*?)&gt;/g, '<$1>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/<\/p><p>/g, '</p>\n<p>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    };

    const handleGenerateDocumentation = async () => {
        if (!selectedRepo) {
            setMessage({ type: "error", text: "No repository selected" });
            return;
        }

        setIsGenerating(true);
        setMessage({ type: "", text: "" });
        setGeneratedDoc("");
        setEditedDoc("");
        setPdfUrl("");
        setGrammarAnalysis(null);

        try {
            console.log("🔄 Generating documentation for:", selectedRepo);
            const result = await apiService.generateDocumentation(selectedRepo, docType, audience);
            console.log("✅ Documentation generated:", result);
            
            setGeneratedDoc(result.documentation || "No documentation generated.");
            setMessage({ type: "success", text: "Documentation generated successfully!" });
            
            if (onDocumentGenerated) {
                onDocumentGenerated(result);
            }
        } catch (error) {
            console.error("❌ Documentation generation failed:", error);
            setMessage({ 
                type: "error", 
                text: error.message || "Failed to generate documentation" 
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveEdits = () => {
        console.log("Saving edited document:", editedDoc);
        setMessage({ type: "success", text: "Document saved successfully!" });
        setIsEditing(false);
    };

    const handleExportPDF = () => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `documentation-${selectedRepo}.html`;
            link.click();
        }
    };

    const handleAutoCorrect = () => {
        if (editedDoc) {
            const corrected = grammarService.autoCorrect(editedDoc);
            setEditedDoc(corrected);
            setMessage({ type: "success", text: "Auto-correction applied!" });
        }
    };

    const getGrammarScoreColor = (score) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header Bar */}
            <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Documentation Generator</h1>
                            <p className="text-slate-400 text-sm">
                                Repository: <code className="bg-slate-800 px-2 py-1 rounded">{selectedRepo}</code>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                            <option value="internal">Internal Docs</option>
                            <option value="external">External Docs</option>
                        </select>
                        
                        <select
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                            <option value="developers">Developers</option>
                            <option value="users">End Users</option>
                            <option value="managers">Managers</option>
                        </select>

                        <button
                            onClick={handleGenerateDocumentation}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
                        >
                            {isGenerating ? "Generating..." : "Generate"}
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`mt-3 p-3 rounded-lg border text-sm ${
                        message.type === "error" 
                            ? "bg-red-500/10 border-red-500/20 text-red-300"
                            : "bg-green-500/10 border-green-500/20 text-green-300"
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Three Column Layout - Full Screen */}
            <div className="flex h-[calc(100vh-80px)]">
                {/* Editor Column - Left */}
                <div className="flex-1 flex flex-col border-r border-slate-700">
                    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Editor</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                            >
                                {isEditing ? "Preview" : "Edit"}
                            </button>
                            {isEditing && (
                                <>
                                    <button
                                        onClick={handleAutoCorrect}
                                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                                    >
                                        Auto-Correct
                                    </button>
                                    <button
                                        onClick={() => setShowGrammarPanel(!showGrammarPanel)}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
                                    >
                                        Grammar
                                    </button>
                                    <button
                                        onClick={handleSaveEdits}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-hidden">
                        {isEditing ? (
                            <textarea
                                value={editedDoc}
                                onChange={(e) => setEditedDoc(e.target.value)}
                                className="w-full h-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Start editing your documentation here..."
                            />
                        ) : (
                            <div className="w-full h-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm whitespace-pre-wrap overflow-auto">
                                {editedDoc || "Generate documentation to see the content here..."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grammar Panel - Middle (Conditional) */}
                {showGrammarPanel && isEditing && (
                    <div className="w-80 flex flex-col border-r border-slate-700 bg-slate-800">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">Grammar Check</h2>
                            <button
                                onClick={() => setShowGrammarPanel(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto">
                            {grammarAnalysis ? (
                                <div className="space-y-4">
                                    {/* Grammar Score */}
                                    <div className="text-center p-4 bg-slate-700 rounded-lg">
                                        <div className="text-2xl font-bold">
                                            <span className={getGrammarScoreColor(grammarAnalysis.score)}>
                                                {grammarAnalysis.score}/100
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-300 mt-1">
                                            Writing Quality
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-slate-700 p-2 rounded text-center">
                                            <div className="font-semibold">{grammarAnalysis.wordCount}</div>
                                            <div className="text-slate-400 text-xs">Words</div>
                                        </div>
                                        <div className="bg-slate-700 p-2 rounded text-center">
                                            <div className="font-semibold">{grammarAnalysis.sentenceCount}</div>
                                            <div className="text-slate-400 text-xs">Sentences</div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    {grammarAnalysis.suggestions.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-200 mb-2">Suggestions</h3>
                                            <div className="space-y-2">
                                                {grammarAnalysis.suggestions.map((suggestion, index) => (
                                                    <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-sm">
                                                        💡 {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Issues */}
                                    {grammarAnalysis.issues.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-200 mb-2">Issues Found</h3>
                                            <div className="space-y-2">
                                                {grammarAnalysis.issues.map((issue, index) => (
                                                    <div key={index} className="bg-red-500/10 border border-red-500/20 rounded p-2 text-sm">
                                                        ⚠️ {issue.type} ({issue.count})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {grammarAnalysis.issues.length === 0 && grammarAnalysis.suggestions.length === 0 && (
                                        <div className="text-center text-slate-400 py-4">
                                            ✅ Great! No issues found.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-8">
                                    Start typing to see grammar analysis...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Preview Column - Right */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Live Preview</h2>
                        <button
                            onClick={handleExportPDF}
                            disabled={!pdfUrl}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded text-sm transition-colors disabled:cursor-not-allowed"
                        >
                            Export
                        </button>
                    </div>
                    
                    <div className="flex-1 p-4 bg-white overflow-hidden">
                        {pdfUrl ? (
                            <iframe
                                ref={iframeRef}
                                src={pdfUrl}
                                className="w-full h-full border-0 rounded"
                                title="Documentation Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-gray-50 rounded">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">📄</div>
                                    <p className="text-lg font-medium">Preview will appear here</p>
                                    <p className="text-sm mt-2">Generate documentation to see the live preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}