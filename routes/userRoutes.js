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

userRoute.get('/my-account', userAuth.isLogin, userController.loadUserAccount);  //userAuth.isLogin,
userRoute.get('/profile', userAuth.isLogin, userController.loadUserProfile);  //userAuth.isLogin,
userRoute.get('/edit-profile', userAuth.isLogin, userController.loadEditUserProfile);  //userAuth.isLogin,
userRoute.post('/update-profile', userAuth.isLogin, multer.uploadUserImages, userController.updateUserProfile);  //userAuth.isLogin,
userRoute.post('/change-password', userAuth.isLogin, userController.updateUserPassword);  //userAuth.isLogin,


// CART ROUTES
userRoute.get('/cart', userAuth.isLogin, cartController.loadUserCart);  //userAuth.isLogin,
userRoute.post('/add-to-cart', userAuth.isLogin, cartController.addToCart);  //userAuth.isLogin,
userRoute.post('/update-cart-quantity', userAuth.isLogin, cartController.updateCartQuantity)  //userAuth.isLogin,


userRoute.get('/wishlist', userAuth.isLogin, userController.loadUserWishlist);  //userAuth.isLogin,
userRoute.get('/orders', userAuth.isLogin, userController.loadUserOrders);  //userAuth.isLogin,
userRoute.get('/address', userAuth.isLogin, userController.loadUserAddress);  //userAuth.isLogin,




module.exports = userRoute;