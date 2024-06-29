const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');





// load checkout page----------------------------------------
const loadCheckout = async (req, res)=>{
    try {
        const userId = req.session.userId;
        const sessionData = await User.findById(userId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId }).populate('product.productRef');
        const userAddress = await Address.findOne({userRef: userId});

        let cartCount = 0;

        if (sessionData && userCart){
            console.log("Cart Documents for User:", userCart);
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
            console.log("Total Quantity of Carted Items in checkout page :", cartCount);
        }

        res.render('checkout', { sessionData, userAddress, userCart, cartCount, goldPriceData });

    } catch (error) {
        console.log('error in loading checkout page', error.message);
    }
}




// load user-order page----------------------------------------
const loadUserOrders = async (req, res)=>{
    try {
        const sessionData = await User.findById(req.session.userId);
        console.log('session data in user profile page : ' , sessionData);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: req.session.userId });

        let cartCount = 0;

        if (sessionData && userCart){
            console.log("Cart Documents for User:", userCart);
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
            console.log("Total Quantity of Carted Items:", cartCount);
        }


        res.render('userOrders', { sessionData, cartCount, goldPriceData });

    } catch (error) {
        console.log('error in loading user order page', error.message);
    }
}








module.exports = {
    loadCheckout,
    loadUserOrders,
}