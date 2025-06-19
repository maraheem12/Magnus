import express from "express";
import {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
} from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.post("/create", protectRoute, adminRoute, createProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct); // Assuming you want to delete a product by ID

router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts); // Assuming you want to protect this route as well
router.get("/category/:category", getProductsByCategory); // Assuming you want to filter products by category
export default router;
