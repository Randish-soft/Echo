// be/src/auth/authRouter.ts
import { Router } from "express";
import { signupHandler } from "./signup/something";

const authRouter = Router(); // Use Router, not express()

authRouter.post("/signup", signupHandler); // Correctly attach the handler

export default authRouter;
