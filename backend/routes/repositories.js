const express = require('express');
const Repository = require('../models/Repository');
const AnalysisResult = require('../models/AnalysisResult');
const GitHubService = require('../services/githubService');
const AIService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const githubService = new GitHubService();

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-updatedAt', search } = req.query;
        
        let query = { userId: req.user._id };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const repositories = await Repository.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Repository.countDocuments(query);

        res.json({
            success: true,
            repositories: repositories,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get repositories error:', error);
        res.status(500).json({
            error: 'Failed to fetch repositories',
            message: error.message
        });
    }
});

router.get('/github', async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, per_page = 30, sort = 'updated', type = 'owner' } = req.query;

        const response = await fetch(`https://api.github.com/user/repos?page=${page}&per_page=${per_page}&sort=${sort}&type=${type}`, {
            headers: {
                'Authorization': `token ${user.githubAccessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();

        const repoData = repos.map(repo => ({
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            language: repo.language,
            defaultBranch: repo.default_branch,
            size: repo.size,
            stargazersCount: repo.stargazers_count,
            watchersCount: repo.watchers_count,
            forksCount: repo.forks_count,
            openIssuesCount: repo.open_issues_count,
            htmlUrl: repo.html_url,
            cloneUrl: repo.clone_url,
            pushedAt: new Date(repo.pushed_at),
            createdAt: new Date(repo.created_at),
            updatedAt: new Date(repo.updated_at),
            owner: {
                login: repo.owner.login,
                id: repo.owner.id,
                avatarUrl: repo.owner.avatar_url,
                type: repo.owner.type
            },
            topics: repo.topics || [],
            license: repo.license ? {
                key: repo.license.key,
                name: repo.license.name,
                spdxId: repo.license.spdx_id
            } : null,
            isArchived: repo.archived,
            isDisabled: repo.disabled,
            isFork: repo.fork,
            hasWiki: repo.has_wiki,
            hasPages: repo.has_pages,
            hasDownloads: repo.has_downloads,
            hasIssues: repo.has_issues,
            hasProjects: repo.has_projects
        }));

        res.json({
            success: true,
            repositories: repoData,
            total: repoData.length
        });

    } catch (error) {
        console.error('Get GitHub repositories error:', error);
        res.status(500).json({
            error: 'Failed to fetch GitHub repositories',
            message: error.message
        });
    }
});

router.post('/sync/:owner/:repo', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const user = req.user;

        const repoData = await githubService.fetchRepository(owner, repo, user.githubAccessToken);

        let existingRepo = await Repository.findOne({ 
            githubId: repoData.repository.id,
            userId: user._id 
        });

        if (existingRepo) {
            Object.assign(existingRepo, {
                name: repoData.repository.name,
                fullName: repoData.repository.full_name,
                description: repoData.repository.description,
                private: repoData.repository.private,
                language: repoData.repository.language,
                defaultBranch: repoData.repository.default_branch,
                size: repoData.repository.size,
                stargazersCount: repoData.repository.stargazers_count,
                watchersCount: repoData.repository.watchers_count,
                forksCount: repoData.repository.forks_count,
                openIssuesCount: repoData.repository.open_issues_count,
                htmlUrl: repoData.repository.html_url,
                cloneUrl: repoData.repository.clone_url,
                pushedAt: new Date(repoData.repository.pushed_at),
                updatedAt: new Date(repoData.repository.updated_at),
                topics: repoData.repository.topics || [],
                license: repoData.repository.license ? {
                    key: repoData.repository.license.key,
                    name: repoData.repository.license.name,
                    spdxId: repoData.repository.license.spdx_id
                } : null,
                isArchived: repoData.repository.archived,
                isDisabled: repoData.repository.disabled,
                isFork: repoData.repository.fork
            });

            await existingRepo.save();
        } else {
            existingRepo = new Repository({
                githubId: repoData.repository.id,
                name: repoData.repository.name,
                fullName: repoData.repository.full_name,
                description: repoData.repository.description,
                private: repoData.repository.private,
                language: repoData.repository.language,
                defaultBranch: repoData.repository.default_branch,
                size: repoData.repository.size,
                stargazersCount: repoData.repository.stargazers_count,
                watchersCount: repoData.repository.watchers_count,
                forksCount: repoData.repository.forks_count,
                openIssuesCount: repoData.repository.open_issues_count,
                htmlUrl: repoData.repository.html_url,
                cloneUrl: repoData.repository.clone_url,
                pushedAt: new Date(repoData.repository.pushed_at),
                createdAt: new Date(repoData.repository.created_at),
                updatedAt: new Date(repoData.repository.updated_at),
                userId: user._id,
                owner: {
                    login: repoData.repository.owner.login,
                    id: repoData.repository.owner.id,
                    avatarUrl: repoData.repository.owner.avatar_url,
                    type: repoData.repository.owner.type
                },
                topics: repoData.repository.topics || [],
                license: repoData.repository.license ? {
                    key: repoData.repository.license.key,
                    name: repoData.repository.license.name,
                    spdxId: repoData.repository.license.spdx_id
                } : null,
                isArchived: repoData.repository.archived,
                isDisabled: repoData.repository.disabled,
                isFork: repoData.repository.fork,
                hasWiki: repoData.repository.has_wiki,
                hasPages: repoData.repository.has_pages,
                hasDownloads: repoData.repository.has_downloads,
                hasIssues: repoData.repository.has_issues,
                hasProjects: repoData.repository.has_projects
            });

            await existingRepo.save();
        }

        res.json({
            success: true,
            message: 'Repository synced successfully',
            repository: existingRepo
        });

    } catch (error) {
        console.error('Repository sync error:', error);
        res.status(500).json({
            error: 'Failed to sync repository',
            message: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const repository = await Repository.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!repository) {
            return res.status(404).json({
                error: 'Repository not found',
                message: 'Repository not found or access denied'
            });
        }

        res.json({
            success: true,
            repository: repository
        });

    } catch (error) {
        console.error('Get repository error:', error);
        res.status(500).json({
            error: 'Failed to fetch repository',
            message: error.message
        });
    }
});

router.post('/:id/analyze', async (req, res) => {
    try {
        const repository = await Repository.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!repository) {
            return res.status(404).json({
                error: 'Repository not found',
                message: 'Repository not found or access denied'
            });
        }

        const analysisId = uuidv4();
        
        const analysisResult = new AnalysisResult({
            repositoryId: repository._id,
            userId: req.user._id,
            analysisId: analysisId,
            branch: repository.defaultBranch,
            status: 'pending'
        });

        await analysisResult.save();

        repository.analysisStatus = 'analyzing';
        await repository.save();

        const io = req.app.get('io');
        
        processRepositoryAnalysis(repository, req.user, analysisResult, io)
            .catch(error => {
                console.error('Analysis processing error:', error);
            });

        res.json({
            success: true,
            message: 'Repository analysis started',
            analysisId: analysisId
        });

    } catch (error) {
        console.error('Start analysis error:', error);
        res.status(500).json({
            error: 'Failed to start analysis',
            message: error.message
        });
    }
});

router.get('/:id/analysis', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const analyses = await AnalysisResult.find({
            repositoryId: req.params.id,
            userId: req.user._id
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await AnalysisResult.countDocuments({
            repositoryId: req.params.id,
            userId: req.user._id
        });

        res.json({
            success: true,
            analyses: analyses,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get analysis results error:', error);
        res.status(500).json({
            error: 'Failed to fetch analysis results',
            message: error.message
        });
    }
});

router.get('/analysis/:analysisId', async (req, res) => {
    try {
        const analysis = await AnalysisResult.findOne({
            analysisId: req.params.analysisId,
            userId: req.user._id
        }).populate('repositoryId');

        if (!analysis) {
            return res.status(404).json({
                error: 'Analysis not found',
                message: 'Analysis result not found or access denied'
            });
        }

        res.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Get analysis error:', error);
        res.status(500).json({
            error: 'Failed to fetch analysis',
            message: error.message
        });
    }
});

router.put('/:id/settings', async (req, res) => {
    try {
        const { settings } = req.body;
        
        const repository = await Repository.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!repository) {
            return res.status(404).json({
                error: 'Repository not found',
                message: 'Repository not found or access denied'
            });
        }

        repository.settings = { ...repository.settings, ...settings };
        await repository.save();

        res.json({
            success: true,
            message: 'Repository settings updated',
            settings: repository.settings
        });

    } catch (error) {
        console.error('Update repository settings error:', error);
        res.status(500).json({
            error: 'Failed to update repository settings',
            message: error.message
        });
    }
});

async function processRepositoryAnalysis(repository, user, analysisResult, io) {
    const aiService = new AIService();
    
    try {
        const emitProgress = async (step, percentage, message) => {
            await analysisResult.updateProgress(step, percentage, message);
            io.to(`user_${user._id}`).emit('analysisProgress', {
                analysisId: analysisResult.analysisId,
                step,
                percentage,
                message
            });
        };

        await emitProgress('fetching', 10, 'Fetching repository information...');

        const repoData = await githubService.fetchRepository(
            repository.owner.login, 
            repository.name, 
            user.githubAccessToken
        );

        await emitProgress('cloning', 25, 'Downloading repository files...');

        const clonedData = await githubService.cloneRepository(
            repository.owner.login,
            repository.name,
            user.githubAccessToken,
            repository.defaultBranch
        );

        analysisResult.files = clonedData.files.map(file => ({
            path: file.path,
            name: file.name,
            extension: file.extension,
            size: file.size,
            language: aiService.getLanguageFromExtension(file.extension),
            linesOfCode: file.content ? file.content.split('\n').length : 0
        }));

        await emitProgress('fragmenting', 40, 'Breaking down files into chunks...');

        const chunks = await githubService.fragmentFiles(clonedData.files);
        analysisResult.chunks = chunks;
        
        await emitProgress('analyzing', 60, 'Analyzing code with AI...');

        const analyzedChunks = await aiService.analyzeChunks(chunks, repository, emitProgress);
        analysisResult.chunks = analyzedChunks;

        const stats = aiService.generateProjectStatistics(analyzedChunks, clonedData.files);
        analysisResult.statistics = stats;

        await emitProgress('generating', 90, 'Generating project overview...');

        const overview = await aiService.generateProjectAnalysis(analyzedChunks, repository);
        if (overview.success) {
            analysisResult.projectAnalysis = {
                scope: overview.overview,
                complexity: 'medium'
            };
        }

        const usageStats = aiService.getUsageStats();
        analysisResult.performance.tokensUsed = usageStats.tokensUsed;
        analysisResult.performance.apiCalls = usageStats.apiCalls;

        await analysisResult.markCompleted();

        repository.analysisStatus = 'completed';
        repository.lastAnalyzed = new Date();
        repository.fileCount = clonedData.files.length;
        repository.totalLines = stats.totalLines;
        await repository.save();

        await emitProgress('completed', 100, 'Analysis completed successfully!');

        io.to(`user_${user._id}`).emit('analysisComplete', {
            analysisId: analysisResult.analysisId,
            repositoryId: repository._id,
            success: true
        });

    } catch (error) {
        console.error('Repository analysis error:', error);
        
        await analysisResult.markFailed(error);
        
        repository.analysisStatus = 'failed';
        await repository.save();

        io.to(`user_${user._id}`).emit('analysisError', {
            analysisId: analysisResult.analysisId,
            repositoryId: repository._id,
            error: error.message
        });
    }
}

module.exports = router;