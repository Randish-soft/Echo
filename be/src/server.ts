// be/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRouter from './auth/authRouter';  // <--- single router now
import documentsRouter from './routes/documentsRouter';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth routes (GitHub + Local)
app.use('/auth', authRouter);

// Documents route
app.use('/documents', documentsRouter);

app.get('/', (req, res) => {
    res.send('Hello from the TypeScript backend!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
