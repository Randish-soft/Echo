const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    githubId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String
    },
    githubAccessToken: {
        type: String,
        required: true
    },
    profileUrl: {
        type: String
    },
    bio: {
        type: String
    },
    location: {
        type: String
    },
    company: {
        type: String
    },
    blog: {
        type: String
    },
    publicRepos: {
        type: Number,
        default: 0
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    settings: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            browser: {
                type: Boolean,
                default: true
            }
        },
        defaultDocumentationType: {
            type: String,
            enum: ['internal', 'external', 'api', 'readme'],
            default: 'readme'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        }
    },
    subscription: {
        isActive: {
            type: Boolean,
            default: false
        },
        stripeCustomerId: String,
        stripeSubscriptionId: String,
        currentPeriodEnd: Date
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.githubAccessToken;
    return userObject;
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

userSchema.statics.findByGithubId = function(githubId) {
    return this.findOne({ githubId });
};

const User = mongoose.model('User', userSchema);

module.exports = User;