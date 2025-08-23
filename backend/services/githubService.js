const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.maxFileSize = 1000000;
        this.excludedDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'venv', '__pycache__', '.vscode', '.idea', 'coverage', '.nyc_output'];
        this.excludedFiles = ['.env', '.env.local', '.env.production', 'package-lock.json', 'yarn.lock', '.DS_Store'];
        this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.md', '.json', '.yml', '.yaml', '.xml', '.html', '.css', '.scss', '.sql', '.sh', '.dockerfile'];
    }

    async fetchRepository(owner, repo, accessToken) {
        try {
            const headers = {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const repoResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, { headers });
            const repoData = repoResponse.data;

            const userResponse = await axios.get(`${this.baseURL}/user`, { headers });
            const userData = userResponse.data;

            const isOwner = repoData.owner.login === userData.login;
            let isCollaborator = false;

            if (!isOwner) {
                try {
                    await axios.get(`${this.baseURL}/repos/${owner}/${repo}/collaborators/${userData.login}`, { headers });
                    isCollaborator = true;
                } catch (error) {
                    if (error.response?.status !== 404) {
                        throw error;
                    }
                }
            }

            if (!isOwner && !isCollaborator) {
                throw new Error('User does not have access to this repository');
            }

            return {
                repository: repoData,
                user: userData,
                hasAccess: true
            };
        } catch (error) {
            console.error('Error fetching repository:', error);
            throw new Error(`Failed to fetch repository: ${error.message}`);
        }
    }

    async cloneRepository(owner, repo, accessToken, branch = 'main') {
        try {
            const headers = {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const treeResponse = await axios.get(
                `${this.baseURL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
                { headers }
            );

            const files = [];
            const tree = treeResponse.data.tree;

            for (const item of tree) {
                if (item.type === 'blob' && this.shouldIncludeFile(item.path)) {
                    try {
                        const fileResponse = await axios.get(
                            `${this.baseURL}/repos/${owner}/${repo}/contents/${item.path}?ref=${branch}`,
                            { headers }
                        );

                        const fileData = fileResponse.data;
                        
                        if (fileData.size > this.maxFileSize) {
                            console.log(`Skipping large file: ${item.path} (${fileData.size} bytes)`);
                            continue;
                        }

                        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                        
                        files.push({
                            path: item.path,
                            name: path.basename(item.path),
                            extension: path.extname(item.path),
                            size: fileData.size,
                            content: content,
                            sha: item.sha
                        });
                    } catch (error) {
                        console.error(`Error fetching file ${item.path}:`, error.message);
                    }
                }
            }

            return {
                repositoryId: `${owner}/${repo}`,
                branch: branch,
                files: files,
                totalFiles: files.length,
                clonedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw new Error(`Failed to clone repository: ${error.message}`);
        }
    }

    async fragmentFiles(files, maxTokens = 3000) {
        const chunks = [];
        const chunkId = uuidv4();

        for (const file of files) {
            if (!file.content) continue;

            const lines = file.content.split('\n');
            const estimatedTokens = this.estimateTokens(file.content);

            if (estimatedTokens <= maxTokens) {
                chunks.push({
                    id: `${chunkId}_${chunks.length}`,
                    fileName: file.name,
                    filePath: file.path,
                    extension: file.extension,
                    content: file.content,
                    startLine: 1,
                    endLine: lines.length,
                    estimatedTokens: estimatedTokens,
                    chunkNumber: 1,
                    totalChunks: 1
                });
            } else {
                const chunkSize = Math.ceil(lines.length / Math.ceil(estimatedTokens / maxTokens));
                let chunkNumber = 1;
                const totalChunks = Math.ceil(lines.length / chunkSize);

                for (let i = 0; i < lines.length; i += chunkSize) {
                    const chunkLines = lines.slice(i, i + chunkSize);
                    const chunkContent = chunkLines.join('\n');
                    
                    chunks.push({
                        id: `${chunkId}_${chunks.length}`,
                        fileName: file.name,
                        filePath: file.path,
                        extension: file.extension,
                        content: chunkContent,
                        startLine: i + 1,
                        endLine: Math.min(i + chunkSize, lines.length),
                        estimatedTokens: this.estimateTokens(chunkContent),
                        chunkNumber: chunkNumber,
                        totalChunks: totalChunks
                    });
                    
                    chunkNumber++;
                }
            }
        }

        return chunks;
    }

    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }

    shouldIncludeFile(filePath) {
        for (const dir of this.excludedDirs) {
            if (filePath.includes(`/${dir}/`) || filePath.startsWith(`${dir}/`)) {
                return false;
            }
        }

        const fileName = path.basename(filePath);
        if (this.excludedFiles.includes(fileName)) {
            return false;
        }

        const extension = path.extname(filePath);
        if (!extension) {
            const specialFiles = ['Dockerfile', 'Makefile', 'README', 'LICENSE', 'CHANGELOG'];
            return specialFiles.some(special => fileName.toUpperCase().includes(special.toUpperCase()));
        }

        return this.supportedExtensions.includes(extension.toLowerCase());
    }

    async saveAnalysisFile(analysisData, repositoryId) {
        try {
            const analysisDir = process.env.ANALYSIS_DIR || './analysis';
            await fs.mkdir(analysisDir, { recursive: true });

            const fileName = `${repositoryId.replace('/', '_')}_analysis.txt`;
            const filePath = path.join(analysisDir, fileName);

            let content = '';
            for (const chunk of analysisData.chunks) {
                if (chunk.analysis) {
                    content += `${chunk.filePath}.${chunk.extension.replace('.', '')}\n`;
                    content += `${chunk.analysis}\n`;
                    content += '—\n';
                }
            }

            await fs.writeFile(filePath, content, 'utf-8');

            return {
                success: true,
                filePath: filePath,
                fileName: fileName,
                size: content.length
            };
        } catch (error) {
            console.error('Error saving analysis file:', error);
            throw new Error(`Failed to save analysis file: ${error.message}`);
        }
    }

    async getRepositoryLanguages(owner, repo, accessToken) {
        try {
            const headers = {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, { headers });
            const languages = response.data;

            const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
            const languageStats = Object.entries(languages).map(([name, bytes]) => ({
                name,
                bytes,
                percentage: ((bytes / total) * 100).toFixed(2)
            })).sort((a, b) => b.bytes - a.bytes);

            return languageStats;
        } catch (error) {
            console.error('Error fetching repository languages:', error);
            return [];
        }
    }

    async getRepositoryContributors(owner, repo, accessToken) {
        try {
            const headers = {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, { headers });
            return response.data;
        } catch (error) {
            console.error('Error fetching repository contributors:', error);
            return [];
        }
    }

    async getRepositoryCommits(owner, repo, accessToken, limit = 10) {
        try {
            const headers = {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            const response = await axios.get(
                `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=${limit}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching repository commits:', error);
            return [];
        }
    }
}

module.exports = GitHubService;