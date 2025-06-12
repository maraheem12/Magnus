import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    cartItens: [
        {
            quantity: {
                type: Number,
                default : 1
            },
            product:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        }
    ],
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer' 
    }
}, 
    {
        timestamps: true
    });

// Middleware to hash password before saving

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw new Error('Error comparing password');
    }
};
const User = mongoose.model('User', userSchema);
export default User;