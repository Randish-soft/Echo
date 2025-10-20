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
    const [showGrammarPanel, setShowGrammarPanel] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [textSelection, setTextSelection] = useState(null);
    const textareaRef = useRef(null);
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

    // Handle text selection for context-aware suggestions
    const handleTextSelection = () => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            if (start !== end) {
                setTextSelection({ start, end });
            } else {
                setTextSelection(null);
            }
        }
    };

    const generatePdfPreview = async () => {
        try {
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
            const result = await apiService.generateDocumentation(selectedRepo, docType, audience);
            setGeneratedDoc(result.documentation || "No documentation generated.");
            setMessage({ type: "success", text: "Documentation generated successfully!" });
            
            if (onDocumentGenerated) {
                onDocumentGenerated(result);
            }
        } catch (error) {
            setMessage({ 
                type: "error", 
                text: error.message || "Failed to generate documentation" 
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveEdits = () => {
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
            const result = grammarService.autoCorrect(editedDoc, grammarAnalysis?.issues || []);
            setEditedDoc(result.text);
            setMessage({ 
                type: "success", 
                text: `Auto-corrected ${result.corrections.length} issues!` 
            });
        }
    };

    const handleIgnoreIssue = (issue) => {
        grammarService.ignoreIssue(editedDoc, issue);
        setSelectedIssue(null);
        // Re-analyze to update the issues list
        const newAnalysis = grammarService.analyzeText(editedDoc);
        setGrammarAnalysis(newAnalysis);
    };

    const handleApplySuggestion = (issue, suggestion) => {
        if (issue.correction) {
            const newText = editedDoc.substring(0, issue.startIndex) + 
                           issue.correction + 
                           editedDoc.substring(issue.endIndex);
            setEditedDoc(newText);
            setSelectedIssue(null);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "high": return "text-red-500";
            case "medium": return "text-yellow-500";
            case "low": return "text-blue-500";
            default: return "text-gray-500";
        }
    };

    const getSeverityBgColor = (severity) => {
        switch (severity) {
            case "high": return "bg-red-500/20 border-red-500/30";
            case "medium": return "bg-yellow-500/20 border-yellow-500/30";
            case "low": return "bg-blue-500/20 border-blue-500/30";
            default: return "bg-gray-500/20 border-gray-500/30";
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
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            showGrammarPanel 
                                                ? "bg-indigo-700 text-white" 
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
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
                    
                    <div className="flex-1 p-4 overflow-hidden relative">
                        {isEditing ? (
                            <>
                                <textarea
                                    ref={textareaRef}
                                    value={editedDoc}
                                    onChange={(e) => setEditedDoc(e.target.value)}
                                    onSelect={handleTextSelection}
                                    className="w-full h-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Start editing your documentation here..."
                                />
                                
                                {/* Issue highlighting overlay */}
                                {grammarAnalysis && grammarAnalysis.issues.map((issue, index) => (
                                    <div
                                        key={index}
                                        className={`absolute border-b-2 ${getSeverityBgColor(issue.severity)} cursor-pointer`}
                                        style={{
                                            top: `${(issue.startIndex / editedDoc.length) * 100}%`,
                                            left: '1rem',
                                            right: '1rem',
                                            height: '2px'
                                        }}
                                        onClick={() => setSelectedIssue(issue)}
                                        title={`${issue.type}: ${issue.suggestion}`}
                                    />
                                ))}
                            </>
                        ) : (
                            <div className="w-full h-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-sm whitespace-pre-wrap overflow-auto">
                                {editedDoc || "Generate documentation to see the content here..."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grammar Panel - Middle */}
                {showGrammarPanel && (
                    <div className="w-96 flex flex-col border-r border-slate-700 bg-slate-800">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">Editor Assistant</h2>
                            <button
                                onClick={() => setShowGrammarPanel(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Grammar Score & Metrics */}
                            <div className="p-4 border-b border-slate-700">
                                {grammarAnalysis ? (
                                    <div className="space-y-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">
                                                <span className={getGrammarScoreColor(grammarAnalysis.score)}>
                                                    {grammarAnalysis.score}/100
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-300">Writing Quality</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-700 p-2 rounded text-center">
                                                <div className="font-semibold">{grammarAnalysis.metrics?.wordCount}</div>
                                                <div className="text-slate-400">Words</div>
                                            </div>
                                            <div className="bg-slate-700 p-2 rounded text-center">
                                                <div className="font-semibold">{grammarAnalysis.metrics?.characterCount}</div>
                                                <div className="text-slate-400">Characters</div>
                                            </div>
                                            <div className="bg-slate-700 p-2 rounded text-center">
                                                <div className="font-semibold">{grammarAnalysis.metrics?.sentenceCount}</div>
                                                <div className="text-slate-400">Sentences</div>
                                            </div>
                                            <div className="bg-slate-700 p-2 rounded text-center">
                                                <div className="font-semibold">{grammarAnalysis.metrics?.readingTime}m</div>
                                                <div className="text-slate-400">Read Time</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 py-2">
                                        Start typing to see analysis...
                                    </div>
                                )}
                            </div>

                            {/* Issues List */}
                            <div className="flex-1 overflow-auto">
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-200 mb-3">
                                        Issues ({grammarAnalysis?.issues?.length || 0})
                                    </h3>
                                    
                                    {grammarAnalysis?.issues?.length > 0 ? (
                                        <div className="space-y-2">
                                            {grammarAnalysis.issues.map((issue, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-3 rounded border cursor-pointer transition-colors ${
                                                        selectedIssue === issue 
                                                            ? "bg-slate-600 border-slate-400" 
                                                            : getSeverityBgColor(issue.severity)
                                                    }`}
                                                    onClick={() => setSelectedIssue(issue)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-2 h-2 rounded-full ${getSeverityColor(issue.severity).replace('text-', 'bg-')}`}></div>
                                                                <span className="text-sm font-medium capitalize">{issue.type}</span>
                                                                <span className="text-xs text-slate-400 capitalize">({issue.category})</span>
                                                            </div>
                                                            <div className="text-sm text-slate-300">{issue.suggestion}</div>
                                                            <div className="text-xs text-slate-400 mt-1 font-mono bg-slate-700 px-2 py-1 rounded">
                                                                "{issue.text}"
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-400 py-8">
                                            ✅ No issues found
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Issue Details */}
                            {selectedIssue && (
                                <div className="p-4 border-t border-slate-700 bg-slate-750">
                                    <h4 className="font-semibold text-slate-200 mb-3">Selected Issue</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-slate-400">Type</div>
                                            <div className="text-sm font-medium capitalize">{selectedIssue.type}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Suggestion</div>
                                            <div className="text-sm">{selectedIssue.suggestion}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">Text</div>
                                            <div className="text-sm font-mono bg-slate-700 p-2 rounded">
                                                "{selectedIssue.text}"
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            {selectedIssue.correction && (
                                                <button
                                                    onClick={() => handleApplySuggestion(selectedIssue, selectedIssue.correction)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
                                                >
                                                    Change to "{selectedIssue.correction}"
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleIgnoreIssue(selectedIssue)}
                                                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded text-sm transition-colors"
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    </div>
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