const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Cart = require ('../models/cartModel');
const Wishlist = require ('../models/wishlistModel');
const Product = require ('../models/productModel');
const Address = require('../models/addressModel');
const categoryModel = require('../models/categoryModel');





// load user-cart page ----------------------------------------
const loadUserCart = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});
        const sessionData = await User.findById(sessionId);

        const userCart = await Cart.findOne({ userRef: sessionId }).populate('product.productRef').exec();
        const userWishlist = await Wishlist.findOne({ userRef: sessionId }).populate('product.productRef').exec();
        
        
        let cartCount = 0;
        let wishlistCount = 0;
        
        if (userCart && userCart.product){
            const productLength = userCart.product.length;
            console.log(`The length of the product array is: ${productLength}`);

            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
            console.log("Total Quantity of Carted Items:", cartCount);
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        res.render('userCart', { sessionData, cartCount, wishlistCount, userCart, goldPriceData });

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
                });
    
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
        const {productId, outOfStockItems } = req.body;

        console.log('recieved productId for single product removing :', productId);

        // for removing the selected product from cart / checkout (single)
        if (productId){
            const updatedUserCart = await Cart.findOneAndUpdate(
                {userRef: userId},
                {$pull: {product: {_id: productId}}}
            )

            console.log('product removed from cart');
            return res.status(200).json({ removedProduct: true });
        }


        // for removing the out of stock items from cart / checkout (may be multiple items)
        if (outOfStockItems && outOfStockItems.length > 0) {

            for (const products of outOfStockItems) {
                console.log('productId for multiple product removing (outOfStockItems) :', products._id);
            }

            for (const products of outOfStockItems) {
                let updatedUserCart = await Cart.findOneAndUpdate(
                    { userRef: userId },
                    { $pull: { product: { _id: products._id } } }
                );

                console.log('updatedUserCart :', updatedUserCart);
            }

            console.log('produt removed from cart');
            return res.status(200).json({ removedOutOfStock: true });
        }


    } catch (error) {
        console.log('error while removing from cart :', error.message);
    }
}




// proceed to checkout validation
const proceedToCheckout = async(req, res)=>{
    try {
        const userId = req.session.userId;
        const sessionData = await User.findById(userId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId }).populate('product.productRef');
        const userAddress = await Address.findOne({userRef: userId});

        if (userCart && userCart.product){
            // Check the stock for each product in the cart
            let outOfStockItems = [];
            userCart.product.forEach((cartItem) => {
                if (cartItem.productRef.quantity === 0) {
                outOfStockItems.push(cartItem);
                }
            });

            if (outOfStockItems.length > 0){
                console.log('out of outOfStockItems found :', outOfStockItems);
                return res.json({outofstockfound : true, outOfStockItems});
            }
        } else {
            console.log('no cart for user or no product in user cart');
            return res.json({nocartItems: true});
        }

        return res.json({proceed: true});


    } catch (error) {
        console.log('error in loading checkout page: ', error.message);
    }
}







// load thank you page.
const loadThankyou = async(req, res)=>{
    try {
        res.render('thankYou');
    } catch (error) {
        console.log('error while loading the thank you page.', error.message);
    }
}



// load thank you page.
const placeOrder = async(req, res)=>{
    try {
        const userId = req.session.useId;
        const data = req.body
        
        console.log('data received in backend : ', data);

        if(data){
            return res.json({successful: true});
        }

        // res.render('thankYou');

    } catch (error) {
        console.log('error while loading the thank you page.', error.message);
    }
}






module.exports = {
    loadUserCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    proceedToCheckout,
    placeOrder,
    loadThankyou
}