const express = require ('express');
const userRoute = express();
const session = require ('express-session');

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

userRoute.get('/login', userController.loadLogin);
userRoute.post('/login', userController.verifyLogin);

userRoute.get('/register', userController.loadRegister);
userRoute.post('/register', userController.insertUser);

userRoute.get('/verify-account', userController.loadVerifyAccount);
userRoute.post('/verify-account', userController.verifyAccount);




module.exports = userRoute