const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Address = require('../models/addressModel');
const Product = require ('../models/productModel');
const Category = require ('../models/categoryModel');
const Wishlist = require ('../models/wishlistModel');
const Cart = require ('../models/cartModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/offerModel');
const SerialNumber = require('../models/SerialNumberModel');

const Crypto = require ('crypto');  // for online/razorPay verifyPayment
const RazorPay = require('razorpay');

const razorPayInstance = new RazorPay ({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET
})

const cron = require('node-cron');







// load user-cart page ----------------------------------------
const loadUserCart = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});
        const userData = await User.findById(sessionId);

        const userWishlist = await Wishlist.findOne({ userRef: sessionId }).populate('product.productRef').exec();


        // Find expired offers
        const expiredOffers = await Offer.find({
            expiryDate: { $lt: new Date() },
            isListed: true // Only select offers that are currently listed
        }, '_id');
        const expiredOfferIds = expiredOffers.map(offer => offer._id);
        console.log('found ', expiredOfferIds.length, ' expired active offers in cart.');

        // Find unlisted offers
        const unlistedOffers = await Offer.find({
            isListed: false
        }, '_id');
        const unlistedOfferIds = unlistedOffers.map(offer => offer._id);
        console.log('found ', unlistedOfferIds.length, ' unlisted/ blocked offers in cart.');

        // Combine both sets of offer IDs
        const offerIdsToCancel = new Set([...expiredOfferIds, ...unlistedOfferIds]);

        // If there are no offers to cancel, skip the update operation
        if (offerIdsToCancel.size === 0) {
            console.log('No offers to cancel.');
            return;
        }

        // cancel the offer from category
        const updatedCategoryOffer = await Category.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer category in cart :', updatedCategoryOffer.modifiedCount);
        
        // cancel the offer from products
        const updatedProductOffer = await Product.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer products in cart :', updatedProductOffer.modifiedCount);




        const userCart = await Cart.findOne({ userRef: sessionId })
        .populate({
            path: 'product.productRef',
            populate: {
                path: 'offerRef',
                model: 'Offer'
            }
        })
        .populate('couponRef');
        
        
        let cartCount = 0;
        let wishlistCount = 0;

        let subTotal = 0;
        let shippingCharge = 0;
        let offerDiscount = 0;
        let couponDiscount = 0;
        let netPayable = 0;


        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }
        
        if (userCart && userCart.product){
            const productLength = userCart.product.length;
            console.log(`product array length in loadUserCart : ${productLength}`);

            userCart.product.forEach((product) => {
                cartCount += product.quantity;
                subTotal += (product.productRef.totalPrice * product.quantity);  // without any discounts

            });
            console.log("cartCount :", cartCount);
            console.log('subTotal of cart (totalAmount) : ', subTotal);
        }


        // finding coupon amount
        if (userCart && userCart.couponRef){
            couponDiscount = userCart.couponRef.couponValue;
            console.log("couponDiscount in cart :", couponDiscount);
            criteriaAmount = userCart.couponRef.criteriaAmount;
            console.log("criteriaAmount in cart :", criteriaAmount);

            if (userCart.product.length === 0){
                console.log('No items in cart.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from cart.');
                couponDiscount = 0;

            } else if (subTotal < criteriaAmount){
                console.log('criteriaAmount is less than cart subTotal.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from cart.');
                couponDiscount = 0;

            } else if (userCart.couponRef.expiryDate < Date.now()){
                console.log('coupon expiry date is over.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from cart.');
                couponDiscount = 0;
            }
        }


        // finding total offer amount
        if (userCart && userCart.product.length > 0){
            userCart.product.forEach((item)=>{
                if (item.productRef.offerRef != null){
                    console.log(item.productRef.code ,': offer und....');

                    let offerPercentage = item.productRef.offerRef.offerPercentage;
                    console.log('offerPercentage of carted item :', offerPercentage);

                    let makingCharge = item.productRef.makingCharge;
                    console.log('makingCharge of carted item :', makingCharge);
                    
                    let itemQuantity = item.quantity;
                    console.log('itemQuantity of carted item :', itemQuantity);
                    
                    offerDiscount += (makingCharge * offerPercentage /100 * itemQuantity);
                    console.log('offerDiscount of carted item :', offerDiscount);
                }
            });
        }


        shippingCharge = subTotal > 0 && subTotal < 100000 ? 300 : 0;
        console.log("shippingCharge :", shippingCharge);

        netPayable = subTotal + shippingCharge - offerDiscount - couponDiscount;
        console.log("netPayable :", netPayable);
        
        let roundOffAmount = netPayable - Math.floor(netPayable);
        console.log("roundOffAmount :", roundOffAmount)


        res.render('userCart', { 
            userData, 
            goldPriceData, 
            cartCount, 
            wishlistCount, 
            userCart, 
            subTotal, 
            shippingCharge, 
            couponDiscount, 
            offerDiscount,
            roundOffAmount,
            netPayable
        });

    } catch (error) {
        console.log('error in loading user cart :', error.message);
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
        let cartId = userCart._id;

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
        res.json({success: true, index, updatedTotalPrice, cartId});

    } catch (error) {
        console.log('error while updating cart quantity :', error.message);
    }
}




