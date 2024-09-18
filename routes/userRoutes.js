const express = require('express');
const userRoute = express();
const session = require('express-session');
const passport = require('passport');




userRoute.use(session({
  name: 'user.sid',
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
const couponController = require ('../controllers/couponController');

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
    console.log('Session ID after google login :', req.session.id);
    console.log('User ID after google login :', req.session.userId);
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
userRoute.get('/my-account', userAuth.isLogin, userAuth.isBlocked, userController.loadUserAccount);
userRoute.get('/profile', userAuth.isLogin, userAuth.isBlocked, userController.loadUserProfile);
userRoute.get('/edit-profile', userAuth.isLogin, userAuth.isBlocked, userController.loadEditUserProfile);
userRoute.post('/update-profile', userAuth.isLogin, userAuth.isBlocked, multer.uploadUserImages, userController.updateUserProfile);
userRoute.post('/change-password', userAuth.isLogin, userAuth.isBlocked, userController.updateUserPassword);


// ADDRESS ROUTES
userRoute.get('/address', userAuth.isLogin, userAuth.isBlocked, addressController.loadUserAddress);
userRoute.post('/add-address', userAuth.isLogin, userAuth.isBlocked, addressController.addNewAddress);
userRoute.patch('/edit-address', userAuth.isLogin, userAuth.isBlocked, addressController.editAddress);
userRoute.delete('/delete-address', userAuth.isLogin, userAuth.isBlocked, addressController.deleteAddress);


// WISHLIST ROUTES
userRoute.get('/wishlist', userAuth.isLogin, userAuth.isBlocked, wishlistController.loadUserWishlist);
userRoute.post('/add-to-wishlist', wishlistController.addToWishlist); // same route for remove from wishlist
userRoute.delete('/save-for-later', userAuth.isLogin, userAuth.isBlocked, wishlistController.saveForLater);


// CART ROUTES
userRoute.get('/cart', userAuth.isLogin, userAuth.isBlocked, cartController.loadUserCart);
userRoute.post('/add-to-cart', userAuth.isBlocked, cartController.addToCart);
userRoute.post('/update-cart-quantity', userAuth.isLogin, userAuth.isBlocked, cartController.updateCartQuantity);
userRoute.delete('/remove-from-cart', userAuth.isLogin, userAuth.isBlocked, cartController.removeFromCart);
userRoute.post('/proceed-to-checkout', userAuth.isLogin, userAuth.isBlocked, cartController.proceedToCheckout);


// ORDER ROUTES FOR USER
userRoute.get('/checkout', userAuth.isLogin, userAuth.isBlocked, cartController.loadCheckout);

userRoute.post('/make-payment', userAuth.isLogin, userAuth.isBlocked, cartController.makePayment);
userRoute.post('/place-order', userAuth.isLogin, userAuth.isBlocked, cartController.placeOrder);
userRoute.post('/verify-payment', userAuth.isLogin, userAuth.isBlocked, cartController.verifyPayment);
userRoute.get('/order-success', userAuth.isLogin, userAuth.isBlocked, cartController.loadOrderSuccess);
userRoute.get('/orders', userAuth.isLogin, userAuth.isBlocked, cartController.loadUserOrders);  // orderController
userRoute.get('/order-details', userAuth.isLogin, userAuth.isBlocked, cartController.loadOrderDetails);  // orderController

userRoute.post('/cancel-order', userAuth.isLogin, userAuth.isBlocked, orderController.cancelOrder);
userRoute.post('/return-order', userAuth.isLogin, userAuth.isBlocked, orderController.returnOrder);
userRoute.get('/retry-payment', userAuth.isLogin, userAuth.isBlocked, orderController.loadRetryPayment);
userRoute.post('/retry-payment', userAuth.isLogin, userAuth.isBlocked, orderController.retryPayment);
userRoute.patch('/update-order', userAuth.isLogin, userAuth.isBlocked, orderController.updateRetryOrder);


// WALLET ROUTES
userRoute.get('/wallet', userAuth.isLogin, userAuth.isBlocked, userController.loadWallet);


//COUPON ROUTES FOR USER
userRoute.get('/coupons', userAuth.isLogin, userAuth.isBlocked, userController.loadCoupons);
userRoute.post('/apply-coupon', userAuth.isLogin, userAuth.isBlocked, couponController.applyCoupon);
userRoute.patch('/cancel-coupon', userAuth.isLogin, userAuth.isBlocked, couponController.cancelCoupon);



// ROUTES FOR INVOICE
userRoute.get('/invoice', orderController.loadInvoice); // removed userAuth.isLogin, userAuth.isBlocked,
userRoute.get('/download-invoice', orderController.downloadInvoice);  // removed userAuth.isLogin, userAuth.isBlocked,


// FOR 404 PAGE
userRoute.get('*', userController.load404);


module.exports = userRoute;