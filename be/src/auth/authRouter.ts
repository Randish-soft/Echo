import { Router } from "express";
import { signupHandler } from "./signup/something";
import { loginHandler } from "./loginHandler";  // Add the login handler

const authRouter = Router();

// POST /auth/signup
authRouter.post("/signup", signupHandler);

// POST /auth/login
authRouter.post("/login", loginHandler);  // Add login route

export default authRouter;