// remove product from user cart. -----------------------------
const removeFromCart = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const {productId, outOfStockItems } = req.body;

        console.log('recieved productId for single product removing :', productId);

        // for removing the selected product from cart / checkout (single)
        if (productId){
            const updatedUserCart = await Cart.findOneAndUpdate(
                {userRef: sessionId},
                {$pull: {product: {_id: productId}}},
                {new : true}
            );
            console.log('product removed from cart.');
            console.log('updatedUserCart product length : ', updatedUserCart.product.length);

            // // also remove the couponRef from the cart if cart become empty.
            if (updatedUserCart.product.length === 0){
                console.log('No more items left in cart after remove from cart.');
                return res.json({emptyCart: true});
            }

            
            return res.status(200).json({ removedProduct: true , cartId: updatedUserCart._id});
        }


        // for removing the out of stock items from cart / checkout (may be multiple items)
        if (outOfStockItems && outOfStockItems.length > 0) {

            for (const products of outOfStockItems) {
                console.log('productId for multiple product removing (outOfStockItems) :', products._id);
            }

            for (const products of outOfStockItems) {
                let updatedUserCart = await Cart.findOneAndUpdate(
                    { userRef: sessionId },
                    { $pull: { product: { _id: products._id } } },
                    { new : true }
                );
                console.log('updatedUserCart length after remove :', updatedUserCart.product.length);

                // also remove the couponRef from the cart if cart become empty.
                if (updatedUserCart.couponRef && updatedUserCart.product.length === 0){
                    const removedCouponRef = await Cart.findOneAndUpdate(
                        {userRef: sessionId},
                        {$unset: {couponRef: 1}},
                        {new : true}
                    );
                    console.log('also removedCouponRef from cart : ', removedCouponRef);
                    console.log('No more items left in cart after outofstock clear.');
                
                    // no items in cart. so exit from checkout page.
                    return res.json({emptyCart: true});
                }
            }

            console.log('all out of stock products removed from cart');

            const userCart = await Cart.findOne({userRef: sessionId});

            return res.status(200).json({ removedOutOfStock: true,  cartId: userCart._id});

        }


    } catch (error) {
        console.log('error while removing from cart :', error.message);
        return res.json({error: true, message: error.message});
    }
}




