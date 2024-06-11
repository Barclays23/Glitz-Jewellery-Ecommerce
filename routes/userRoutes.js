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

// Configure cookie-session (cookie-session is an alternative to express-session for managing sessions)
// npm install cookie-session
// const cookieSession = require('cookie-session');

// app.use(cookieSession({
//     name: 'session',
//     keys: [process.env.SESSION_SECRET || 'your-secret-key'], // Add your own secret key
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
// }));

// Initialize Passport and restore authentication state, if any, from the session
userRoute.use(passport.initialize());
userRoute.use(passport.session());


userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/user');


userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}));

userRoute.use(express.static('public'));


const userController = require ('../controllers/userController');
const userAuth = require('../middlewares/userAuth');
const googleAuth = require('../middlewares/googleAuth'); // same as require('../middlewares/googleAuth');
// console.log('googleAuth require : ', googleAuth);

userRoute.get('/', userController.loadHome);

userRoute.get('/login', userAuth.isLogout, userController.loadLogin);
userRoute.post('/login', userController.verifyLogin);

userRoute.get('/auth/google', googleAuth.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback', googleAuth.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful authentication');
    req.session.userId = req.user.id;  // Explicitly set the userId in session
    console.log('Session ID after google login:', req.session.id);
    console.log('User ID after google login:', req.session.userId);
    res.redirect('/shopping'); // Successful authentication, redirect to shopping page
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





module.exports = userRoute;