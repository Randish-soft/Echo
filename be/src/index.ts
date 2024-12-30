import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import authRoutes from './routes/auth';

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
