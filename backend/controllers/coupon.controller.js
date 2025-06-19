import Coupon from '../models/coupon.model.js';

export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.find({ userId: req.user._id , isActive: true });
        res.status(200).json(coupon || null);
    } catch (error) {
        res.status(500).json({ message: "Error fetching coupons", error: error.message });
    }
}

export const validateCoupon = async (req, res) => {
    const { code } = req.body;
    try {
        const coupon = await Coupon.findOne({
            code: code,
            userId: req.user._id,
            isActive: true,
        }); 
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found or invalid" });
        }
        if (coupon.expirationDate < new Date()) {
			coupon.isActive = false;
			await coupon.save();
			return res.status(404).json({ message: "Coupon expired" });
		}

		res.json({
			message: "Coupon is valid",
			code: coupon.code,
			discountPercentage: coupon.discountPercentage,
		}); 
    } catch (error) {
        res.status(500).json({ message: "Error validating coupon",
            error: error.message
        });
    }

}






