const mongoose = require('mongoose');

const documentationSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['internal', 'external', 'api', 'readme', 'technical', 'user-guide'],
        required: true
    },
    format: {
        type: String,
        enum: ['markdown', 'html', 'pdf', 'json'],
        default: 'markdown'
    },
    content: {
        type: String,
        required: true
    },
    htmlContent: String,
    sections: [{
        title: String,
        content: String,
        order: Number,
        level: {
            type: Number,
            min: 1,
            max: 6
        }
    }],
    metadata: {
        wordCount: {
            type: Number,
            default: 0
        },
        readingTime: {
            type: Number,
            default: 0
        },
        lastGenerated: {
            type: Date,
            default: Date.now
        },
        aiModel: {
            type: String,
            default: 'gpt-4o'
        },
        tokensUsed: {
            type: Number,
            default: 0
        },
        processingTime: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed', 'archived'],
        default: 'generating'
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    tags: [String],
    isPublic: {
        type: Boolean,
        default: false
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    fileUrls: {
        markdown: String,
        html: String,
        pdf: String,
        json: String
    },
    generationSettings: {
        includeCodeExamples: {
            type: Boolean,
            default: true
        },
        includeApiDocs: {
            type: Boolean,
            default: true
        },
        includeInstallation: {
            type: Boolean,
            default: true
        },
        includeUsage: {
            type: Boolean,
            default: true
        },
        includeTroubleshooting: {
            type: Boolean,
            default: true
        },
        tone: {
            type: String,
            enum: ['formal', 'casual', 'technical', 'beginner-friendly'],
            default: 'technical'
        },
        audience: {
            type: String,
            enum: ['developers', 'end-users', 'maintainers', 'contributors'],
            default: 'developers'
        }
    },
    customPrompt: String,
    error: {
        message: String,
        stack: String,
        timestamp: Date
    }
}, {
    timestamps: true
});

documentationSchema.index({ repositoryId: 1, type: 1 });
documentationSchema.index({ userId: 1 });
documentationSchema.index({ status: 1 });
documentationSchema.index({ isPublic: 1 });

documentationSchema.methods.updateWordCount = function() {
    if (this.content) {
        this.metadata.wordCount = this.content.split(/\s+/).length;
        this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
    }
    return this.save();
};

documentationSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

documentationSchema.methods.incrementDownloadCount = function() {
    this.downloadCount += 1;
    return this.save();
};

documentationSchema.statics.findByRepository = function(repositoryId) {
    return this.find({ repositoryId }).sort({ createdAt: -1 });
};

documentationSchema.statics.findPublic = function() {
    return this.find({ isPublic: true, status: 'completed' }).sort({ createdAt: -1 });
};

const Documentation = mongoose.model('Documentation', documentationSchema);

module.exports = Documentation;