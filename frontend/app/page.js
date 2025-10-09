'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, BookOpen, Menu, X, Zap } from 'lucide-react';

export default function EchoDocumentationApp() {
  const [projectInfo, setProjectInfo] = useState('');
  const [useCases, setUseCases] = useState('');
  const [generatedManual, setGeneratedManual] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedProject = localStorage.getItem('echo-project');
    const savedUseCases = localStorage.getItem('echo-usecases');
    if (savedProject) setProjectInfo(savedProject);
    if (savedUseCases) setUseCases(savedUseCases);
  }, []);

  useEffect(() => {
    localStorage.setItem('echo-project', projectInfo);
  }, [projectInfo]);

  useEffect(() => {
    localStorage.setItem('echo-usecases', useCases);
  }, [useCases]);

  const extractHeaders = (text) => {
    const lines = text.split('\n');
    const headers = [];
    
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headers.push({
          level: match[1].length,
          text: match[2],
          id: match[2].toLowerCase().replace(/[^\w]+/g, '-')
        });
      }
    });
    
    return headers;
  };

  const generateUserManual = () => {
    const projectHeaders = extractHeaders(projectInfo);
    const useCaseHeaders = extractHeaders(useCases);
    
    let projectName = 'Your Project';
    let projectDescription = '';
    let features = [];
    let technical = [];
    
    const projectLines = projectInfo.split('\n').filter(line => line.trim());
    projectLines.forEach((line, idx) => {
      if (line.match(/^#\s+(.+)$/)) {
        projectName = line.replace(/^#\s+/, '');
      } else if (idx <= 5 && !line.startsWith('#') && line.length > 20) {
        projectDescription += line + ' ';
      } else if (line.match(/^##\s+(.+)$/)) {
        const header = line.replace(/^##\s+/, '');
        if (header.toLowerCase().includes('feature') || header.toLowerCase().includes('what')) {
          const nextLines = projectLines.slice(idx + 1, idx + 10);
          nextLines.forEach(nl => {
            if (nl.startsWith('-') || nl.startsWith('*') || nl.match(/^\d+\./)) {
              features.push(nl.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
            }
          });
        }
        if (header.toLowerCase().includes('tech') || header.toLowerCase().includes('built')) {
          const nextLines = projectLines.slice(idx + 1, idx + 10);
          nextLines.forEach(nl => {
            if (nl.startsWith('-') || nl.startsWith('*') || nl.match(/^\d+\./)) {
              technical.push(nl.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
            }
          });
        }
      }
    });

    const useCasesList = [];
    const useCaseLines = useCases.split('\n').filter(line => line.trim());
    let currentUseCase = null;
    
    useCaseLines.forEach((line, idx) => {
      if (line.match(/^##\s+(.+)$/)) {
        if (currentUseCase) useCasesList.push(currentUseCase);
        currentUseCase = {
          title: line.replace(/^##\s+/, ''),
          description: '',
          steps: []
        };
      } else if (currentUseCase) {
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          currentUseCase.steps.push(line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
        } else if (line.trim() && !line.startsWith('#')) {
          currentUseCase.description += line + ' ';
        }
      }
    });
    if (currentUseCase) useCasesList.push(currentUseCase);

    let manual = `# ${projectName} - User Manual\n\n`;
    manual += `## Table of Contents\n\n`;
    manual += `1. [Introduction](#introduction)\n`;
    manual += `2. [Getting Started](#getting-started)\n`;
    if (features.length > 0) manual += `3. [Features](#features)\n`;
    if (useCasesList.length > 0) manual += `4. [How to Use](#how-to-use)\n`;
    if (technical.length > 0) manual += `5. [Technical Information](#technical-information)\n`;
    manual += `\n---\n\n`;

    manual += `## Introduction\n\n`;
    manual += `Welcome to ${projectName}. ${projectDescription.trim() || 'This manual will guide you through using this application effectively.'}\n\n`;

    manual += `## Getting Started\n\n`;
    manual += `To begin using ${projectName}, follow these steps:\n\n`;
    manual += `1. Launch the application\n`;
    manual += `2. Familiarize yourself with the interface\n`;
    manual += `3. Review the features and use cases below\n\n`;

    if (features.length > 0) {
      manual += `## Features\n\n`;
      manual += `${projectName} includes the following features:\n\n`;
      features.forEach((feature, idx) => {
        manual += `${idx + 1}. ${feature}\n`;
      });
      manual += `\n`;
    }

    if (useCasesList.length > 0) {
      manual += `## How to Use\n\n`;
      manual += `Below are common use cases and workflows:\n\n`;
      useCasesList.forEach((useCase, idx) => {
        manual += `### ${idx + 1}. ${useCase.title}\n\n`;
        if (useCase.description.trim()) {
          manual += `${useCase.description.trim()}\n\n`;
        }
        if (useCase.steps.length > 0) {
          manual += `**Steps:**\n\n`;
          useCase.steps.forEach((step, sidx) => {
            manual += `${sidx + 1}. ${step}\n`;
          });
          manual += `\n`;
        }
      });
    }

    if (technical.length > 0) {
      manual += `## Technical Information\n\n`;
      technical.forEach((tech, idx) => {
        manual += `- ${tech}\n`;
      });
      manual += `\n`;
    }

    manual += `---\n\n`;
    manual += `*This user manual was automatically generated by Echo Documentation Tool.*\n`;
    manual += `*Generated on ${new Date().toLocaleDateString()}*`;

    setGeneratedManual(manual);
    setActiveTab('preview');
  };

  const parseMarkdown = (text) => {
    let html = text;

    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    html = html.replace(/^[\-\*] (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      if (!match.includes('<ul>')) {
        return '<ol>' + match + '</ol>';
      }
      return match;
    });

    html = html.replace(/^---$/gim, '<hr />');

    html = html.split('\n\n').map(para => {
      if (para.match(/^<[h|u|o|p|d|c]/)) return para;
      if (para.trim() === '') return '';
      return '<p>' + para + '</p>';
    }).join('\n');

    return html;
  };

  const exportToPDF = () => {
    const content = generatedManual || projectInfo;
    const htmlContent = parseMarkdown(content);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Echo Documentation - Export</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 { font-size: 2.5em; margin-top: 0; border-bottom: 3px solid #333; padding-bottom: 10px; }
            h2 { font-size: 1.8em; margin-top: 30px; border-bottom: 2px solid #666; padding-bottom: 5px; }
            h3 { font-size: 1.4em; margin-top: 25px; color: #444; }
            h4 { font-size: 1.2em; margin-top: 20px; color: #555; }
            p { margin: 15px 0; }
            ul, ol { margin: 15px 0; padding-left: 30px; }
            li { margin: 8px 0; }
            code.inline-code { 
              background: #f4f4f4; 
              padding: 2px 6px; 
              border-radius: 3px; 
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            pre { 
              background: #f4f4f4; 
              padding: 15px; 
              border-radius: 5px; 
              overflow-x: auto;
              border-left: 4px solid #333;
            }
            pre code { 
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            hr { border: none; border-top: 2px solid #ddd; margin: 30px 0; }
            @media print {
              body { margin: 0; padding: 20px; }
              h2 { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const downloadMarkdown = () => {
    const content = generatedManual || projectInfo;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-manual.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Echo</h1>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'editor' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Project Info
            </button>
            <button
              onClick={() => setActiveTab('usecases')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'usecases' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Use Cases
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'preview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              disabled={!generatedManual}
            >
              Generated Manual
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'editor' ? 'Project Information' : 
               activeTab === 'usecases' ? 'Use Cases' : 'Generated User Manual'}
            </h2>
          </div>
          
          <div className="flex gap-2">
            {activeTab !== 'preview' && (
              <button
                onClick={generateUserManual}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Generate Manual
              </button>
            )}
            {generatedManual && activeTab === 'preview' && (
              <>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download MD
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'editor' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Describe Your Project</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Write about your project using markdown. Include project name, description, features, and technical details.
                </p>
                <textarea
                  value={projectInfo}
                  onChange={(e) => setProjectInfo(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="# My Project&#10;&#10;A brief description of what your project does.&#10;&#10;## Features&#10;&#10;- Feature 1&#10;- Feature 2&#10;- Feature 3&#10;&#10;## Tech Stack&#10;&#10;- React&#10;- Node.js"
                />
              </div>
            </div>
          )}

          {activeTab === 'usecases' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Define Use Cases</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Describe how users will interact with your project. Each use case should have a title and steps.
                </p>
                <textarea
                  value={useCases}
                  onChange={(e) => setUseCases(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="## Creating a New Document&#10;&#10;Users can create documents easily.&#10;&#10;- Click the 'New' button&#10;- Enter document title&#10;- Start writing&#10;&#10;## Exporting Documents&#10;&#10;Export your work in multiple formats.&#10;&#10;1. Click Export button&#10;2. Choose format&#10;3. Save to location"
                />
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto">
              {generatedManual ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(generatedManual) }}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Manual Generated Yet</h3>
                  <p className="text-gray-500">
                    Fill in your project information and use cases, then click Generate Manual to create your user manual.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .prose h1 { font-size: 2.5em; margin-top: 0; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .prose h2 { font-size: 1.8em; margin-top: 30px; border-bottom: 2px solid #666; padding-bottom: 5px; margin-bottom: 15px; }
        .prose h3 { font-size: 1.4em; margin-top: 25px; color: #444; margin-bottom: 10px; }
        .prose h4 { font-size: 1.2em; margin-top: 20px; color: #555; margin-bottom: 10px; }
        .prose p { margin: 15px 0; line-height: 1.6; }
        .prose ul, .prose ol { margin: 15px 0; padding-left: 30px; }
        .prose li { margin: 8px 0; }
        .prose code.inline-code { 
          background: #f4f4f4; 
          padding: 2px 6px; 
          border-radius: 3px; 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .prose pre { 
          background: #f4f4f4; 
          padding: 15px; 
          border-radius: 5px; 
          overflow-x: auto;
          border-left: 4px solid #333;
          margin: 20px 0;
        }
        .prose pre code { 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          background: transparent;
          padding: 0;
        }
        .prose a { color: #0066cc; text-decoration: none; }
        .prose a:hover { text-decoration: underline; }
        .prose hr { border: none; border-top: 2px solid #ddd; margin: 30px 0; }
        .prose strong { font-weight: 600; }
        .prose em { font-style: italic; }
      `}</style>
    </div>
  );
}
