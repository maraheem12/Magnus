import Product from '../models/product.model.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import cloudinary from 'cloudinary';
import redis from 'ioredis';


export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, isFeatured, category, image } = req.body;
        let cloudinaryResponse;
        // Validate required fields
        if(image){
            // Assuming you have a cloudinary upload function
            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: 'products',
            });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            isFeatured: isFeatured || false,
            category,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "" // Use the URL from Cloudinary if available
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Optionally, delete the image from Cloudinary if it exists
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0]; // Extract public ID from URL
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from Cloudinary");
            } catch (error) {
                console.error("Error deleting image from Cloudinary:", error);
                return res.status(500).json({ message: "Error deleting image from Cloudinary" });
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        // fetching from redis
        const featured = await redis.get('featuredProducts');
        if (featured) {
            return res.status(200).json({ featured: JSON.parse(featured) });
        }

        // if not found in redis, fetch from database
        // Assuming you have a Product model with a field isFeatured
        // and then store it in redis
        featured = await Product.find({ isFeatured: true }).lean(); // Use lean() for better performance
        if(!featured) {
            return res.status(404).json({ message: "No featured products found" });
        }
        await redis.set('featuredProducts', JSON.stringify(featured)); // Cache for 1 hour
        res.status(200).json({ featured });
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
                
export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}