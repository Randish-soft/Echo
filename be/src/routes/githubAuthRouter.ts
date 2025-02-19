import { Router } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const githubAuthRouter = Router();

interface GitHubTokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
    token_type?: string;
    scope?: string;
}

githubAuthRouter.get('/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    const scope = 'repo';

    const githubAuthorizeUrl =
        `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    return res.redirect(githubAuthorizeUrl);
});

githubAuthRouter.get('/github/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
        return res.status(400).send('No code provided in the query string.');
    }

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID || '',
                client_secret: process.env.GITHUB_CLIENT_SECRET || '',
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI || '',
            }),
        });

        // Cast the JSON to our interface
        const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

        if (tokenData.error) {
            return res
                .status(401)
                .send(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
        }

        const githubAccessToken = tokenData.access_token;
        if (!githubAccessToken) {
            return res.status(401).send('No access token returned from GitHub');
        }

        const frontEndUrl = process.env.FRONTEND_URL || 'http://localhost:3000/link-github';
        return res.redirect(`${frontEndUrl}?token=${githubAccessToken}`);
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        return res.status(500).send('Server error during GitHub OAuth');
    }
});

export default githubAuthRouter;
