import express from 'express';
import { signup, signin, googleAuth, linkedinAuth, refreshToken, logout } from '../controllers/userController.js';
import { validateSignup, validateSignin } from '../middleware/validateUser.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Email & Password Authentication
router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);

// Google Authentication
router.post('/google-auth', googleAuth);

// LinkedIn Authentication
router.post('/linkedin-auth', linkedinAuth);

// Protected Route Example (Only Authenticated Users)
router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'Welcome to your profile!', user: req.user });
});


// Refresh Token Route
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);
export default router;
