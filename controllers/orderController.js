const User = require('../models/userModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const GoldPrice = require('../models/goldPriceModel');





// load checkout page----------------------------------------
const loadCheckout = async (req, res)=>{
    try {
        // const userId = req.session.userId;
        const userId = '663d9636265967ad8a5a046e';
        const sessionData = await User.findById(userId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId }).populate('product.productRef');
        const userAddress = await Address.findOne({userRef: userId});
        const userWishlist = await Wishlist.findOne({ userRef: userId});

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

        res.render('checkout', { sessionData, userAddress, userCart, cartCount, wishlistCount, goldPriceData });

    } catch (error) {
        console.log('error in loading checkout page :', error.message);
    }
}




// load user-order page----------------------------------------
const loadUserOrders = async (req, res)=>{
    try {
        // const sessionId = req.session.userId;
        const sessionId = '663d9636265967ad8a5a046e';
        const sessionData = await User.findById(sessionId);

        
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        const userOrders = await Order.find({userRef: sessionId});

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




// to complete / place the order
const placeOrder = async(req, res)=>{
    try {
        // const userId = req.session.useId ;
        const userId = '663d9636265967ad8a5a046e';
        
        const {
            selectedAddressId,
            selectedPaymentMethod, 
            // subTotal, 
            // shippingCharge, 
            // discountAmount,
            netAmount 
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

        
        const userOrders = new Order ({
            userRef : userId,
            orderDate : Date.now(),
            orderedItems : [],     // initially empty items array
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
            // console.log('cartProductRef of each checkout products :', cartProductRef);
            console.log('CartQuantity :', CartQuantity);


            // const userOrders = await Order.findOne({userRef: userId});
            // if(!userOrders){    // need to check like this? becoz each ordering is seperate. and user may have multiple orders (unlike cart and wishlist, which are only one)
                // console.log('userkk order collection illlaaa.');


                userOrders.orderedItems.push({
                        // product : {       //{}  or [{}] each product is an object or array of object? which to give.?
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

                            orderStatus : 'Pending',
                            deliveryDate : Date.now() + 5,
                        // },

                
                    // orderDate : Date.now(),
                    // subtotal : cartSubTotal,
                    // deliveryCharge : shippingCharge,
                    // discountAmount : discountAmount,
                    // netAmount : cartSubTotal + shippingCharge - discountAmount,  //wallet or offer consider if any
                    // paymentMethod: selectedPaymentMethod,
                    // paymentStatus : selectedPaymentMethod === 'Cash On Delivery' || selectedPaymentMethod === 'Online Payment' ? 'Processing' : selectedPaymentMethod === 'Wallet' ? 'Refunded' : 'Pending' // || other if wallet or razorpay ?,
                });

                await userOrders.save();
                console.log('pushed product details into userOrders.orderedItems');
                // console.log('created new order collection and added to it.');
                

                
            // } else{
            //     console.log('userkk order collection und.');
            //     // userOrders push items
            // }



            // if(data){
            //     // load thank you page.
            //     return res.json({successful: true});
            // }

        }

        // await userOrders.save();
        // console.log('pushed order details into userOrders.');
        // console.log('created new order collection and added to it.');




    } catch (error) {
        console.log('error while creating the order.', error.message);
        // return res.json({error: true})  // and show the error sweet alert internal or else.
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





// load order details page for user -------------------------------------
const loadOrderDetails = async(req, res)=>{
    try {
        // const sessionId = req.session.userId;
        const userId = '663d9636265967ad8a5a046e';
        const sessionData = await User.findById(userId);
        const orderId = req.query.id;

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId });
        const userAddress = await Address.findOne({userRef: userId});
        const userWishlist = await Wishlist.findOne({ userRef: userId});
        const orderData = await Order.findOne({_id : orderId});
        const productData = await Product.findOne({});


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


        res.render('orderDetails', {userId, sessionData, orderData, cartCount, wishlistCount, goldPriceData, });
        
    } catch (error) {
        console.log('error while loading the order details page :', error.message);
    }
}






module.exports = {
    loadCheckout,
    loadUserOrders,
    loadOrderDetails,
    placeOrder,
    loadThankyou
}