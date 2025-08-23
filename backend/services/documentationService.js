const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

class DocumentationService {
    constructor() {
        this.docsDir = process.env.DOCS_DIR || './generated_docs';
        this.tempDir = process.env.TEMP_DIR || './temp';
    }

    async saveDocumentation(documentation, repositoryId, documentationType, format = 'markdown') {
        try {
            await fs.mkdir(this.docsDir, { recursive: true });
            
            const sanitizedRepoId = repositoryId.replace('/', '_');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const baseFileName = `${sanitizedRepoId}_${documentationType}_${timestamp}`;
            
            const files = {};
            
            if (format === 'markdown' || format === 'all') {
                const mdFileName = `${baseFileName}.md`;
                const mdFilePath = path.join(this.docsDir, mdFileName);
                await fs.writeFile(mdFilePath, documentation, 'utf-8');
                files.markdown = mdFilePath;
            }
            
            if (format === 'html' || format === 'all') {
                const htmlContent = this.convertMarkdownToHTML(documentation, repositoryId);
                const htmlFileName = `${baseFileName}.html`;
                const htmlFilePath = path.join(this.docsDir, htmlFileName);
                await fs.writeFile(htmlFilePath, htmlContent, 'utf-8');
                files.html = htmlFilePath;
            }
            
            if (format === 'pdf' || format === 'all') {
                const pdfFileName = `${baseFileName}.pdf`;
                const pdfFilePath = path.join(this.docsDir, pdfFileName);
                await this.convertMarkdownToPDF(documentation, pdfFilePath, repositoryId);
                files.pdf = pdfFilePath;
            }
            
            if (format === 'json' || format === 'all') {
                const jsonData = this.convertMarkdownToJSON(documentation);
                const jsonFileName = `${baseFileName}.json`;
                const jsonFilePath = path.join(this.docsDir, jsonFileName);
                await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
                files.json = jsonFilePath;
            }

            return {
                success: true,
                files: files,
                baseFileName: baseFileName
            };
        } catch (error) {
            console.error('Error saving documentation:', error);
            throw new Error(`Failed to save documentation: ${error.message}`);
        }
    }

    convertMarkdownToHTML(markdown, repositoryId) {
        const htmlContent = marked.parse(markdown);
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation - ${repositoryId}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 1em;
        }
        
        h1 {
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5em;
        }
        
        h2 {
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 0.3em;
        }
        
        code {
            background-color: #f8f9fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            color: #e74c3c;
        }
        
        pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin-left: 0;
            padding-left: 1em;
            color: #7f8c8d;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        
        th, td {
            border: 1px solid #bdc3c7;
            padding: 0.5em;
            text-align: left;
        }
        
        th {
            background-color: #ecf0f1;
            font-weight: bold;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2em;
            padding: 1em;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
        }
        
        .toc {
            background-color: #f8f9fa;
            padding: 1em;
            border-radius: 5px;
            margin: 2em 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 3em;
            padding: 1em;
            border-top: 1px solid #bdc3c7;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Project Documentation</h1>
        <p>Repository: <strong>${repositoryId}</strong></p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="content">
        ${htmlContent}
    </div>
    
    <div class="footer">
        <p>Generated by Echo - AI-powered documentation generator</p>
        <p>© ${new Date().getFullYear()} Randish Echo</p>
    </div>
</body>
</html>`;
    }

    async convertMarkdownToPDF(markdown, outputPath, repositoryId) {
        let browser = null;
        
        try {
            const htmlContent = this.convertMarkdownToHTML(markdown, repositoryId);
            
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
        } catch (error) {
            console.error('Error converting to PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    convertMarkdownToJSON(markdown) {
        const lines = markdown.split('\n');
        const sections = [];
        let currentSection = null;
        let content = '';
        
        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (headingMatch) {
                if (currentSection) {
                    currentSection.content = content.trim();
                    sections.push(currentSection);
                }
                
                currentSection = {
                    level: headingMatch[1].length,
                    title: headingMatch[2].trim(),
                    content: ''
                };
                content = '';
            } else {
                content += line + '\n';
            }
        }
        
        if (currentSection) {
            currentSection.content = content.trim();
            sections.push(currentSection);
        }
        
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                generator: 'Echo Documentation Service',
                format: 'json',
                version: '1.0.0'
            },
            content: {
                raw: markdown,
                sections: sections,
                wordCount: markdown.split(/\s+/).length,
                characterCount: markdown.length
            }
        };
    }

    async loadDocumentation(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);
            
            return {
                success: true,
                content: content,
                size: stats.size,
                modifiedAt: stats.mtime,
                createdAt: stats.birthtime
            };
        } catch (error) {
            console.error('Error loading documentation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteDocumentation(filePaths) {
        const results = [];
        
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
                results.push({
                    filePath: filePath,
                    success: true
                });
            } catch (error) {
                console.error(`Error deleting ${filePath}:`, error);
                results.push({
                    filePath: filePath,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    async listDocumentationFiles(repositoryId = null) {
        try {
            const files = await fs.readdir(this.docsDir);
            let filteredFiles = files;
            
            if (repositoryId) {
                const sanitizedRepoId = repositoryId.replace('/', '_');
                filteredFiles = files.filter(file => file.startsWith(sanitizedRepoId));
            }
            
            const fileDetails = [];
            
            for (const file of filteredFiles) {
                const filePath = path.join(this.docsDir, file);
                const stats = await fs.stat(filePath);
                
                fileDetails.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    extension: path.extname(file)
                });
            }
            
            return fileDetails.sort((a, b) => b.modifiedAt - a.modifiedAt);
        } catch (error) {
            console.error('Error listing documentation files:', error);
            return [];
        }
    }

    async cleanupOldFiles(daysOld = 30) {
        try {
            const files = await this.listDocumentationFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const filesToDelete = files
                .filter(file => file.modifiedAt < cutoffDate)
                .map(file => file.path);
            
            if (filesToDelete.length > 0) {
                const results = await this.deleteDocumentation(filesToDelete);
                console.log(`Cleaned up ${filesToDelete.length} old documentation files`);
                return results;
            }
            
            return [];
        } catch (error) {
            console.error('Error cleaning up old files:', error);
            return [];
        }
    }

    generateTableOfContents(markdown) {
        const lines = markdown.split('\n');
        const toc = [];
        
        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (headingMatch) {
                const level = headingMatch[1].length;
                const title = headingMatch[2].trim();
                const anchor = title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-');
                
                toc.push({
                    level: level,
                    title: title,
                    anchor: anchor
                });
            }
        }
        
        return toc;
    }

    async getDocumentationStats() {
        try {
            const files = await this.listDocumentationFiles();
            
            const stats = {
                totalFiles: files.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0),
                fileTypes: {},
                createdToday: 0,
                createdThisWeek: 0,
                createdThisMonth: 0
            };
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const ext = file.extension || 'no-extension';
                stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
                
                if (file.createdAt >= today) stats.createdToday++;
                if (file.createdAt >= weekAgo) stats.createdThisWeek++;
                if (file.createdAt >= monthAgo) stats.createdThisMonth++;
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting documentation stats:', error);
            return null;
        }
    }
}

module.exports = DocumentationService;