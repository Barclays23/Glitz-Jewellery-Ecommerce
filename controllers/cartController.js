const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Cart = require ('../models/cartModel');
const Product = require ('../models/productModel');
const categoryModel = require('../models/categoryModel');





// load user-cart page ----------------------------------------
const loadUserCart = async (req, res)=>{
    try {
        const goldPriceData = await GoldPrice.findOne({});
        const sessionData = await User.findById(req.session.userId);

        const userCart = await Cart.findOne({ userRef: req.session.userId }).populate('product.productRef').exec();
        
        let cartCount = 0;
        
        if (sessionData && userCart && userCart.product){
            const productLength = userCart.product.length;
            console.log(`The length of the product array is: ${productLength}`);

            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
            console.log("Total Quantity of Carted Items:", cartCount);
        }

        res.render('userCart', { sessionData, cartCount, userCart, goldPriceData });

    } catch (error) {
        console.log('error in loading user cart', error.message);
    }
}



// add product to the cart ------------------------------------
const addToCart = async (req, res)=>{
    try {
        const userId = req.session.userId;
        const productId = req.body.productId;
        console.log('productId received in addtocart :', productId);

        const productData = await Product.findOne({_id: productId});

        if (productData.quantity === 0){
            return res.json({ outofstock: true });

        } else{
            if(!userId){
                return res.status(401).json({ nosession: true });
            }
    
            let userCart = await Cart.findOne({userRef: userId});
            console.log('find cart :', userCart);
    
            if (!userCart){
                userCart = new Cart ({
                    userRef : userId,
                    product : [{
                        productRef : productId,
                        quantity : 1
                    }]
                })
    
                const cartCreated = await userCart.save();
                console.log('new cart created : ', cartCreated);
    
                return res.status(201).json({ success: true });
    
            } else {
                const existingProduct = userCart.product.find(p => p.productRef.toString() === productId);
    
                if(existingProduct){
                    console.log('this product already exist in cart.');
                    return res.json({existProduct: true});
                } else{
                    userCart.product.push({ productRef: productId, quantity: 1 });
                    const cartUpdated = await userCart.save();
    
                    console.log('cart updated new product : ', cartUpdated);
                    return res.json({ success: true });
                }
            }
        }

    } catch (error) {
        console.log('error in adding to cart :', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



// update cart product quantity. ------------------------------
const updateCartQuantity = async (req, res)=>{
    const {productId, index, newQuantity} = req.body;
    console.log('req.body received for update cart quantity :', req.body);

    const userId = req.session.userId;

    // Insufficient Stock
    // Unfortunately, we only have 10 units of this product in stock. Please adjust the quantity in your cart accordingly.

    
    try {
        // const userCart = await Cart.findOne({userRef: userId, 'product._id': productId});
        let userCart = await Cart.findOne({userRef: userId}).populate('product.productRef').exec();

        const inventoryQuantity = userCart.product[index].productRef.quantity;
        console.log('inventoryQuantity :', inventoryQuantity);

        if (newQuantity > inventoryQuantity){
            console.log('added more than inventory quantity.');
            return res.json({insufficient: true, inventoryQuantity});
        }

        let updatedUserCart = await Cart.findOneAndUpdate(
            {userRef: userId, "product._id": productId }, 
            {$set: { "product.$.quantity": newQuantity }}, 
            { new: true }
        ).populate('product.productRef');
        
        console.log('updatedUserCart : ', updatedUserCart);
        console.log('updated product quantity found with index : ', updatedUserCart.product[index].quantity);
        

        // Calculate the updated total price for the product
        const updatedTotalPrice = (updatedUserCart.product[index].productRef.totalPrice) * (updatedUserCart.product[index].quantity);
        console.log('updatedTotalPrice', updatedTotalPrice);

        // Send the updated total price back to the client
        res.json({success: true, index, updatedTotalPrice });

    } catch (error) {
        console.log('error while updating cart quantity :', error.message);
    }
}



// remove product from user cart. -----------------------------
const removeFromCart = async(req, res)=>{
    try {
        const userId = req.session.userId;
        const {index, productId} = req.body;

        const userCart = await Cart.findOne({userRef: userId});

        userCart.product.splice(index, 1);
        await userCart.save();

        return res.status(200).json({ success: true });

    } catch (error) {
        console.log('error while removing from cart :', error.message);
    }
}









module.exports = {
    loadUserCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
}