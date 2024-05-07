const express = require('express');
const userRoute = express();

const session = require('express-session');

userRoute.use(session({
    secret: process.env.sessionSecret,
    saveUninitialized: true,
    resave: false
}));


userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/user');


userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}));


userRoute.use(express.static('public'));


const userAuth = require('../middlewares/userAuth');
const userController = require ('../controllers/userController');

userRoute.get('/', userController.loadHome);

userRoute.get('/login', userAuth.isLogout, userController.loadLogin);
userRoute.post('/login', userController.verifyLogin);

userRoute.get('/register', userAuth.isLogout, userController.loadRegister);
userRoute.post('/register', userController.insertUser);

userRoute.get('/verify-account', userAuth.isLogout, userController.loadVerifyAccount);
userRoute.post('/verify-account', userController.verifyAccount);

userRoute.get('/resend-otp', userController.resendOtp);

userRoute.get('/shopping', userAuth.isLogin, userController.loadShopping);







module.exports = userRoute;