// proceed to checkout validation
const proceedToCheckout = async (req, res) => {
    try {
        const sessionId = req.session.userId;
        const userCart = await Cart.findOne({ userRef: sessionId }).populate('product.productRef');

        if (!userCart) {
            console.log('No cart created for user or no products in user cart.');
            return res.json({ nocartItems: true });

        } else if (userCart && userCart.product.length === 0){
            console.log('user have cart & product array. but the array is empty.');
            return res.json({ nocartItems: true });
        }


        let outOfStockItems = [];

        userCart.product.forEach((cartItem) => {
            // Check the inventory stock for each product in the cart
            if (cartItem.quantity > cartItem.productRef.quantity) {
                console.log('product inventory quantity is 0 or less than carted quantity.');
                // Move out of stock items to outOfStockItems array.
                outOfStockItems.push(cartItem);
            }
        });

        if (outOfStockItems.length > 0) {
            console.log('Out of stock items found:', outOfStockItems);
            return res.json({ outofstockfound: true, outOfStockItems });
        }

        console.log('userCart.product.length before proceeding:', userCart.product.length);
        return res.json({ proceed: true, cartId: userCart._id });

    } catch (error) {
        console.log('Error in proceedToCheckout:', error.message);
        res.status(500).json({ error: 'An error occurred while proceeding to checkout.' });
    }
};





// load checkout page----------------------------------------
const loadCheckout = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        const cartId = req.query.cartId;

        const goldPriceData = await GoldPrice.findOne({});
        const userAddress = await Address.findOne({userRef: sessionId});
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});



        // Find expired offers
        const expiredOffers = await Offer.find({
            expiryDate: { $lt: new Date() },
            isListed: true // Only select offers that are currently listed
        }, '_id');
        const expiredOfferIds = expiredOffers.map(offer => offer._id);
        console.log('found ', expiredOfferIds.length, ' expired active offers in checkout.');

        // Find unlisted offers
        const unlistedOffers = await Offer.find({
            isListed: false
        }, '_id');
        const unlistedOfferIds = unlistedOffers.map(offer => offer._id);
        console.log('found ', unlistedOfferIds.length, ' unlisted/ blocked offers in checkout.');

        // Combine both sets of offer IDs
        const offerIdsToCancel = new Set([...expiredOfferIds, ...unlistedOfferIds]);

        // If there are no offers to cancel, skip the update operation
        if (offerIdsToCancel.size === 0) {
            console.log('No offers to cancel.');
            return;
        }

        // cancel the offer from category
        const updatedCategoryOffer = await Category.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer category in checkout :', updatedCategoryOffer.modifiedCount);
        
        // cancel the offer from products
        const updatedProductOffer = await Product.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer products in checkout :', updatedProductOffer.modifiedCount);



        const userCart = await Cart.findOne({ userRef: sessionId })
        .populate({
            path: 'product.productRef',
            populate: {
                path: 'offerRef',
                model: 'Offer'
            }
        })
        .populate('couponRef');


        let cartCount = 0;
        let wishlistCount = 0;

        let subTotal = 0;
        let shippingCharge = 0;
        let offerDiscount = 0;
        let couponDiscount = 0;
        let netPayable = 0;



        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }


        if (userCart && userCart.product){
            const productLength = userCart.product.length;
            console.log(`product array length in loadCheckout : ${productLength}`);

            userCart.product.forEach((product) => {
                cartCount += product.quantity;
                subTotal += (product.productRef.totalPrice * product.quantity);  // without any discounts

            });
            console.log("cartCount in checkout :", cartCount);
            console.log('subTotal of checkout (totalAmount) : ', subTotal);
        }


        // finding coupon amount
        if (userCart && userCart.couponRef){
            couponDiscount = userCart.couponRef.couponValue;
            console.log("couponDiscount in checkout :", couponDiscount);
            criteriaAmount = userCart.couponRef.criteriaAmount;
            console.log("criteriaAmount in checkout :", criteriaAmount);

            if (userCart.product.length === 0){
                console.log('No items in checkout.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from userCheckout.');
                couponDiscount = 0;

            } else if (subTotal < criteriaAmount){
                console.log('criteriaAmount is less than checkout subTotal.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from userCheckout.');
                couponDiscount = 0;

            } else if (userCart.couponRef.expiryDate < Date.now()){
                console.log('coupon expiry date is over.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from userCheckout.');
                couponDiscount = 0;
            }
        }


        // finding total offer amount
        if (userCart && userCart.product.length > 0){
            userCart.product.forEach((item)=>{
                if (item.productRef.offerRef != null){
                    console.log(item.productRef.code ,': offer und....');

                    let offerPercentage = item.productRef.offerRef.offerPercentage;
                    console.log('offerPercentage of carted item :', offerPercentage);

                    let makingCharge = item.productRef.makingCharge;
                    console.log('makingCharge of carted item :', makingCharge);
                    
                    let itemQuantity = item.quantity;
                    console.log('itemQuantity of carted item :', itemQuantity);
                    
                    offerDiscount += (makingCharge * offerPercentage /100 * itemQuantity);
                    console.log('offerDiscount of carted item :', offerDiscount);
                }
            });
        }


        shippingCharge = subTotal >= 100000 ? 0 : 300;
        console.log("shippingCharge :", shippingCharge);

        netPayable = subTotal + shippingCharge - offerDiscount - couponDiscount;
        console.log("netPayable :", netPayable);

        let roundOffAmount = netPayable - Math.floor(netPayable);
        console.log("roundOffAmount :", roundOffAmount)


        if (cartId && cartCount > 0){   
            res.render('checkout', { 
                goldPriceData,
                userData, 
                userAddress, 
                userCart, 
                cartCount, 
                wishlistCount, 
                subTotal, 
                shippingCharge, 
                offerDiscount, 
                couponDiscount,
                roundOffAmount,
                netPayable
            });

        } else{
            res.redirect('/cart');
        }



    } catch (error) {
        console.log('error in loadCheckout :', error.message);
    }
}





