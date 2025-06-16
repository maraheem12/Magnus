import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js'


const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // Store for 7 days
    } catch (error) {
        console.error('Error storing refresh token in Redis:', error);
    }
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

export const refereshToken = async (req, res) => {
    const refereshToken = req.cookies.refreshToken;
    if (!refereshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    try {
        // Verify the refresh token
        // If the token is invalid, it will throw an error
        // If the token is expired, it will throw an error
        // If the token is valid, it will return the decoded payload
        // Decode the refresh token to get userId
        // If the token is invalid, it will throw an error
        // If the token is expired, it will throw an error
        const decoded = jwt.verify(refereshToken, process.env.REFRESH_TOKEN_SECRET);
        const userId = decoded.userId;

        // Check if the refresh token exists in Redis
        const storedRefreshToken = await redis.get(`refreshToken:${userId}`);
        if (storedRefreshToken !== refereshToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);
        await storeRefreshToken(userId, newRefreshToken);

        // Set cookies and send response
        setCookies(res, accessToken, newRefreshToken);

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error('Error during token refresh:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = await User.create({ username, email, password });

        // Generate Authentication Token
        const { accessToken, refreshToken } = generateTokens(newUser._id);
        await storeRefreshToken(newUser._id, refreshToken);

        // Set cookies and send response
        setCookies(res, accessToken, refreshToken);

        return res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
export const login = async (req, res) => {
    
    const { email, password } = req.body;
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Authentication Token
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        // Set cookies and send response
        setCookies(res, accessToken, refreshToken);

        return res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
export const logout = async (req, res) => {
    try {
        const refereshToken = req.cookies.refreshToken;
    if (!refereshToken) {
        const decode = jwt.verify(refereshToken, process.env.REFRESH_TOKEN_SECRET);
        await redis.del(`refreshToken:${decode._id}`);       
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({ message: 'Internal server error' });  
    }
}  