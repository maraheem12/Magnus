import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/product.route.js';


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ this enables req.cookies
const PORT = process.env.PORT || 5000



app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.listen(PORT,()=>{
    console.log("Server is running on port http://localhost:"+ PORT);
    connectDB();
})




//HMSpLuiD57B2HkS8

//mongodb+srv://maraheem812:HMSpLuiD57B2HkS8@cluster0.xxpnjav.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
