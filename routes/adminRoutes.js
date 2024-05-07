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
// adminRoute.use(express.static('public', {
//     setHeaders: (res, path, stat) => {
//       if (path.endsWith('.css')) {
//         res.set('Content-Type', 'text/css');
//       }
//     }
// }));

// adminRoute.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     next();
// });

const adminAuth = require('../middlewares/adminAuth');
const adminController = require('../controllers/adminController');

// adminRoute.get('/dashboard', adminAuth.isLogin, adminController.loadAdminDashboard);
adminRoute.get('/', adminAuth.isLogin, adminController.loadAdminDashboard);


adminRoute.get('/login', adminAuth.isLogout, adminController.loadLogin);
adminRoute.post('/login', adminController.verifyLogin);

// adminRoute.get('/forget-password', adminController.loadForgetPassword);

adminRoute.post('/forget-password', adminController.verifyForgetMail);
adminRoute.get('/reset-password', adminAuth.isLogout, adminController.loadResetPassword);
adminRoute.post('/reset-password', adminController.resetPassword);


adminRoute.get('/users', adminAuth.isLogin, adminController.loadUsersList);



module.exports = adminRoute;