// make payment for the order
const makePayment = async(req, res)=>{
    try {
        const {selectedAddressId, selectedPaymentMethod} = req.body;
        console.log('data recieved in makePayment :', req.body);
        
        const sessionId = req.session.userId;

        const userData = await User.findOne({_id: sessionId});

        const userCart = await Cart.findOne({ userRef: sessionId })
        .populate({
            path: 'product.productRef',
            populate: {
                path: 'offerRef'
            }
        })
        .populate('couponRef');


        let outOfStockItems = [];

        userCart.product.forEach((cartItem) => {
            // Check the inventory stock for each product in the cart
            if (cartItem.quantity > cartItem.productRef.quantity) {
                console.log('product inventory quantity is 0 or less than carted quantity.');
                // Move out of stock items to outOfStockItems array.
                outOfStockItems.push(cartItem);
            }
        });

        if (outOfStockItems.length > 0) {
            console.log('Out of stock or insufficient items found for placeOrder :', outOfStockItems);
            return res.json({ outofstockfound: true, outOfStockItems });
        }

        

        let cartSubTotal = 0;   //total checkout amount without any discount/offer/coupon/wallet
        let totalOfferDiscount = 0;

        userCart.product.forEach((item)=>{
            let unitPrice = item.productRef.totalPrice;
            let unitMakingCharge = item.productRef.makingCharge;
            let itemQuantity = item.quantity;
            let individualTotal = (unitPrice * itemQuantity);
            cartSubTotal += individualTotal;

            let offerPercentage = (item.productRef.offerRef ? item.productRef.offerRef.offerPercentage : 0); // each item's offer percentage
            individualOfferAmount = unitMakingCharge * offerPercentage /100 * itemQuantity;  // each item's offer amount * itemQuantity
            totalOfferDiscount += individualOfferAmount;
        });
        console.log('cartSubTotal for makePayment : ', cartSubTotal);
        console.log('totalOfferDiscount for makePayment : ', totalOfferDiscount);
        
        let shippingCharge = cartSubTotal > 0 && cartSubTotal < 100000 ? 300 : 0;
        console.log('shippingCharge for makePayment : ', shippingCharge);
        
        let specialDiscount = 0;  // was implemented before offer and coupon (now no more needed).
        let couponDiscount = 0;
 
        if (userCart.couponRef != null){
            couponDiscount = userCart.couponRef.couponValue;
        }
        console.log('couponDiscount for makePayment : ', couponDiscount);
        
        let payableAmount = cartSubTotal + shippingCharge - specialDiscount - couponDiscount - totalOfferDiscount;
        console.log('payableAmount for makePayment : ', payableAmount);

        let roundOffAmount = payableAmount - Math.floor(payableAmount);
        console.log("roundOffAmount for makePayment :", roundOffAmount);


        let paymentStatus;


        if (selectedPaymentMethod === 'Cash On Delivery'){
            console.log('Payment via COD.');

            paymentStatus = 'Pending';
            return res.json({proceedToOrder: true, selectedAddressId, selectedPaymentMethod, paymentStatus});

            
        } else if (selectedPaymentMethod === 'Wallet'){
            console.log('Payment via Wallet.');

            const walletBalance = userData.walletBalance ? userData.walletBalance : 0;

            if (walletBalance < Math.floor(payableAmount)) {
                console.log('Wallet balance is insufficient.');
                return res.json({lowBalance: true, walletBalance});

            } else {
                paymentStatus = 'Pending'; // or what can give for wallet or at initial stage for wallet?
                console.log('Wallet balance is sufficient and can make payment.');
                return res.json({proceedToOrder: true, selectedAddressId, selectedPaymentMethod, paymentStatus});
            }
            

        // if payment method is 'Online Payment', create order instance for razorPay payment integration.
        } else if (selectedPaymentMethod === 'Online Payment'){
            console.log('Payment via Online Payment.');

            const timeOptions = { timeZone: 'Asia/Kolkata', hour12: false };
            const receiptString = `${userData._id}_${new Date().toLocaleString('sv-SE', timeOptions).replace(/[-:]/g, "").replace(" ", "T")}`;

            const options = {
                amount : Math.floor(payableAmount) * 100, // in currency subunits (paise). Default currency is INR. Hence, amount * 100 paise.
                currency : "INR",
                receipt : receiptString   // created unique string.
            }
            console.log('options for razorPayInstance :', options);

            razorPayInstance.orders.create(options, (err, order)=> {
                if (err) {
                    console.log('Failed to create razorPay order instance :', err);
                    paymentStatus = 'Failed';
                    return res.json({instanceFailed: true, err, paymentStatus});  // need to send paymentStatus & userData ??
                    
                } else {
                    console.log('razorPay order instance created successfully :', order);
                    paymentStatus = 'Pending'; // but verification not completed.
                    const razorPayKeyId = razorPayInstance.key_id;
                    return res.json({proceedToRazorPay: true, order, razorPayKeyId, selectedAddressId, selectedPaymentMethod, paymentStatus, userData});
                }

            });
            
        }

    } catch (error) {
        console.log('Error in makePayment.', error);
        return res.json({error: true, message: error.message});
    }
}




