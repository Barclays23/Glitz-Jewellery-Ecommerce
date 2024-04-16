const express = require ('express');
const user_route = express();
const session = require ('express-session');

user_route.use(session({
    secret: process.env.sessionSecret,
    saveUninitialized: true,
    resave: false
}));

user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));


user_route.use(express.static('public'));


const userAuth = require('../middlewares/userAuth');
const userController = require ('../controllers/userController');

user_route.get('/', userController.loadHome);
user_route.get('/login', userController.loadLogin);
user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);
user_route.get('/verify-account', userController.loadVerifyAccount);





module.exports = user_route