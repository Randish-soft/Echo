// be/src/auth/authRouter.ts
import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const router = express.Router();
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5173/link-github';

const pool = new Pool();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Helper
const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

// ====== GitHub OAuth: Step 1 ======
router.get('/github', (req: Request, res: Response) => {
    const backendCallbackUrl = `http://localhost:${process.env.PORT || 5000}/auth/github/callback`;
    const authorizeUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${CLIENT_ID}&redirect_uri=${backendCallbackUrl}&scope=repo`;

    console.log(`Redirecting to GitHub OAuth: ${authorizeUrl}`);
    res.redirect(authorizeUrl);
});

// ====== GitHub OAuth: Step 2 ======
router.get('/github/callback', asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ message: 'GitHub code is missing' });
    }

    // Exchange the code for an access token
    const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
        { headers: { accept: 'application/json' } }
    );
    const { access_token } = tokenResponse.data;
    console.log('GitHub Access Token:', access_token);

    if (!access_token) {
        return res.status(400).json({ message: 'Access token not received from GitHub' });
    }

    // redirect back to the front end with ?token=<access_token>
    res.redirect(`${FRONTEND_REDIRECT_URI}?token=${access_token}`);
}));

// ====== GitHub: fetch user’s repos ======
router.get('/github/repos', asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token missing' });
    }

    const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    res.json(response.data);
}));

// ====== Local Login / Signup ======
// Example sign-up route
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    // check if email or username in use
    const existing = await pool.query('SELECT * FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email or username already taken' });
    }

    // hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // insert
    const result = await pool.query(
        `INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, username`,
        [email, username, hashedPassword]
    );
    const newUser = result.rows[0];

    // create JWT
    const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ message: 'Sign-up successful!', token, username: newUser.username });
}));

// Example login route
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // find user by username
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = result.rows[0];
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // generate JWT
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token, username: user.username });
}));

export default router;