// verify payment (razorPay)
const verifyPayment = async (req, res) => {
    try {
        let { paymentResponse, orderResponse } = req.body;

        console.log('paymentResponse received in verifyPayment:', paymentResponse);
        console.log('orderResponse received in verifyPayment:', orderResponse);

        // Extract the necessary information
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
        const order_id = orderResponse.order.id; // order ID from server (not razorpay_order_id)
        const secret = razorPayInstance.key_secret; // Razorpay secret key

        // Create the HMAC SHA256 signature
        const generated_signature = Crypto.createHmac('sha256', secret)
            .update(order_id + "|" + razorpay_payment_id)
            .digest('hex');

        // Verify the signature
        if (generated_signature === razorpay_signature) {
            console.log('Payment verification is success.');
            // change the order status and payment status "PLACED" and "SUCCESS"
            orderResponse.paymentStatus = 'Success';
            return res.json({verifySuccess: true, orderResponse, message: 'Payment verification is successful'});   // send orderResponse

        } else {
            console.log('Payment verification failed.');
            // change the orderStatus "PENDING" and paymentStatus "FAILED"
            orderResponse.paymentStatus = 'Failed';
            return res.json({verifyFailed: true, paymentResponse, orderResponse, message: 'Payment Verification Failed. Please Retry Payment.'});
        }

    } catch (error) {
        console.log('Error in verifyPayment:', error);
        return res.status(500).send('Internal Server Error');
    }
};





