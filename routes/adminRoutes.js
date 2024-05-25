const express = require('express');
const adminRoute = express();

const session = require('express-session');
adminRoute.use(session({
    secret: process.env.sessionSecret,
    saveUninitialized: true,
    resave: false
}));


adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin');

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({extended: true}));
adminRoute.use(express.static('public'));


const adminAuth = require('../middlewares/adminAuth');
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const goldRateController = require('../controllers/goldRateController');


// ADMIN CONTROLLER ROUTES
adminRoute.get('/', adminAuth.isLogin, adminController.loadAdminDashboard);
// adminRoute.get('/dashboard', adminAuth.isLogin, adminController.loadAdminDashboard);
adminRoute.get('/login', adminAuth.isLogout, adminController.loadLogin);
adminRoute.post('/login', adminController.verifyLogin);
adminRoute.get('/logout', adminAuth.isLogin, adminController.adminLogout);
adminRoute.post('/forget-password', adminController.verifyForgetMail);
adminRoute.get('/reset-password', adminAuth.isLogout, adminController.loadResetPassword);
adminRoute.post('/reset-password', adminController.resetPassword);
adminRoute.get('/send-mail', adminAuth.isLogin, adminController.loadMailDraft);
adminRoute.post('/send-mail', adminAuth.isLogin, adminController.sendMail);




// USER CONTROLLER ROUTES
adminRoute.get('/users', adminAuth.isLogin, adminController.loadUsersList);
adminRoute.post('/user-action', adminAuth.isLogin, adminController.manageUser);



//CATEGORY CONTROLLER ROUTES
adminRoute.get('/categories', adminAuth.isLogin, categoryController.loadCategoryList);
adminRoute.post('/add-category', adminAuth.isLogin, categoryController.addCategory);
adminRoute.put('/edit-category', adminAuth.isLogin, categoryController.updateCategory);




// PRODUCT CONTROLLER ROUTES
adminRoute.get('/products', adminAuth.isLogin, productController.loadProductList);
adminRoute.post('/add-product', adminAuth.isLogin, productController.addProduct);
adminRoute.put('/edit-product', adminAuth.isLogin, productController.updateProduct);
adminRoute.patch('/manage-product', adminAuth.isLogin, productController.manageProduct);



// GOLD RATE CONTROLLER ROUTES
// adminRoute.get('/gold-rate', adminAuth.isLogin, goldRateController.getGoldRate);
adminRoute.put('/update-gold-rate', adminAuth.isLogin, goldRateController.updateGoldRate);








module.exports = adminRoute;