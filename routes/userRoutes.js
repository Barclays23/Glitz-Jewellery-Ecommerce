const express = require('express');
const userRoute = express();
const session = require('express-session');
const passport = require('passport');



userRoute.use(session({
    secret: process.env.sessionSecret,
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false } // Note: In production (google Auth), set secure: true if using HTTPS
}));




// Initialize Passport and restore authentication state, if any, from the session
userRoute.use(passport.initialize());
userRoute.use(passport.session());


userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/user');


userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}));

userRoute.use(express.static('public'));



const userController = require ('../controllers/userController');
const cartController = require ('../controllers/cartController');
const wishlistController = require ('../controllers/wishlistController');
const addressController = require ('../controllers/addressController');
const orderController = require ('../controllers/orderController');

const userAuth = require('../middlewares/userAuth');
const googleAuth = require('../middlewares/googleAuth');
const multer = require('../middlewares/multer');
// console.log('googleAuth require : ', googleAuth);




userRoute.get('/', userController.loadHome);
userRoute.get('/login', userAuth.isLogout, userController.loadLogin);
userRoute.post('/login', userController.verifyLogin);

userRoute.get('/auth/google', googleAuth.authenticate('google', { scope: ['profile', 'email'] }));
userRoute.get('/auth/google/callback', googleAuth.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful authentication');
    req.session.userId = req.user.id;
    console.log('Session ID after google login:', req.session.id);
    console.log('User ID after google login:', req.session.userId);
    res.redirect('/shopping');
  }
);


userRoute.get('/logout', userAuth.isLogin, userController.userLogout);
userRoute.get('/register', userAuth.isLogout, userController.loadRegister);
userRoute.post('/register', userController.insertUser);
userRoute.post('/forget-password', userAuth.isLogout, userController.verifyForgetMail);
userRoute.get('/reset-password', userAuth.isLogout, userController.loadResetPassword);
userRoute.post('/reset-password', userAuth.isLogout, userController.resetPassword);

userRoute.get('/verify-account', userAuth.isLogout, userController.loadVerifyAccount);
userRoute.post('/verify-account', userController.verifyAccount);
userRoute.get('/resend-otp', userController.resendOtp);

userRoute.get('/shopping', userController.loadShopping);
userRoute.get('/product-details', userController.productDetals);

// USER PROFILE ROUTES
userRoute.get('/my-account', userAuth.isLogin, userController.loadUserAccount);
userRoute.get('/profile', userAuth.isLogin, userController.loadUserProfile);
userRoute.get('/edit-profile', userAuth.isLogin, userController.loadEditUserProfile);
userRoute.post('/update-profile', userAuth.isLogin, multer.uploadUserImages, userController.updateUserProfile);
userRoute.post('/change-password', userAuth.isLogin, userController.updateUserPassword);


// CART ROUTES
userRoute.get('/cart', userAuth.isLogin, cartController.loadUserCart);
userRoute.post('/add-to-cart', cartController.addToCart);
userRoute.post('/update-cart-quantity', userAuth.isLogin, cartController.updateCartQuantity);
userRoute.delete('/remove-from-cart', userAuth.isLogin, cartController.removeFromCart);
userRoute.post('/proceed-to-checkout', userAuth.isLogin, cartController.proceedToCheckout);


// WISHLIST ROUTES
userRoute.get('/wishlist', userAuth.isLogin, wishlistController.loadUserWishlist);
userRoute.post('/add-to-wishlist', wishlistController.addToWishlist);
userRoute.delete('/save-for-later', userAuth.isLogin, wishlistController.saveForLater);


// ADDRESS ROUTES
userRoute.get('/address', userAuth.isLogin, addressController.loadUserAddress);
userRoute.post('/add-address', userAuth.isLogin, addressController.addNewAddress);
userRoute.patch('/edit-address', userAuth.isLogin, addressController.editAddress);
userRoute.delete('/delete-address', userAuth.isLogin, addressController.deleteAddress);


// ORDER ROUTES
userRoute.get('/checkout',  orderController.loadCheckout);    // userAuth.isLogin,
userRoute.post('/place-order',  orderController.placeOrder); // userAuth.isLogin,
userRoute.get('/thankyou', userAuth.isLogin, orderController.loadThankyou);
userRoute.get('/orders', userAuth.isLogin, orderController.loadUserOrders);
userRoute.get('/order-details',  orderController.loadOrderDetails); // userAuth.isLogin,





module.exports = userRoute;