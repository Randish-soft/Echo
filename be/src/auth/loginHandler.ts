import { RequestHandler } from "express";
import bcrypt from "bcryptjs";  // For password hashing
import jwt from "jsonwebtoken";
import { Pool } from "pg";       // PostgreSQL pool

// Make sure your .env has PGHOST, PGUSER, etc. set
const pool = new Pool();

export const loginHandler: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    // Basic checks
    if (!username || !password) {
        res.status(400).json({ message: "Username and password are required." });
        return;  // Stop function execution
    }

    try {
        // Query the DB for a user with "email" matching "username"
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [username]);
        const user = result.rows[0];

        // If no user found
        if (!user) {
            res.status(401).json({ message: "Invalid username or password." });
            return;
        }

        // Compare the password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid username or password." });
            return;
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user.id, username: user.email },   // payload
            process.env.JWT_SECRET!,                 // secret key (make sure it's in .env)
            { expiresIn: "1h" }                     // token expiry
        );

        // Send success response with token
        res.status(200).json({ token, username: user.email });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};
