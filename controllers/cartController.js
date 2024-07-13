const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Address = require('../models/addressModel');
const Product = require ('../models/productModel');
const Wishlist = require ('../models/wishlistModel');
const Cart = require ('../models/cartModel');
const Order = require('../models/orderModel');
const SerialNumber = require('../models/SerialNumberModel');

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

            let outOfStockItems = [];

            // Check the inventory stock for each product in the cart
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

        return res.json({proceed: true, cartId: userCart._id});


    } catch (error) {
        console.log('error in loading checkout page: ', error.message);
    }
}




// load checkout page----------------------------------------
const loadCheckout = async (req, res)=>{
    try {
        const userId = req.session.userId;
        const sessionData = await User.findById(userId);
        const cartId = req.query.cartId;

        const goldPriceData = await GoldPrice.findOne({});
        const userAddress = await Address.findOne({userRef: userId});
        const userWishlist = await Wishlist.findOne({ userRef: userId});

        const userCart = await Cart.findOne({ _id: cartId }).populate('product.productRef');

        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        if(cartId && cartCount > 0){   
            res.render('checkout', { sessionData, userAddress, userCart, cartCount, wishlistCount, goldPriceData });

        } else{
            res.redirect('/cart');
        }



    } catch (error) {
        console.log('error in loading checkout page :', error.message);
    }
}




// to complete / place the order
const placeOrder = async(req, res)=>{
    try {
        const userId = req.session.userId;
        
        const {
            selectedAddressId,
            selectedPaymentMethod, 
        } = req.body;

        console.log('selectedAddress :', selectedAddressId);
        console.log('selectedPaymentMethod :', selectedPaymentMethod);

        const addressData =  await Address.findOne({userRef: userId});
        const userAddress = addressData.address.find(ad => ad._id.toString() === selectedAddressId);
        console.log('find shipping address in backend : ', userAddress);

        const userCheckout = await Cart.findOne({userRef: userId}).populate('product.productRef');
        console.log('userCheckout.product : ', userCheckout.product);

        let individualTotal = 0;
        let cartSubTotal = 0;   //total checkout amount without discount/wallet/
        userCheckout.product.forEach((item)=>{
            individualTotal = (item.productRef.totalPrice * item.quantity);
            cartSubTotal += individualTotal;
        });
        console.log('cartSubTotal in backend is : ', cartSubTotal);
        
        let shippingCharge = cartSubTotal >= 100000 ? 0 : 300;
        console.log('shippingCharge in backend is : ', shippingCharge);

        let discountAmount = cartSubTotal * 1.5 /100; // dummy discount (currently 1.5% on cartSubTotal)
        console.log('discountAmount in backend is : ', discountAmount);
        // <% let discountAmount = subTotal * 1.5 /100 %>  // dummy discount amount given in front end also.
        // can be provide the discount on makingCharge (later)


        //FOR ORDER NUMBER / INVOICE NUMBER
        // Get the current date components
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');

        // Get the last serial number and increment it
        const serialData = await SerialNumber.findOneAndUpdate(
            { year: currentDate.getFullYear() },
            { $inc: { serial: 1 } },
            { new: true, upsert: true }
        );

        const serialNumber = serialData.serial.toString().padStart(4, '0');

        // Generate the invoice number
        const invoiceNumber = `GL 2425/${year}${month}${day}${serialNumber}`;
        console.log('Generated Invoice Number: ', invoiceNumber);
        
        const userOrders = new Order ({
            userRef : userId,
            orderDate : Date.now(),
            orderedItems : [],     // initially empty items array
            orderNo : invoiceNumber,
            shippingAddress : userAddress,
            subTotal : cartSubTotal,
            deliveryCharge : shippingCharge,
            discountAmount : discountAmount,
            netAmount : cartSubTotal + shippingCharge - discountAmount,  //wallet or offer consider if any
            paymentMethod: selectedPaymentMethod,
            paymentStatus : selectedPaymentMethod === 'Cash On Delivery' ? 'Pending' : selectedPaymentMethod === 'Online Payment' ? 'Processing' : selectedPaymentMethod === 'Wallet' ? 'Pending' : 'Pending' // || other if wallet or razorpay ?,
        });
        console.log('created userOrders : ', userOrders);

        for (const item of userCheckout.product) {
            const cartProductRef = item.productRef;
            const CartQuantity = item.quantity;
            console.log('CartQuantity of each products :', CartQuantity);

            userOrders.orderedItems.push({
                productRef : cartProductRef,
                // categoryRef : --------------,
                image : cartProductRef.images.image1,
                code : cartProductRef.code,
                purity : cartProductRef.purity,
                name : cartProductRef.name,
                grossWeight : cartProductRef.grossWeight,
                stoneWeight : cartProductRef.stoneWeight,
                netWeight : cartProductRef.netWeight,
                VA : cartProductRef.VA,
                stoneCharge : cartProductRef.stoneCharge,
                metalPrice : cartProductRef.metalPrice,
                makingCharge : cartProductRef.makingCharge,
                GST : cartProductRef.GST,
                totalPrice : cartProductRef.totalPrice,
                quantity : CartQuantity,
                productSum : cartProductRef.totalPrice * CartQuantity,

                orderStatus : 'Placed',  // if the payment failed, the initial order status should be 'Pending'
                deliveryDate : Date.now() + 5,
            });

            await userOrders.save();
            console.log('pushed product details into userOrders.orderedItems');

            userCheckout.product.pull({productRef: cartProductRef._id});
            await userCheckout.save();
            console.log('removed item from cart and updated UserCart');


            await Product.findOneAndUpdate(
                { _id: cartProductRef },
                { $inc: { quantity: -CartQuantity } },
                { new: true }
            );
            console.log('updated the inventory stock of the ordered product.');
        }

        return res.json({successful: true});


    } catch (error) {
        console.log('error while creating the order.', error.message);
        return res.json({error: true});  // and show the error sweet alert internal or else.
    }
}




// load user-order page----------------------------------------
const loadUserOrders = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const sessionData = await User.findById(sessionId);
        
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        const userOrders = await Order.find({userRef: sessionId}).sort({ orderDate: -1 });

        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }


        res.render('userOrders', { sessionData, cartCount, wishlistCount, goldPriceData, userOrders });

    } catch (error) {
        console.log('error in loading user order page', error.message);
    }
}




// load order details page for user -------------------------------------
const loadOrderDetails = async(req, res)=>{
    try {
        const userId = req.session.userId;
        const sessionData = await User.findById(userId);
        const orderId = req.query.id;

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId });
        const userAddress = await Address.findOne({userRef: userId});
        const userWishlist = await Wishlist.findOne({ userRef: userId});
        const orderData = await Order.findOne({_id : orderId});


        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }


        res.render('orderDetails', {userId, sessionData, orderData, cartCount, wishlistCount, goldPriceData });
        
    } catch (error) {
        console.log('error while loading the order details page :', error.message);
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






module.exports = {
    loadUserCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    proceedToCheckout,
    loadCheckout,
    loadUserOrders,
    loadOrderDetails,
    placeOrder,
    loadThankyou
}