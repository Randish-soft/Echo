import express from "express";
import cors from "cors";
import authRouter from "./auth/authRouter";  // note the relative path

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for development:
app.use(cors());

// Parse JSON bodies:
app.use(express.json());

// Use the auth routes:
app.use("/auth", authRouter);

// A quick test route:
app.get("/", (req, res) => {
    res.send("Hello, TypeScript World!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
