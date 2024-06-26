const User = require ('../models/userModel');
const Product = require ('../models/productModel');
const GoldPrice = require ('../models/goldPriceModel');
const Wishlist = require ('../models/wishlistModel');
const Cart = require ('../models/cartModel');








// load user-wishlist page -------------------------------------
const loadUserWishlist = async (req, res)=>{
    try {
        const sessionData = await User.findById(req.session.userId);
        console.log('session data in user profile page : ' , sessionData);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({userRef: req.session.userId});
        const userWishlist = await Wishlist.findOne({ userRef: req.session.userId });

        let cartCount = 0;

        if (sessionData && userCart){
            console.log("Cart Documents for User:", userCart);
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
            console.log("Total Quantity of Carted Items:", cartCount);
        }
        
        res.render('userWishlist', { sessionData, cartCount, goldPriceData });

    } catch (error) {
        console.log('error in loading wishlist', error.message);
    }
}




// add product to the wishlist ---------------------------------
const addToWishlist = async(req, res)=>{
    try {
        const userId = req.session.userId;
        const userWishlist = await Wishlist.findOne({userRef: userId});

        if(!userId){
            return res.json({nosession: true});
        } else{
            if (!userWishlist){
            
            } else{
    
            }
        }

    } catch (error) {
        console.log('error while adding to wishlist', error.message);
    }
}









module.exports = {
    loadUserWishlist,
    addToWishlist
}