// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth/authRouter';
import documentsRouter from './routes/documentsRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Our Auth routes (GitHub OAuth, etc.)
app.use('/auth', authRouter);

// Our Documents route
app.use('/documents', documentsRouter);

app.get('/', (req, res) => {
    res.send('Hello, TypeScript World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
