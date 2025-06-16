import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; 
import dotenv from 'dotenv';
dotenv.config();

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized access" });
        }
        // Assuming you have a function to verify the token
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select('-password'); // Exclude password and version field
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }
            req.user = user; // Attach user info to request object
            next(); // Proceed to the next middleware or route handler
        } catch (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ message: "Invalid token" });
        }
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(401).json({ message: "Unauthorized access" });
    }
}

export const adminRoute = (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next(); // User is an admin, proceed to the next middleware or route handler
        } else {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
    } catch (error) {
        console.error("Error in adminRoute middleware:", error);
        res.status(403).json({ message: "Forbidden: Admins only" });
    }
}