// to complete / place the order
const placeOrder = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});

        // redirect to retry-payment page instead of placing another order.
        const lastOrderData = await Order.findOne({ userRef: sessionId })
        .sort({ orderDate: -1 });



        let { addressId, paymentMethod, paymentStatus} = req.body;

        console.log('addressId for placeOrder :', addressId);
        console.log('paymentMethod for placeOrder :', paymentMethod);
        console.log('paymentStatus for placeOrder :', paymentStatus);

        const addressData =  await Address.findOne({userRef: sessionId});
        const userAddress = addressData.address.find(ad => ad._id.toString() === addressId);

        const userCheckout = await Cart.findOne({ userRef: sessionId })
        .populate({
            path: 'product.productRef',
            populate: {
                path: 'offerRef'
            }
        })
        .populate('couponRef');

        console.log('userCheckout.product length for placeOrder : ', userCheckout.product.length);

        
        let cartSubTotal = 0;   //total checkout amount without any discount/offer/coupon/wallet
        let totalOfferDiscount = 0;

        userCheckout.product.forEach((item)=>{
            let unitPrice = item.productRef.totalPrice;
            let unitMakingCharge = item.productRef.makingCharge;
            let itemQuantity = item.quantity;
            let individualTotal = (unitPrice * itemQuantity);
            cartSubTotal += individualTotal;

            let offerPercentage = (item.productRef.offerRef ? item.productRef.offerRef.offerPercentage : 0); // each item's offer percentage
            individualOfferAmount = unitMakingCharge * offerPercentage /100 * itemQuantity;  // each item's offer amount * itemQuantity
            totalOfferDiscount += individualOfferAmount;
        });
        console.log('cartSubTotal for placeOrder : ', cartSubTotal);
        console.log('totalOfferDiscount for placeOrder : ', totalOfferDiscount);
        
        let shippingCharge = cartSubTotal > 0 && cartSubTotal < 100000 ? 300 : 0;
        console.log('shippingCharge for placeOrder : ', shippingCharge);
        
        let specialDiscount = 0;  // was implemented before offer and coupon (now no more needed).
        let couponDiscount = 0;
    
        if (userCheckout.couponRef != null){
            couponDiscount = userCheckout.couponRef.couponValue;
        }
        console.log('couponDiscount for placeOrder : ', couponDiscount);
        
        let payableAmount = cartSubTotal + shippingCharge - specialDiscount - couponDiscount - totalOfferDiscount;
        console.log('payableAmount for placeOrder : ', payableAmount);

        let roundOffAmount = payableAmount - Math.floor(payableAmount);
        console.log("roundOffAmount for placeOrder :", roundOffAmount);


        //FOR ORDER NUMBER / INVOICE NUMBER
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

        let orderStatus = 'Pending';  // 'Pending' by default. Change according to the paymentMethod and paymentStatus.

        if (paymentStatus === 'Success'){  // change to 'Failed' after the retry payment fails or time expire.
            orderStatus = 'Processing';
        }
        
        let userOrder = new Order ({
            userRef : sessionId,
            orderedItems : [],     // initially empty items array
            shippingAddress : userAddress,
            orderNo : invoiceNumber,
            orderDate : Date.now(),
            billingRate : goldPriceData.price,
            subTotal : cartSubTotal,
            deliveryCharge : shippingCharge,
            couponDiscount : couponDiscount,
            specialDiscount : specialDiscount, // specialDiscount was implemented before offer and coupon.
            netAmount : Math.floor(payableAmount),  // rounded off amount to pay
            paymentMethod: paymentMethod,
            // orderStatus : orderStatus  // ['Pending (by default)', 'Failed', 'Processing', 'Process Completed']
            // shipmentPendings : shipmentPendings
        });

        console.log('userOrder created.');


        // for inserting products & details to the orderedItems array (also updating CART & INVENTORY STOCK).
        for (const item of userCheckout.product) {
            const cartProductRef = item.productRef;
            const cartProductItem = item.productRef.code;
            const cartQuantity = item.quantity;

            console.log(`adding item into orderedItems : ${cartProductItem}`);
            console.log('cartQuantity of the item :', cartQuantity);

            let unitMC = (item.productRef.makingCharge);
            let offerPercentage = (item.productRef.offerRef ? item.productRef.offerRef.offerPercentage : 0); // each item's offer percentage
            offerDiscount = unitMC * offerPercentage /100;  // each item's offer (for single quantity)
            console.log('offerDiscount of orderItem : ', offerDiscount);

            userOrder.orderedItems.push({
                productRef : cartProductRef,
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
                offerDiscount : offerDiscount,
                quantity : cartQuantity,
                paymentStatus : paymentStatus,
                // productStatus : 'Placed',  // initially NO STATUS. update to 'PLACED' the status after order is  after if the payment failed, the initial order status should be 'Pending'
                // failedOrder / failedPayment : true / false for finding the failedOrders
            });


            console.log('Pushed product details into orderedItems array.');

            // removing products form the user cart
            userCheckout.product.pull({productRef: cartProductRef._id});
            await userCheckout.save();
            console.log('And removed item from cart and updated UserCart.');


            // updating the each product's inventory (quantity) after pushing to orderedItems array.
            await Product.findOneAndUpdate(
                { _id: cartProductRef },
                { $inc: { quantity: -cartQuantity } },
                { new: true }
            );
            console.log('And updated the inventory stock of the ordered product.');

        }

        const orderData = await userOrder.save();

        console.log('Saved userOrder :', orderData);


        

        // MANAGING THE COUPON AFTER ORDER
        if (userCheckout.couponRef && userCheckout.couponRef != null){

            // updating the used coupon count in coupon database (+1).
            // also adding users into usedCustomers.
            const updatedCouponData = await Coupon.findByIdAndUpdate(
                userCheckout.couponRef._id,
                { 
                    $inc: { usedCount: 1 },
                    $push: { usedCustomers: { userRef: sessionId } }
                },
                { new: true }
            );
            console.log('Updated usedCoupon count :', updatedCouponData.usedCount);


            // And removing couponRef from userCart.
            userCheckout.couponRef = null;
            await userCheckout.save();
            console.log('Cancelled couponRef from cart after order.');


            // deactivating the coupon when the coupons are fully used.
            if (updatedCouponData.couponCount === updatedCouponData.usedCount) {
                updatedCouponData.isActive = false;
                await updatedCouponData.save();
                console.log('All coupons are used. and coupon is inactive now.');
            }

        }



        // if payment method is 'Wallet', debit the money from user wallet.
        if (paymentMethod === 'Wallet'){

            const transactionDetails = {
                date : orderData.orderDate,
                amount : -orderData.netAmount,
                description : `Purchasing of Ornaments - Order No : ${orderData.orderNo}`,
            }
            console.log('Amount to debit from user wallet :', transactionDetails.amount);


            const updatedUserWallet = await User.findOneAndUpdate(
                {_id: sessionId},
                {
                    $inc: {walletBalance: -orderData.netAmount},
                    $push: {walletHistory: transactionDetails},
                },
                {new: true}
            );
            console.log('updated user wallet amount :', updatedUserWallet.walletBalance);

            // change the paymentStatus to "Success".
            if (updatedUserWallet){
                const updatedOrderData = await Order.findOneAndUpdate(
                    {orderNo : orderData.orderNo},
                    {
                        $set : {
                            orderStatus : 'Processing',
                            shipmentPendings : orderData.orderedItems.length,
                            'orderedItems.$[].paymentStatus': 'Success',
                            'orderedItems.$[].productStatus': 'Placed',
                        }
                    },
                    {new : true}
                );
                
                console.log('updatedOrderData.orderStatus :', updatedOrderData.orderStatus);
                console.log('updatedOrderData.orderedItems[0].paymentStatus :', updatedOrderData.orderedItems[0].paymentStatus);
                console.log('updatedOrderData.orderedItems[0].productStatus :', updatedOrderData.orderedItems[0].productStatus);
                
                console.log('order success with Wallet Payment.');
                return res.json({orderSuccess: true});
            }


        // if payment method is 'Online Payment'
        } else if (paymentMethod === 'Online Payment'){

            if (paymentStatus === 'Success'){
                const successOrderData = await Order.findOneAndUpdate(
                    {orderNo : orderData.orderNo},
                    { $set : {
                        orderStatus : 'Processing',
                        'orderedItems.$[].paymentStatus': 'Success',
                        'orderedItems.$[].productStatus': 'Placed',
                    }},
                    {new : true}
                );

                console.log('successOrderData.orderStatus :', successOrderData.orderStatus);
                console.log('successOrderData.orderedItems[0].paymentStatus :', successOrderData.orderedItems[0].paymentStatus);
                console.log('successOrderData.orderedItems[0].productStatus :', successOrderData.orderedItems[0].productStatus);

                console.log('order success with Online Payment.');
                return res.json({orderSuccess: true});

            } else {
                const pendingOrderData = await Order.findOneAndUpdate(
                    {orderNo : orderData.orderNo},
                    {   $set : {
                            // orderStatus : 'Pending',  // no need to change. initially it is 'Pending'
                            'orderedItems.$[].paymentStatus': paymentStatus,  // 'Failed'
                            'orderedItems.$[].productStatus': 'Pending Confirmation',  // no need to 'Placed' for pending order.    
                        }
                    },
                    {new : true}
                );

                console.log('pendingOrderData.orderStatus :', pendingOrderData.orderStatus);
                console.log('pendingOrderData.orderedItems[0].paymentStatus :', pendingOrderData.orderedItems[0].paymentStatus);
                
                console.log('order failed with Online Payment.');
                return res.json({proceedRetry: true, pendingOrderData});
            }
            

        // if payment method is COD and no more process left in ordering.
        } else if (paymentMethod === 'Cash On Delivery'){
            console.log('orderNo for updation :', orderData.orderNo);

            const updatedOrderData = await Order.findOneAndUpdate(
                {orderNo : orderData.orderNo},
                { $set : {
                    orderStatus : 'Processing',
                    shipmentPendings : orderData.orderedItems.length,
                    // 'orderedItems.$[].paymentStatus': '------', // no need to change for COD
                    'orderedItems.$[].productStatus': 'Placed',
                }},
                {new : true}
            );

            console.log('updatedOrderData.orderStatus :', updatedOrderData.orderStatus);
            console.log('updatedOrderData.orderedItems[0].paymentStatus :', updatedOrderData.orderedItems[0].paymentStatus);
            console.log('updatedOrderData.orderedItems[0].productStatus :', updatedOrderData.orderedItems[0].productStatus);
            
            console.log('order success with COD.');
            return res.json({orderSuccess: true, });
        }

        


    } catch (error) {
        console.log('error while creating the order.', error.message);
        return res.json({error: true, message: error.message});  // and show the error sweet alert internal or else.
    }
}





// load user-order page----------------------------------------
const loadUserOrders = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        
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


        res.render('userOrders', { userData, cartCount, wishlistCount, goldPriceData, userOrders });

    } catch (error) {
        console.log('error in loading user order page', error.message);
    }
}




// load order details page for user -------------------------------------
const loadOrderDetails = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const orderId = req.query.id;
        
        const userData = await User.findById(sessionId);
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});
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

        let totalOfferDiscount = 0;

        orderData.orderedItems.forEach((item)=>{
            offerDiscount = item.offerDiscount ? item.offerDiscount : 0;
            totalOfferDiscount += offerDiscount;
        });


        res.render('orderDetails', { userData, orderData, totalOfferDiscount, cartCount, wishlistCount, goldPriceData });
        
    } catch (error) {
        console.log('error while loading the order details page :', error.message);
    }
}





// load order success page after successful order.
const loadOrderSuccess = async(req, res)=>{
    try {
        res.render('orderSuccess');
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
    makePayment,
    verifyPayment,
    placeOrder,
    loadOrderSuccess,
    loadUserOrders,
    loadOrderDetails,
}