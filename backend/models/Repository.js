const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
    githubId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    owner: {
        login: {
            type: String,
            required: true
        },
        id: {
            type: Number,
            required: true
        },
        avatarUrl: String,
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: String,
    private: {
        type: Boolean,
        default: false
    },
    language: String,
    languages: [{
        name: String,
        percentage: Number,
        bytes: Number
    }],
    topics: [String],
    defaultBranch: {
        type: String,
        default: 'main'
    },
    size: {
        type: Number,
        default: 0
    },
    stargazersCount: {
        type: Number,
        default: 0
    },
    watchersCount: {
        type: Number,
        default: 0
    },
    forksCount: {
        type: Number,
        default: 0
    },
    openIssuesCount: {
        type: Number,
        default: 0
    },
    license: {
        key: String,
        name: String,
        spdxId: String
    },
    htmlUrl: String,
    cloneUrl: String,
    sshUrl: String,
    gitUrl: String,
    lastCommitSha: String,
    lastCommitDate: Date,
    pushedAt: Date,
    createdAt: Date,
    updatedAt: Date,
    isArchived: {
        type: Boolean,
        default: false
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    isFork: {
        type: Boolean,
        default: false
    },
    hasWiki: {
        type: Boolean,
        default: false
    },
    hasPages: {
        type: Boolean,
        default: false
    },
    hasDownloads: {
        type: Boolean,
        default: false
    },
    hasIssues: {
        type: Boolean,
        default: false
    },
    hasProjects: {
        type: Boolean,
        default: false
    },
    lastAnalyzed: Date,
    analysisStatus: {
        type: String,
        enum: ['pending', 'analyzing', 'completed', 'failed'],
        default: 'pending'
    },
    fileCount: {
        type: Number,
        default: 0
    },
    totalLines: {
        type: Number,
        default: 0
    },
    documentationCount: {
        type: Number,
        default: 0
    },
    settings: {
        includeTests: {
            type: Boolean,
            default: false
        },
        includeNodeModules: {
            type: Boolean,
            default: false
        },
        maxFileSize: {
            type: Number,
            default: 1000000
        },
        excludedPaths: [String],
        includedExtensions: [String]
    }
}, {
    timestamps: true
});

repositorySchema.index({ userId: 1, fullName: 1 });
repositorySchema.index({ githubId: 1 });
repositorySchema.index({ 'owner.login': 1, name: 1 });

repositorySchema.methods.updateAnalysisStatus = function(status) {
    this.analysisStatus = status;
    if (status === 'completed') {
        this.lastAnalyzed = new Date();
    }
    return this.save();
};

repositorySchema.statics.findByFullName = function(fullName) {
    return this.findOne({ fullName });
};

repositorySchema.statics.findByGithubId = function(githubId) {
    return this.findOne({ githubId });
};

const Repository = mongoose.model('Repository', repositorySchema);

module.exports = Repository;