const GoldPrice = require ('../models/goldPriceModel');
const User = require ('../models/userModel');
const Address = require('../models/addressModel');
const Product = require ('../models/productModel');
const Wishlist = require ('../models/wishlistModel');
const Cart = require ('../models/cartModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const SerialNumber = require('../models/SerialNumberModel');







// load user-cart page ----------------------------------------
const loadUserCart = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});
        const userData = await User.findById(sessionId);

        const userWishlist = await Wishlist.findOne({ userRef: sessionId }).populate('product.productRef').exec();

        const userCart = await Cart.findOne({ userRef: sessionId })
        .populate('product.productRef')
        .populate('couponRef')
        .exec();

        
        
        let cartCount = 0;
        let wishlistCount = 0;

        let subTotal = 0;
        let shippingCharge = 0;
        let offerDiscount = 0;
        let couponDiscount = 0;
        // let walletAmount
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


        if (userCart && userCart.couponRef){
            couponDiscount = userCart.couponRef.couponValue;
            console.log("couponDiscount :", couponDiscount);
            criteriaAmount = userCart.couponRef.criteriaAmount;
            console.log("criteriaAmount :", criteriaAmount);

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

        shippingCharge = subTotal > 0 && subTotal < 100000 ? 300 : 0;
        console.log("shippingCharge :", shippingCharge);


        netPayable = subTotal + shippingCharge - offerDiscount - couponDiscount;  // refferral / wallet amount also consider
        console.log("netPayable :", netPayable);

        res.render('userCart', { 
            userData, 
            goldPriceData, 
            cartCount, 
            wishlistCount, 
            userCart, 
            subTotal, 
            shippingCharge, 
            couponDiscount, 
            offerDiscount, // pending (wallet, referral also pending)
            // and wallet deduction is needed only after checkout payment method selection and apply ?
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

        const userCart = await Cart.findOne({ _id: cartId })
        .populate('product.productRef')
        .populate('couponRef')
        .exec();

        let cartCount = 0;
        let wishlistCount = 0;

        let subTotal = 0;
        let shippingCharge = 0;
        let offerDiscount = 0;
        let couponDiscount = 0;
        // let walletAmount
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


        if (userCart && userCart.couponRef){
            couponDiscount = userCart.couponRef.couponValue;
            console.log("couponDiscount in checkout :", couponDiscount);
            criteriaAmount = userCart.couponRef.criteriaAmount;
            console.log("criteriaAmount in checkout :", criteriaAmount);

            if (userCart.product.length === 0){
                console.log('No items in checkout.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from userCart.');
                couponDiscount = 0;

            } else if (subTotal < criteriaAmount){
                console.log('criteriaAmount is less than checkout subTotal.');
                userCart.couponRef = null;
                await userCart.save();
                console.log('cancelled couponRef from userCart.');
                couponDiscount = 0;

            }

        }


        shippingCharge = subTotal >= 100000 ? 0 : 300;
        console.log("shippingCharge :", shippingCharge);

        if(userCart && userCart.couponRef){
            couponDiscount = userCart.couponRef.couponValue;
            console.log("couponDiscount :", couponDiscount);
        }

        netPayable = subTotal + shippingCharge - offerDiscount - couponDiscount;  // refferral / wallet amount also consider
        console.log("netPayable :", netPayable);



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
                couponDiscount,  // pending (wallet, referral also pending)
                // and wallet deduction is needed only after checkout payment method selection and apply ?
                netPayable
            });

        } else{
            res.redirect('/cart');
        }



    } catch (error) {
        console.log('error in loadCheckout :', error.message);
    }
}




