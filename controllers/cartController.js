const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Cart = require ('../models/cartModel');
const Product = require ('../models/productModel');
const categoryModel = require('../models/categoryModel');





// load user-cart page----------------------------------------
const loadUserCart = async (req, res)=>{
    try {
        const goldPriceData = await GoldPrice.findOne({});
        const sessionData = await User.findById(req.session.userId);
        console.log('session data in user profile page : ' , sessionData);

        const userCart = await Cart.findOne({ userRef: req.session.userId }).populate('product.productRef').exec();
        console.log('userCart :', userCart);
        
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



// add product to the cart
const addToCart = async (req, res)=>{
    try {
        const userId = req.session.userId;
        const productId = req.body.productId;
        console.log('productId received in addtocart :', productId);
        console.log('cart session user :', userId);

        if(!userId){
            console.log('no sessionssssss');
            return res.json({ nosession: true});
        } else {
            console.log('session undeeee');
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
                    res.json({ success: true });
                }
            }
        }


    } catch (error) {
        console.log('error in adding to cart :', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



// update cart product quantity.
const updateCartQuantity = async (req, res)=>{
    const {productId, index, newQuantity} = req.body;
    console.log('req.body received for update cart quantity :', req.body);

    const userId = req.session.userId;

    try {
        let updatedUserCart = await Cart.findOneAndUpdate(
            {userRef: userId, "product._id": productId }, 
            {$set: { "product.$.quantity": newQuantity }}, 
            { new: true }
        );
        
        console.log('updated cart : ', updatedUserCart);
        console.log('find product with index : ', updatedUserCart.product[index]);
        console.log('find product quantity with index : ', updatedUserCart.product[index].quantity);

        
        let userCart = await Cart.findOne({userRef: userId}).populate('product.productRef').exec();
        
        // Calculate the updated total price for the product
        const updatedTotalPrice = userCart.product[index].productRef.totalPrice * userCart.product[index].quantity;
        console.log('updatedProduct', updatedTotalPrice);

        // Send the updated total price back to the client
        res.json({ index, updatedTotalPrice });

    } catch (error) {
        console.log('error in updating cart quantity :', error.message);
    }
}




module.exports = {
    loadUserCart,
    addToCart,
    updateCartQuantity
}