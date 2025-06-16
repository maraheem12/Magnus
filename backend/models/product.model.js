import mongoose from 'mongoose';


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price must be a positive number']
    },
    isFeatured: {
       type : Boolean,
       default: false
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Product image is required'],
    }
}, 
{
    timestamps: true
})

const Product = mongoose.model('Product', productSchema);
export default Product;