// src/auth/authRouter.ts
import { Router } from "express";
import { signupHandler } from "./signup/something";  // only signupHandler

const authRouter = Router();

// POST /auth/signup
authRouter.post("/signup", signupHandler);

// No verify route since we removed email logic
// authRouter.get("/verify", verifyHandler);

export default authRouter;
