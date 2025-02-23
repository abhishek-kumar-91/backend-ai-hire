import User from '../Schema/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

// User Signup
export const signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Create New User
        user = new User({ fullname, email, password });

        // Generate Access & Refresh Tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        // Save refresh token in user model
        user.refreshToken = refreshToken;
        await user.save();

        // Send Response
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User Signin
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate Access & Refresh Tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        // Save refresh token in database
        user.refreshToken = refreshToken;
        await user.save();

        // Send Response
        res.json({
            message: 'Login successful',
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Google Authentication
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body; // Token from frontend

        // Verify token with Google
        const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

        const { email, name, sub } = googleResponse.data;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                fullname: name,
                email,
                googleId: sub
            });

            await user.save();
        }

        // Generate JWT Token
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ accessToken, refreshToken, user });
    } catch (error) {
        res.status(400).json({ message: 'Invalid Google Token' });
    }
};

// LinkedIn Authentication
export const linkedinAuth = async (req, res) => {
    try {
        const { linkedinId, fullname, email } = req.body;

        let user = await User.findOne({ linkedinId });

        if (!user) {
            user = new User({ fullname, email, linkedinId });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user });
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
        // Find user with the refresh token
        const user = await User.findOne({ refreshToken });

        if (!user) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logout = async (req, res) => {
    const { refreshToken } = req.body; // Optional: refreshToken from request body
    const userId = req.user.id; // From authMiddleware (decoded from accessToken)
  
    try {
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // If refreshToken is provided, verify it matches and clear it
      if (refreshToken) {
        if (user.refreshToken !== refreshToken) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }
        user.refreshToken = null; // Clear the refresh token
        await user.save();
      } else if (user.refreshToken) {
        // If no refreshToken provided but one exists, clear it anyway
        user.refreshToken = null;
        await user.save();
      }
  
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };