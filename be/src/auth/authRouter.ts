// src/auth/authRouter.ts
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
// This is where we send the user (the FRONTEND) AFTER we get their GitHub token
// E.g. http://localhost:3000/link-github
const FRONTEND_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/link-github';

// Step 1: Redirect user to GitHub OAuth page
router.get('/github', (req: Request, res: Response) => {
    // The backend callback route that GitHub calls after user authorizes
    // e.g.: http://localhost:5000/auth/github/callback
    const backendCallbackUrl = `http://localhost:${process.env.PORT || 5000}/auth/github/callback`;

    const authorizeUrl = `https://github.com/login/oauth/authorize`
        + `?client_id=${CLIENT_ID}`
        + `&redirect_uri=${backendCallbackUrl}`
        + `&scope=repo`;

    console.log(`Redirecting to GitHub OAuth: ${authorizeUrl}`);
    res.redirect(authorizeUrl);
});

// Step 2: GitHub calls this endpoint with ?code=...
//         We exchange code for an access token
router.get('/github/callback', async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ message: 'GitHub code is missing' });
    }

    try {
        // Exchange the code for an access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            },
            { headers: { accept: 'application/json' } }
        );

        const { access_token } = tokenResponse.data;
        console.log('Received GitHub Access Token:', access_token);

        if (!access_token) {
            return res.status(400).json({ message: 'Access token not received from GitHub' });
        }

        // Now redirect the user to your *frontend* so it can read the token
        // Example: http://localhost:3000/link-github?token=abcdef12345
        res.redirect(`${FRONTEND_REDIRECT_URI}?token=${access_token}`);
    } catch (error) {
        console.error('Error during GitHub OAuth process:', (error as any).message);
        res.status(500).json({
            message: 'GitHub authentication failed',
            error: (error as any).message
        });
    }
});

// Step 3: Fetch the user’s GitHub repositories
//   The frontend calls this endpoint with Authorization: Bearer <token>
router.get('/github/repos', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    try {
        // Make a request to GitHub’s API to get the user’s repos
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        console.log('Fetched Repositories:', response.data.length);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching repositories:', (error as any).message);
        res.status(500).json({
            message: 'Failed to fetch repositories',
            error: (error as any).message
        });
    }
});

export default router;
