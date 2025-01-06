// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth/authRouter';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.send('Hello, TypeScript World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
