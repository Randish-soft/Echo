// be/src/auth/signup/something.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

export const signupHandler: RequestHandler = (req, res, next) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required." });
        return; // Explicitly return to satisfy TypeScript
    }

    // TODO: Add your actual DB calls, hashing, validation, etc.

    res.status(200).json({
        message: "Sign-up successful!",
        email,
        rememberMe
    });
};
