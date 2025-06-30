
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import hangoutRoutes from './routes/hangoutRoutes';
import connectionRequestRoutes from './routes/connectionRequestRoutes';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json({ limit: '10mb' })); // Support JSON-encoded bodies, increase limit for images
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies

// API Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hangouts', hangoutRoutes);
app.use('/api/connection-requests', connectionRequestRoutes);

app.get('/', (req, res) => {
    res.send('Hangout Planner API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});