// to complete / place the order
const placeOrder = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});
        
        const {
            selectedAddressId,
            selectedPaymentMethod, 
        } = req.body;

        console.log('selectedAddress :', selectedAddressId);
        console.log('selectedPaymentMethod :', selectedPaymentMethod);


        const addressData =  await Address.findOne({userRef: sessionId});
        const userAddress = addressData.address.find(ad => ad._id.toString() === selectedAddressId);

        const userCheckout = await Cart.findOne({ userRef: sessionId })
        .populate({
            path: 'product.productRef',
            populate: {
                path: 'offerRef'
            }
        })
        .populate('couponRef');

        console.log('userCheckout.product length for placeOrder : ', userCheckout.product.length);

        let outOfStockItems = [];
        userCheckout.product.forEach((cartItem) => {
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

        userCheckout.product.forEach((item)=>{
            let unitPrice = item.productRef.totalPrice;
            let itemQuantity = item.quantity;
            let individualTotal = (unitPrice * itemQuantity);
            cartSubTotal += individualTotal;

            // let offerPercentage = (item.productRef.offerRef.offerPercentage);  // NEED TO APPLY OFFER AND POPULATE OFFERREF.
            // individualOfferAmount = unitPrice * offerPercentage /100;  // each item's offer
            // totalOfferDiscount += individualOfferAmount;
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
        
        const userOrders = new Order ({
            userRef : sessionId,
            orderDate : Date.now(),
            billingRate : goldPriceData.price,
            orderedItems : [],     // initially empty items array
            orderNo : invoiceNumber,
            shippingAddress : userAddress,
            subTotal : cartSubTotal,
            deliveryCharge : shippingCharge,
            couponDiscount : couponDiscount,
            specialDiscount : specialDiscount, // specialDiscount was implemented before offer and coupon.
            netAmount : payableAmount,
            paymentMethod: selectedPaymentMethod,
            paymentStatus : selectedPaymentMethod === 'Cash On Delivery' ? 'Pending' : selectedPaymentMethod === 'Online Payment' ? 'Processing' : selectedPaymentMethod === 'Wallet' ? 'Pending' : 'Pending' // || other if wallet or razorpay ?,
        });
        console.log('created userOrders : ', userOrders);

        // for inserting products to the orderedItems array.
        for (const item of userCheckout.product) {
            const cartProductRef = item.productRef;
            const cartQuantity = item.quantity;
            console.log('cartQuantity of each products :', cartQuantity);

            let offerDiscount = 0;  // offerDiscount of each item (currently 0, bcoz offer is not applied).
            // let unitPrice = (item.productRef.totalPrice);
            // let offerPercentage = (item.productRef.offerRef.offerPercentage);  // need to populate the offerRef for userCheckout query ?
            // offerDiscount = unitPrice * offerPercentage /100;  // each item's offer
            // console.log('offerDiscount of orderItem : ', offerDiscount);

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
                quantity : cartQuantity,
                offerDiscount : offerDiscount, // (currently 0, bcoz offer is not applied).
                orderStatus : 'Placed',  // if the payment failed, the initial order status should be 'Pending'
                deliveryDate : Date.now() + 5,   // expected delivery date (dummy date)
            });


            await userOrders.save();
            console.log('pushed product details into orderedItems array.');

            // removing products form the user cart
            userCheckout.product.pull({productRef: cartProductRef._id});
            await userCheckout.save();
            console.log('removed item from cart and updated UserCart.');


            // updating the product inventory (quantity) after order.
            await Product.findOneAndUpdate(
                { _id: cartProductRef },
                { $inc: { quantity: -cartQuantity } },
                { new: true }
            );
            console.log('updated the inventory stock of the ordered product.');

        }


        // updating the used coupon count in coupon database (-1).
        // And removing couponRef from userCart.
        // also adding users into usedCustomers
        if (userCheckout.couponRef && userCheckout.couponRef != null){
            const updatedCouponData = await Coupon.findByIdAndUpdate(
                userCheckout.couponRef._id,
                { 
                    $inc: { usedCount: 1 },
                    $push: { usedCustomers: { userRef: sessionId } }
                },
                { new: true }
            );
            console.log('updated usedCoupon count :', updatedCouponData.usedCount);

            // deactivating the coupon when the coupons are fully used.
            if (updatedCouponData.couponCount === updatedCouponData.usedCount) {
                updatedCouponData.isActive = false;
                await updatedCouponData.save();
                console.log('all coupons are used. and coupon is inactive now.');
            }

            userCheckout.couponRef = null;
            await userCheckout.save();
            console.log('cancelled couponRef from cart after order.');

        }


        // debit the money from user wallet if payment method is 'Wallet'.
        if (selectedPaymentMethod === 'Wallet'){

            const transactionDetails = {
                date : userOrders.orderDate,
                amount : -userOrders.netAmount,
                description : 'Ornament purchase - Order No:  '+ userOrders.orderNo,
            }
            console.log('Amount to debit from user wallet :', transactionDetails.amount);


            const updatedUserWallet = await User.findOneAndUpdate(
                {_id: req.session.userId},
                {
                    $inc: {walletBalance: -userOrders.netAmount},
                    $push: {walletHistory: transactionDetails},
                },
                {new: true}
            );
            console.log('updated user wallet amount :', updatedUserWallet.walletBalance);
        }


        return res.json({successful: true});


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