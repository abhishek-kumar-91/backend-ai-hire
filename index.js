// Import required modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import connectDB from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import hrRoutes from './routes/hrEmailRoutes.js';
import coverLatterRoutes from './routes/coverLetterRoutes.js';
import aiResumeRoutes from './routes/resumeAnalysisRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import multer from 'multer';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000; // Port is already corrected to 3000

// Connect to Database
connectDB();

// Middleware
app.use(express.json()); // Parse JSON requests
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://ai-hire.vercel.app', // Whitelist your frontend URL
  credentials: true, // Allow cookies/headers (needed for auth tokens)
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};
app.use(cors(corsOptions));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Welcome to Our Job Application API!',
      description: 'This API powers an AI-driven job search and application platform.',
      version: '1.0.0',
      endpoints: {
        users: '/api/users - User management and authentication',
        hr: '/api/hr - HR-related features',
        jobs: '/api/jobs - Job listings and search',
        coverLetter: '/api/cover-letter - Cover letter generation',
      },
      documentation: 'Visit /docs for detailed API documentation (coming soon)',
    });
  });

const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory as a Buffer
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Debug Middleware to Log Incoming Form Data
app.use('/api/ai-analysis', (req, res, next) => {
   
    next();
});

// Apply Multer middleware with detailed logging
app.use('/api/ai-analysis', upload.single('resume'), (req, res, next) => {
    
    next();
}, aiResumeRoutes);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/users', hrRoutes);
app.use('/api/users', jobRoutes);
app.use('/api', coverLatterRoutes);



// Global Error Handler Middleware
app.use(errorMiddleware);

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));