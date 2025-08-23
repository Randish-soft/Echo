const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
    repositoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branch: {
        type: String,
        default: 'main'
    },
    commitSha: String,
    analysisId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        currentStep: {
            type: String,
            enum: ['fetching', 'cloning', 'fragmenting', 'analyzing', 'generating'],
            default: 'fetching'
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        message: String
    },
    files: [{
        path: String,
        name: String,
        extension: String,
        size: Number,
        language: String,
        complexity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        linesOfCode: Number,
        functions: Number,
        classes: Number,
        imports: Number,
        exports: Number
    }],
    chunks: [{
        id: String,
        fileName: String,
        filePath: String,
        extension: String,
        startLine: Number,
        endLine: Number,
        estimatedTokens: Number,
        chunkNumber: Number,
        totalChunks: Number,
        analyzed: {
            type: Boolean,
            default: false
        },
        analysis: String
    }],
    projectAnalysis: {
        scope: String,
        architecture: String,
        technologies: [String],
        dependencies: [{
            name: String,
            version: String,
            type: {
                type: String,
                enum: ['dependency', 'devDependency', 'peerDependency']
            }
        }],
        mainFeatures: [String],
        entryPoints: [String],
        apiEndpoints: [{
            method: String,
            path: String,
            description: String,
            parameters: [{
                name: String,
                type: String,
                required: Boolean,
                description: String
            }]
        }],
        databaseSchemas: [{
            name: String,
            fields: [{
                name: String,
                type: String,
                required: Boolean,
                description: String
            }]
        }],
        interconnectivity: String,
        complexity: {
            type: String,
            enum: ['low', 'medium', 'high', 'very-high'],
            default: 'medium'
        }
    },
    statistics: {
        totalFiles: {
            type: Number,
            default: 0
        },
        totalLines: {
            type: Number,
            default: 0
        },
        totalChunks: {
            type: Number,
            default: 0
        },
        processedChunks: {
            type: Number,
            default: 0
        },
        languageBreakdown: [{
            language: String,
            fileCount: Number,
            lineCount: Number,
            percentage: Number
        }],
        fileTypes: [{
            extension: String,
            count: Number,
            percentage: Number
        }]
    },
    performance: {
        startTime: {
            type: Date,
            default: Date.now
        },
        endTime: Date,
        totalDuration: Number,
        stepDurations: {
            fetching: Number,
            cloning: Number,
            fragmenting: Number,
            analyzing: Number
        },
        tokensUsed: {
            type: Number,
            default: 0
        },
        apiCalls: {
            type: Number,
            default: 0
        }
    },
    error: {
        message: String,
        stack: String,
        step: String,
        timestamp: Date
    },
    analysisFile: {
        path: String,
        size: Number,
        content: String
    }
}, {
    timestamps: true
});

analysisResultSchema.index({ repositoryId: 1 });
analysisResultSchema.index({ userId: 1 });
analysisResultSchema.index({ analysisId: 1 }, { unique: true });
analysisResultSchema.index({ status: 1 });
analysisResultSchema.index({ 'progress.currentStep': 1 });

analysisResultSchema.methods.updateProgress = function(step, percentage, message) {
    this.progress.currentStep = step;
    this.progress.percentage = percentage;
    if (message) {
        this.progress.message = message;
    }
    return this.save();
};

analysisResultSchema.methods.markCompleted = function() {
    this.status = 'completed';
    this.performance.endTime = new Date();
    this.performance.totalDuration = this.performance.endTime - this.performance.startTime;
    this.progress.percentage = 100;
    return this.save();
};

analysisResultSchema.methods.markFailed = function(error) {
    this.status = 'failed';
    this.error = {
        message: error.message,
        stack: error.stack,
        step: this.progress.currentStep,
        timestamp: new Date()
    };
    return this.save();
};

analysisResultSchema.statics.findByRepository = function(repositoryId) {
    return this.find({ repositoryId }).sort({ createdAt: -1 });
};

const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);

module.exports = AnalysisResult;