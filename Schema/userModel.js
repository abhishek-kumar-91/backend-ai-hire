import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        minlength: 6
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true  // Allows multiple null values
    },
    linkedinId: {
        type: String,
        unique: true,
        sparse: true
    },
    phone: {  // Added phone field
        type: String,
        trim: true
    },
    refreshToken: String,
}, {
    timestamps: true
});

// Hash password before saving (Only for email/password users)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
