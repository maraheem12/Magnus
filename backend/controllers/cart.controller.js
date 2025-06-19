import Product from '../models/product.model.js';


export const getCartProducts = async (req, res) => {
    try{
		const products = await Product.find({ _id: { $in: req.user.cartItems } })

    	const cartItems = products.map((product) => {
			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
			return { ...product.toJSON(), quantity: item.quantity };
		}); 
		return res.status(200).json(cartItems);
	}
	catch (error) {
		console.error('Error fetching cart products:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export const addToCart = async (req, res) => {
	const productId = req.body;
	const user = req.user;
	try{
		const existingProduct = req.user.cartItems.find(item => item.id === productId.id);
		if (existingProduct) {
			existingProduct.quantity += 1;
		} else {
			user.cartItems.push({ id: productId.id, quantity: 1 });
		}
		await user.save();
		return res.status(200).json({ message: 'Product added to cart successfully' });
	}
	catch (error) {
		console.error('Error adding product to cart:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export const removeAllFromCart = async (req, res) => {
	const productId = req.body;
	const user = req.user;
	try{
		if( !productId) {
			user.cartItems = [];
		}
		else{
			user.cartItems = user.cartItems.filter(item => item.id !== productId.id);
		}
		await user.save();
		res.json(user.cartItems);	
	}
	catch (error) {
		console.error('Error removing product from cart:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export const updateQuantity = async (req, res) => {
	const { id:productId, quantity } = req.body;
	const user = req.user;
	try {
		const existingProduct = user.cartItems.find(item => item.id === productId);
		if (existingProduct) {
			if (quantity <= 0) {
				user.cartItems = user.cartItems.filter(item => item.id !== productId);
			} else {
				existingProduct.quantity = quantity;
			}
			await user.save();
			return res.status(200).json({ message: 'Cart updated successfully' });
		} else {
			return res.status(404).json({ message: 'Product not found in cart' });
		}
	} catch (error) {
		console.error('Error updating cart quantity:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};