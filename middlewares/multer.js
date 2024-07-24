const multer = require('multer');
const path = require('path');
const fs = require('fs');



// --------------------------------------------------------
// To create destination paths based on product category
const getProductDestination = function (req, file, cb) {
    const destination = path.join(__dirname, `../public/assets/images/productImages`);
    fs.mkdir(destination, { recursive: true }, (err) => {
        if (err) {
            console.error("Error creating product destination directory:", err);
            return cb(err);
        }
        console.log("Product destination directory created:", destination);
        cb(null, destination);
    });
};

// Storage configuration for product images
const productStorage = multer.diskStorage({
    destination: getProductDestination,
    filename: function(req, file, cb) {
        const fileName = file.originalname;
        cb(null, fileName);
    }
});

const uploadProductImages = multer({storage: productStorage}).array('croppedImages', 4);
const modifyProductImages = multer({storage: productStorage}).array('croppedImages', 4);



// -----------------------------------------------------------
// Configure multer for user profile photo uploads
const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname,'../public/assets/images/userImages'));
    },
    filename: (req, file, cb) => {
        // const fileName = Date.now()+'-'+file.originalname;
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
    }
});
const uploadUserImages = multer({ storage: userStorage }).single('profile-pic'); //input type name="" in form





// -----------------------------------------------------------
// Configure multer for coupon image uploads
const couponStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname,'../public/assets/images/couponImages'));
    },
    filename: (req, file, cb) => {
        // const fileName = Date.now()+'-'+file.originalname;
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
    }
});
const uploadCouponImage = multer({ storage: couponStorage }).single('coupon-image'); //input type name="" in form







module.exports = {
    uploadUserImages,
    uploadProductImages,
    modifyProductImages,
    uploadCouponImage
}



// // Helper function to create destination paths based on user mobile number
// const getUserDestination = function(req, file, cb) {
//     const userMobile = req.body.userMobile;
//     const destination = path.join(__dirname, "../public/assets/images/userImages/", userMobile);
//     // Create the directory if it does not exist
//     fs.mkdir(destination, { recursive: true }, (err) => {
//         if (err) {
//             console.error("Error creating user image destination directory:", err);
//             return cb(err);
//         }
//         cb(null, destination);
//     });
// };
// // Storage configuration for user images
// const userStorage = multer.diskStorage({
//     destination: getUserDestination,
//     filename: function(req, file, cb) {
//         const fileName = file.originalname;
//         cb(null, fileName);
//     }
// });




// const uploadUserImages = multer({ storage: userStorage });


// const modifyProductImages = upload.fields([
//     { name: 'croppedImages', maxCount: 10 }, // Adjust maxCount as needed
// ]);
// modifyProductImages for edit product