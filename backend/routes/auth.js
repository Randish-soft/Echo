const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const scope = 'repo,user:email';
    const state = Math.random().toString(36).substring(7);
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    res.json({
        authUrl: githubAuthUrl,
        state: state
    });
});

router.get('/github/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.status(400).json({
                error: 'Authorization code not provided',
                message: 'GitHub authorization failed'
            });
        }

        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const { access_token } = tokenResponse.data;

        if (!access_token) {
            return res.status(400).json({
                error: 'Failed to get access token',
                message: 'GitHub authentication failed'
            });
        }

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${access_token}`
            }
        });

        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `token ${access_token}`
            }
        });

        const githubUser = userResponse.data;
        const emails = emailResponse.data;
        const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email;

        let user = await User.findByGithubId(githubUser.id.toString());

        if (user) {
            user.githubAccessToken = access_token;
            user.name = githubUser.name || user.name;
            user.email = primaryEmail || user.email;
            user.avatarUrl = githubUser.avatar_url;
            user.profileUrl = githubUser.html_url;
            user.bio = githubUser.bio;
            user.location = githubUser.location;
            user.company = githubUser.company;
            user.blog = githubUser.blog;
            user.publicRepos = githubUser.public_repos;
            user.followers = githubUser.followers;
            user.following = githubUser.following;
            
            await user.updateLastLogin();
        } else {
            user = new User({
                githubId: githubUser.id.toString(),
                username: githubUser.login,
                email: primaryEmail,
                name: githubUser.name || githubUser.login,
                avatarUrl: githubUser.avatar_url,
                githubAccessToken: access_token,
                profileUrl: githubUser.html_url,
                bio: githubUser.bio,
                location: githubUser.location,
                company: githubUser.company,
                blog: githubUser.blog,
                publicRepos: githubUser.public_repos,
                followers: githubUser.followers,
                following: githubUser.following
            });
            
            await user.save();
        }

        const jwtToken = jwt.sign(
            { userId: user._id, githubId: user.githubId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.json({
            success: true,
            token: newToken,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                plan: user.plan,
                settings: user.settings
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            message: 'Unable to refresh authentication token'
        });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Unable to logout properly'
        });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-githubAccessToken');
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            error: 'Failed to get user profile',
            message: 'Unable to retrieve user information'
        });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, bio, location, company, blog } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (company !== undefined) user.company = company;
        if (blog !== undefined) user.blog = blog;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            message: 'Unable to update user profile'
        });
    }
});

router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { notifications, defaultDocumentationType, theme } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        if (notifications) {
            user.settings.notifications = { ...user.settings.notifications, ...notifications };
        }
        
        if (defaultDocumentationType) {
            user.settings.defaultDocumentationType = defaultDocumentationType;
        }
        
        if (theme) {
            user.settings.theme = theme;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: user.settings
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            error: 'Settings update failed',
            message: 'Unable to update user settings'
        });
    }
});

router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        await User.findByIdAndDelete(req.user._id);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            error: 'Account deletion failed',
            message: 'Unable to delete user account'
        });
    }
});

module.exports = router;redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
        }))}`);

    } catch (error) {
        console.error('GitHub auth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
});

router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        const newToken = jwt.sign(
            { userId: user._id, githubId: user.githubId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.