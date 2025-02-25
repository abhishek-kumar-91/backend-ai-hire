// Import required modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';

import connectDB from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import hrEmailRoutes from "./routes/hrEmailRoutes.js"
import jobRoutes from "./routes/jobRoutes.js";
import hrRoutes from "./routes/hrEmailRoutes.js"
import errorMiddleware from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));



// Routes
app.use('/api/users', userRoutes);
app.use('/api/users', hrRoutes);
app.use('/api/users', jobRoutes)


// Global Error Handler Middleware
app.use(errorMiddleware);

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
