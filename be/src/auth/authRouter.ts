import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/link-github';

// Middleware to wrap async functions and catch errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

// Step 1: Redirect user to GitHub OAuth page
router.get('/github', (req: Request, res: Response) => {
    const backendCallbackUrl = `http://localhost:${process.env.PORT || 5000}/auth/github/callback`;

    const authorizeUrl = `https://github.com/login/oauth/authorize`
        + `?client_id=${CLIENT_ID}`
        + `&redirect_uri=${backendCallbackUrl}`
        + `&scope=repo`;

    console.log(`Redirecting to GitHub OAuth: ${authorizeUrl}`);
    res.redirect(authorizeUrl);
});

// Step 2: GitHub calls this endpoint with ?code=...
router.get('/github/callback', asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        res.status(400).json({ message: 'GitHub code is missing' });
        return;
    }

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
        res.status(400).json({ message: 'Access token not received from GitHub' });
        return;
    }

    res.redirect(`${FRONTEND_REDIRECT_URI}?token=${access_token}`);
}));

// Step 3: Fetch the user’s GitHub repositories
router.get('/github/repos', asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Access token is missing' });
        return;
    }

    // Fetch user's GitHub repositories
    const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    console.log('Fetched Repositories:', response.data.length);
    res.json(response.data);
}));

export default router;
