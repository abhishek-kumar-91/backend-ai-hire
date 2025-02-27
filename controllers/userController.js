import User from '../Schema/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate Tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// User Signup (Email/Password)
export const signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ fullname, email, password });
        const { accessToken, refreshToken } = generateTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User Signin (Email/Password)
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Google Authentication (Updated for POST /google-auth)
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body; // Expecting idToken from frontend

        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Check if user exists by googleId or email
        let user = await User.findOne({ googleId: payload.sub });
        if (!user) {
            user = await User.findOne({ email: payload.email });
            if (user) {
                // Link existing user with Google ID
                user.googleId = payload.sub;
            } else {
                // Create new user
                user = new User({
                    fullname: payload.name,
                    email: payload.email,
                    googleId: payload.sub,
                });
            }
            await user.save();
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'Google login successful',
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(400).json({ message: 'Invalid Google token' });
    }
};

// LinkedIn Authentication (Placeholder)
export const linkedinAuth = async (req, res) => {
    try {
        const { linkedinId, fullname, email } = req.body;

        let user = await User.findOne({ linkedinId });
        if (!user) {
            user = new User({ fullname, email, linkedinId });
            await user.save();
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'LinkedIn login successful',
            user: { _id: user._id, fullname, email },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Refresh Token Handler
export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh Token is required' });
    }

    try {
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Logout
export const logout = async (req, res) => {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (refreshToken) {
            if (user.refreshToken !== refreshToken) {
                return res.status(403).json({ message: "Invalid refresh token" });
            }
            user.refreshToken = null;
            await user.save();
        } else if (user.refreshToken) {
            user.refreshToken = null;
            await user.save();
        }

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Update User Settings
export const updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullname, email, password, linkedinId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateFields = {};
        if (fullname) updateFields.fullname = fullname;
        if (email) updateFields.email = email;
        if (linkedinId) updateFields.linkedinId = linkedinId;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.status(200).json({
            message: 'Settings updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating settings',
            error: error.message,
        });
    }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User profile fetched successfully',
            user: {
                fullname: user.fullname,
                email: user.email,
                phone: user.phone || '',
                linkedinId: user.linkedinId || '',
            },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching user profile',
            error: error.message,
        });
    }
};