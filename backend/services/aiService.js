const { analyzeCodeChunk, generateProjectOverview, generateDocumentation, improveDocumentation } = require('../config/openai');

class AIService {
    constructor() {
        this.tokensUsed = 0;
        this.apiCalls = 0;
    }

    async analyzeChunks(chunks, repositoryInfo, progressCallback) {
        const analyzedChunks = [];
        let processedCount = 0;

        for (const chunk of chunks) {
            try {
                const projectContext = `Repository: ${repositoryInfo.fullName}, Language: ${repositoryInfo.language}, Description: ${repositoryInfo.description}`;
                
                const result = await analyzeCodeChunk(chunk, projectContext);
                
                if (result.success) {
                    chunk.analyzed = true;
                    chunk.analysis = result.analysis;
                    this.tokensUsed += result.tokensUsed;
                    this.apiCalls++;
                } else {
                    chunk.analyzed = false;
                    chunk.analysis = `Analysis failed: ${result.error}`;
                }

                analyzedChunks.push(chunk);
                processedCount++;

                if (progressCallback) {
                    const percentage = Math.round((processedCount / chunks.length) * 100);
                    await progressCallback('analyzing', percentage, `Analyzed ${processedCount}/${chunks.length} code chunks`);
                }

                await this.delay(100);
            } catch (error) {
                console.error(`Error analyzing chunk ${chunk.id}:`, error);
                chunk.analyzed = false;
                chunk.analysis = `Analysis error: ${error.message}`;
                analyzedChunks.push(chunk);
                processedCount++;
            }
        }

        return analyzedChunks;
    }

    async generateProjectAnalysis(chunks, repositoryInfo) {
        try {
            const analysisContent = this.compileAnalysisContent(chunks);
            
            const result = await generateProjectOverview(analysisContent, repositoryInfo);
            
            if (result.success) {
                this.tokensUsed += result.tokensUsed;
                this.apiCalls++;
                
                return {
                    success: true,
                    overview: result.overview,
                    tokensUsed: result.tokensUsed
                };
            } else {
                return {
                    success: false,
                    error: result.error,
                    overview: null
                };
            }
        } catch (error) {
            console.error('Error generating project analysis:', error);
            return {
                success: false,
                error: error.message,
                overview: null
            };
        }
    }

    async generateDocumentationContent(chunks, repositoryInfo, documentationType, customPrompt = '') {
        try {
            const analysisContent = this.compileAnalysisContent(chunks);
            
            const result = await generateDocumentation(
                analysisContent,
                repositoryInfo,
                documentationType,
                customPrompt
            );
            
            if (result.success) {
                this.tokensUsed += result.tokensUsed;
                this.apiCalls++;
                
                return {
                    success: true,
                    documentation: result.documentation,
                    tokensUsed: result.tokensUsed,
                    model: result.model
                };
            } else {
                return {
                    success: false,
                    error: result.error,
                    documentation: null
                };
            }
        } catch (error) {
            console.error('Error generating documentation:', error);
            return {
                success: false,
                error: error.message,
                documentation: null
            };
        }
    }

    async improveExistingDocumentation(existingDoc, feedback, repositoryInfo) {
        try {
            const result = await improveDocumentation(existingDoc, feedback, repositoryInfo);
            
            if (result.success) {
                this.tokensUsed += result.tokensUsed;
                this.apiCalls++;
                
                return {
                    success: true,
                    improvedDoc: result.improvedDoc,
                    tokensUsed: result.tokensUsed
                };
            } else {
                return {
                    success: false,
                    error: result.error,
                    improvedDoc: null
                };
            }
        } catch (error) {
            console.error('Error improving documentation:', error);
            return {
                success: false,
                error: error.message,
                improvedDoc: null
            };
        }
    }

    compileAnalysisContent(chunks) {
        let content = '';
        
        for (const chunk of chunks) {
            if (chunk.analyzed && chunk.analysis) {
                content += `${chunk.filePath}.${chunk.extension.replace('.', '')}\n`;
                content += `${chunk.analysis}\n`;
                content += '—\n';
            }
        }
        
        return content;
    }

    generateProjectStatistics(chunks, files) {
        const stats = {
            totalFiles: files.length,
            totalLines: 0,
            totalChunks: chunks.length,
            processedChunks: chunks.filter(c => c.analyzed).length,
            languageBreakdown: {},
            fileTypes: {}
        };

        for (const file of files) {
            const lines = file.content ? file.content.split('\n').length : 0;
            stats.totalLines += lines;

            const ext = file.extension || 'no-extension';
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

            const language = this.getLanguageFromExtension(file.extension);
            if (!stats.languageBreakdown[language]) {
                stats.languageBreakdown[language] = { fileCount: 0, lineCount: 0 };
            }
            stats.languageBreakdown[language].fileCount++;
            stats.languageBreakdown[language].lineCount += lines;
        }

        const totalFiles = stats.totalFiles;
        const totalLines = stats.totalLines;

        stats.languageBreakdown = Object.entries(stats.languageBreakdown).map(([language, data]) => ({
            language,
            fileCount: data.fileCount,
            lineCount: data.lineCount,
            percentage: ((data.fileCount / totalFiles) * 100).toFixed(2)
        })).sort((a, b) => b.fileCount - a.fileCount);

        stats.fileTypes = Object.entries(stats.fileTypes).map(([extension, count]) => ({
            extension,
            count,
            percentage: ((count / totalFiles) * 100).toFixed(2)
        })).sort((a, b) => b.count - a.count);

        return stats;
    }

    getLanguageFromExtension(extension) {
        const languageMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React JSX',
            '.tsx': 'React TSX',
            '.py': 'Python',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.md': 'Markdown',
            '.json': 'JSON',
            '.yml': 'YAML',
            '.yaml': 'YAML',
            '.xml': 'XML',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.dockerfile': 'Docker'
        };

        return languageMap[extension?.toLowerCase()] || 'Unknown';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getUsageStats() {
        return {
            tokensUsed: this.tokensUsed,
            apiCalls: this.apiCalls
        };
    }

    resetUsageStats() {
        this.tokensUsed = 0;
        this.apiCalls = 0;
    }
}

module.exports = AIService;