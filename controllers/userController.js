const User = require ('../models/userModel');
const Product = require ('../models/productModel');
const Category = require ('../models/categoryModel');
const Cart = require ('../models/cartModel');
const Wishlist = require ('../models/wishlistModel');
const Coupon = require ('../models/couponModel');
const Offer = require ('../models/offerModel');
const GoldPrice = require('../models/goldPriceModel');
const UserOtp = require ('../models/otpModel');
const bcrypt =  require ('bcrypt');
const nodemailer = require ('nodemailer');
const randomString = require('randomstring');
const { session } = require('passport');





const load404 = async (req, res)=>{
    try {
        res.render('404');

    } catch (error) {
        console.log('error in loading 404 page :', error.message);
        res.render('500');
    }
}





// load user home page----------------------------------------------
const loadHome = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        console.log("User ID in home page:", req.session.userId);

        const userData = await User.findOne({_id : sessionId});
        const goldPriceData = await GoldPrice.findOne({});
        const popularProducts = await Product.find({}).populate('offerRef');;
        const newProducts = await Product.find({}).populate('offerRef');
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({userRef : sessionId});
        const offerBannerProduct = await Product.findOne({_id: '669354be843722a03a04dbf6'}).populate('offerRef');
        console.log('offerBannerProduct is : ', offerBannerProduct.code);

        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }



        // Find expired offers
        const expiredOffers = await Offer.find({
            expiryDate: { $lt: new Date() },
            isListed: true // Only select offers that are currently listed
        }, '_id');
        const expiredOfferIds = expiredOffers.map(offer => offer._id);
        console.log('found ', expiredOfferIds.length, ' expired active offers in home.');

        // Find unlisted offers
        const unlistedOffers = await Offer.find({
            isListed: false
        }, '_id');
        const unlistedOfferIds = unlistedOffers.map(offer => offer._id);
        console.log('found ', unlistedOfferIds.length, ' unlisted/ blocked offers in home.');

        // Combine both sets of offer IDs
        const offerIdsToCancel = new Set([...expiredOfferIds, ...unlistedOfferIds]);

        // If there are no offers to cancel, skip the update operation
        if (offerIdsToCancel.size === 0) {
            console.log('No offers to cancel.');
            return;
        }

        // cancel the offer from category
        const updatedCategoryOffer = await Category.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer category in home :', updatedCategoryOffer.modifiedCount);
        
        // cancel the offer from products
        const updatedProductOffer = await Product.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer products in home :', updatedProductOffer.modifiedCount);



        res.render('home', {userData, wishlistCount, cartCount, goldPriceData, offerBannerProduct, popularProducts, newProducts});

    } catch (error) {
        console.log(error.message);
    }
}



// load user-login page----------------------------------------
const loadLogin = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const verificationSuccess = req.query.verification === 'success';
        const passwordResetSuccess = req.query.passwordReset === 'success';
        const goldPriceData = await GoldPrice.findOne({});

        const userData = await User.findById(sessionId);
        console.log('session data in login page is : ' , userData);

        res.render('login', { userData, verificationSuccess, passwordResetSuccess, goldPriceData });

    } catch (error) {
        console.log('error in loading the login page', error.message);
    }
}




// verify userlogin -----------------------------------------------
const verifyLogin = async (req, res) => {
    try {
        const { loginEmail, loginPassword, } = req.body;
        console.log('user details received after login is : ', req.body);
        console.count("verifyLogin");
        const userData = await User.findOne({ email: loginEmail });


        if (!userData) {
            console.log('no userdata');
            return res.status(404).json({ notFound: true, message: "The email is not registered with us. Please sign up." });

        } else if(userData.isBlocked === true){
            return res.status(401).json({ blocked: true, message: "Your account is blocked by admin!" });

        } else if(!userData.password){
            console.log('no password stored for Google auth users.');
            return res.status(404).json({ incorrect: true, message: "Incorrect Password!" });

        } else{
            const passwordMatch = await bcrypt.compare(loginPassword, userData.password);

            if (!passwordMatch) {
                console.log('password incorrect');
                return res.status(401).json({ incorrect: true, message: "Incorrect Password!" });
            }
            else{ 
                console.log('password is matching');

                if(!userData.isVerified === 1){
                    console.log('user account is not verified');
                    // return res.status(401).json({ notVerified: true, message: "Email verification is pending.. Please check your mail & verify.!" });
                    return res.status(401).json({ notVerified: true, message: "Email verification is pending. Please verify.!" });
                    // res.redirect('/verify-account');
                } else{
                    console.log('user account is verified');

                    req.session.userId = userData._id;
                    console.log('session id after verify account : ', req.session.userId);

                    return res.status(200).json({success: true});
                }
            }
        }
        
        
    } catch (error) {
        console.error("Error in login verification :", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}




// load user-registration page---------------------------------
const loadRegister = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        console.log('session data in register page is : ' , userData);
        const goldPriceData = await GoldPrice.findOne({});

        res.render('registration', {userData, goldPriceData});

    } catch (error) {
        console.log(error.message);
    }
}




// secure user password ---------------------------------------
const securePassword = async(password)=>{
    try {
        if (!password) {
            throw new Error("Password is required");
        }
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}




// create/insert new user data --------------------------------
const insertUser = async(req, res)=>{
    try {
        const { 
            userFirstName,
            userLastName,
            userEmail,
            userMobile,
            userPassword,
            referralCode
        } = req.body;

        console.log('req.body is: ', req.body);

        const existEmail = await User.findOne({email: userEmail});
        const existMobile = await User.findOne({mobile: userMobile});


        if (existEmail && existMobile){
            return res.json({bothExists: true});

        } else if (existEmail) {
            console.log('Email is exist...');
            return res.json({emailExists: true});

        } else if (existMobile){
            console.log('Mobile is exist...');
           return res.json({mobileExists: true});

        } else {
            const securedPass = await securePassword(userPassword);

            const user = new User ({
                firstname : userFirstName,
                lastname : userLastName,
                email : userEmail,
                mobile : userMobile,
                password : securedPass,
                isAdmin : 0,
                isBlocked : false
            });

            const userData = await user.save();


            // add some money to reffered user's wallet after new user registered.
            if (userData && referralCode){

                const refferalAmount = 500;
                const currentDate = new Date().toISOString();
                
                const transactionDetails = {
                    date : currentDate,
                    amount : refferalAmount,
                    description: `Referral Bonus for the User : ${userData.email}`,
                }

                const updatedReferredUser = await User.findOneAndUpdate(
                    {_id: referralCode},
                    {
                        $inc: {walletBalance: refferalAmount},
                        $push: {walletHistory: transactionDetails},
                    },
                    {new: true}
                );

                if (updatedReferredUser){
                    console.log('Updated referred user wallet amount:', updatedReferredUser.walletBalance);
                } else {
                    console.log('Failed to update the referred user wallet.');
                }
            }

            // send success response to user.
            if (userData) {
                const userId = userData._id;
                console.log('Created new user data :', userData._id);
                
                // proceed to send verification mail to user.
                sendOtpVerificationMail(userData, res);
                
                // return res.json({created: true, userId, message: 'You are now registered with us. Please verify your account.'});
            } 
            else {
                console.log('failed to create user data.');
                return res.json({registerFailed : true, message: "Failed to create your account."});
            }
        }


    } catch (error) {
        console.log('error in inserting the user :', error.message);
    }
}



// for sending mail for verification --------------------------
const sendOtpVerificationMail = async(userData, res)=>{
    try {
        const firstname = userData.firstname;
        const lastname = userData.lastname;
        const userEmail = userData.email;
        const userId = userData._id;

        const otp = Math.floor(Math.random()*900000+100000);
        console.log('generated OTP is :', otp);
        
        const expirationDuration = 1 * 60 * 1000; // 2 minutes in milliseconds
        const expirationTime = new Date(Date.now() + expirationDuration);

        const hashedOtp = await bcrypt.hash(otp.toString(), 10);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword
            }
        });


        const mailOptions = {
            from: process.env.emailUser,
            to: userEmail,
            subject: "Your One-Time Password (OTP) for Account Verification",
            html:
            `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Glitz Jewellery Boutique - Account Verification</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            max-width: 700px;
                            margin: 0;
                            padding: 0;
                            background-color: #f5f5f5;
                            color: #333;
                        }
                        .main{
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            border: 4px solid #9A0056; /* Your special color */
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 10px;
                            background-color: #fff;
                        }
                        .logo {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .logo img {
                            max-width: 150px;
                        }
                        .header {
                            background-color: #9A0056; /* Your special color */
                            text-align: center;
                            border-top-left-radius: 10px;
                            border-top-right-radius: 10px;
                            margin-top: -4px; /* Remove gap between border and header */
                        }
                        .header h2 {
                            margin: 0;
                            color: #fff;
                            padding: 10px 0; /* Add padding to the h2 directly */
                        }
                        h1 {
                            text-align: center;
                            color: #9A0056; /* Your special color */
                        }
                        p {
                            line-height: 1.6;
                            margin-bottom: 20px;
                        }
                        .otp {
                            padding: 10px 20px;
                            color: #fff;
                            background-color: #9A0056; /* Your special color */
                            border-radius: 5px;
                            display: inline-block;
                            margin-bottom: 20px;
                            font-size: 18px;
                        }
                        .contact h5 {
                            color: #9A0056; /* Your special color */
                            line-height: 0.5;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #666;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                <div class="main">
                    <div class="header">
                        <h2>Glitz Jewellery Boutique</h2>
                    </div>
                    <div class="container">
                        <div class="logo">
                            <img src="https://glitzjewellery.com/cdn/shop/files/glitz_logo_black_320x.png?v=1665889126" alt="Glitz Jewellery Boutique" alt="Glitz Jewellery Boutique">
                        </div>
                        <h1>Welcome to Glitz Jewellery Boutique!</h1>
                        <p>Dear <strong>${firstname} ${lastname}</strong>,</p>
                        <p>Thank you for registering with <strong>Glitz Jewellery Boutique</strong>! To complete the registration process, please enter the following One-Time Password (OTP) in the provided field:</p>
                        <div class="otp">
                            <strong>OTP:</strong> ${otp}
                        </div>
                        <p>This OTP is valid for a single use and will expire shortly. Please do not share this OTP with anyone for security reasons.</p>

                        <p>In case you missed or closed the verification page, you can access it again by clicking <a href=http://localhost:3000/verify-account?id=${userId}> <b> here.<a></b></p>

                        <p>If you did not request this registration or if you have any questions, please contact our support team immediately.</p>
                        <p>Thank you,</p><br>
                        <div class="contact">
                            <h5><strong>Glitz Jewellery Team</strong></h5>
                            <h5><strong>+91 9633699766</strong></h5>
                            <img src="https://glitzjewellery.com/cdn/shop/files/glitz_logo_black_320x.png?v=1665889126" width="25%" alt="Glitz Jewellery Boutique" alt="Glitz Jewellery Boutique">
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from Glitz Jewellery Boutique. If you have any questions or concerns, please don't hesitate to contact us.</p>
                </div>
                </body>
                </html>

            `
        };



        const userOtpRecord = await UserOtp.findOne({userRef : userId});

        if (userOtpRecord) {
            const updatedOtpData = await UserOtp.updateOne(
                {userRef: userId},
                {
                    otp: hashedOtp, 
                    createdAt: Date.now(), 
                    expireAt: expirationTime
                },
                {new: true}
            );

        } else {
            const newUserOtp = new UserOtp ({
                otp : hashedOtp,
                userRef : userId,
                createdAt : Date.now(),
                expireAt : expirationTime
            });

            const savedOtpData = await newUserOtp.save();
        }


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in sending OTP verification mail :', error);
                return res.json({mailFailed: true, userId, message: 'Failed to send verification code due to some netwonk issues.'});

            } else {
                console.log('Email sent : ' + info.response);
                console.log('data after sent mail (_id and expirationTime) : ', userId, expirationTime);
                return res.json({success: true, userId, message: 'Your account has been created successfully. Please verify your account.'});
            }
        });
        
    
        
    } catch (error) {
        console.log('Error in sendOtpVerificationMail :', error.message);
    }
}




// resend otp function -----------------------------------------
const resendOtp = async(req, res)=>{
    try {
        console.log("resend Otp query Id  : ", req.query.id);

        const userData = await User.findOne({_id: req.query.id});

        if (userData) {
            sendOtpVerificationMail(userData, res);
            console.log('sendOtpVerificationMail called for re-sending');

        } else {
            console.log('No user found with query id.');
            return res.json({failed: true});
        }

    } catch (error) {
        console.log('erron in resendOtp :', error.message);
    }
}




// load otp verification / account verification page ----------
const loadVerifyAccount = async(req, res)=>{
    try {
        const userId = req.query.id;
        console.log("Query received from otp page (/verify-account) :", req.query);

        if (userId){
            const userData = await User.findOne({_id: userId});
            const userCart = await Cart.findOne({ userRef: userId });
            const userWishlist = await Wishlist.findOne({ userRef: userId});

            const otpData = await UserOtp.findOne({userRef: userId});


            let cartCount = 0;
            let wishlistCount = 0;
            
            if (userCart){
                    userCart.product.forEach((product) => {
                    cartCount += product.quantity;
                });
            }
        
            if (userWishlist){
                userWishlist.product.forEach((product) => {
                    wishlistCount += product.quantity;
                });
            }

            if (otpData){
                // Calculate remaining time for OTP expiration
                const currentTime = new Date();
                const remainingTime = Math.max(0, otpData.expireAt - currentTime); // in milliseconds


                res.render('registerOtp', {
                    userData,
                    otpData,
                    cartCount,
                    wishlistCount,
                    remainingTime
                });
                console.log("Loaded verify account (otp) page with remaining time:", remainingTime, 'ms');
            }
            
        }
            


    } catch (error) {
        console.log('Register otp page loading failed :', error.message);

    }
}



// verify user account / user otp --------------------------------
const verifyAccount = async (req, res)=>{
    try {
        const submittedOtp = req.body.OTP;
        const userId = req.body.userId;
        const submittedAt = Date.now();

        console.log('data received for verifyAccount : ', req.body);
        console.log('OTP submittedAt : ', submittedAt);


        const otpData = await UserOtp.findOne({userRef: userId});
        console.log('database hashed otp & time : '+ otpData.otp, otpData.createdAt);

        if (!otpData) {
            return res.json({ notFound: true, message: 'OTP not found' });
        }   
        
        const isMatch = await bcrypt.compare(submittedOtp, otpData.otp);
        console.log('isMatch OTP: ', isMatch);
        
        if (submittedAt > otpData.expireAt){
            return res.json({otpExpire: true, message :'OTP Already Expired! Please Resend Code.'});
        }

        if (!isMatch){
            return res.json({incorrect: true, message : 'Incorrect OTP !'});
        }

        console.log('OTP verification successful');
        const updateInfo = await User.updateOne({_id: userId}, {isVerified: 1});
        console.log('updated user info after account verify : ', updateInfo);

        // userId assinged to the session
        req.session.userId = userId;

        return res.json({verified : true});


    } catch (error) {
        console.log(error);
        console.log('catch error in account verification');
        return res.status(500).json({ message: "Internal server error" });
    }
}




// load shopping page / products page ---------------------------
const loadShopping = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        console.log('session id in shopping : ', sessionId);
        const categoryData = await Category.find({});
        const goldPriceData = await GoldPrice.findOne({});
        const popularProducts = await Product.find({}).populate('offerRef');
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        const wishlistItems = userWishlist ? userWishlist.product.map((item) => item.productRef) : [];

        
        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }


        // Find expired offers
        const expiredOffers = await Offer.find({
            expiryDate: { $lt: new Date() },
            isListed: true // Only select offers that are currently listed
        }, '_id');
        const expiredOfferIds = expiredOffers.map(offer => offer._id);
        console.log('found ', expiredOfferIds.length, ' expired active offers in shopping.');

        // Find unlisted offers
        const unlistedOffers = await Offer.find({
            isListed: false
        }, '_id');
        const unlistedOfferIds = unlistedOffers.map(offer => offer._id);
        console.log('found ', unlistedOfferIds.length, ' unlisted/ blocked offers in shopping.');

        // Combine both sets of offer IDs
        const offerIdsToCancel = new Set([...expiredOfferIds, ...unlistedOfferIds]);

        // If there are no offers to cancel, skip the update operation
        if (offerIdsToCancel.size === 0) {
            console.log('No offers to cancel.');
            return;
        }

        // cancel the offer from category
        const updatedCategoryOffer = await Category.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer category in shopping :', updatedCategoryOffer.modifiedCount);
        
        // cancel the offer from products
        const updatedProductOffer = await Product.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer products in shopping :', updatedProductOffer.modifiedCount);



        const categoryQuery = req.query.categoryId;
        console.log('categoryQuery : ', categoryQuery);

        const searchQuery = req.query.search || '';
        console.log('searchQuery : ', searchQuery);

        const sortQuery = req.query.sort || 'none';
        console.log('sortQuery : ', sortQuery);

        let pageNo = parseInt(req.query.page) || 1;

        let query = {isBlocked: false};

        if (categoryQuery) {
            query.categoryRef = categoryQuery;
        }

        if (searchQuery) {
            query.$or = [
                { name: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { category: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { code: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
            ];
        }

        // console the query
        // console.log('Final query :', query);

        // sorting
        const sortOptions = {};
        switch (sortQuery) {
            case 'low-to-high':
                sortOptions.totalPrice = 1;  //ascending order
                break;
            case 'high-to-low':
                sortOptions.totalPrice = -1;  //descending order
                break;
            case 'a-z':
                sortOptions.name = 1;  //ascending order
                break;
            case 'z-a':
                sortOptions.name = -1;  //descending order
                break;
            default:
                break;
        }

        // console sort options
        // console.log('Sort options:', sortOptions);

        // Fetch all matching products
        const limit = 9;
        const skip = (pageNo - 1) * limit;

        const productData = await Product.find(query)
        .populate('categoryRef')
        .populate('offerRef')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();


        const productCount = await Product.countDocuments(query);
        console.log('count of productData :', productCount);
        
        // productData.forEach((item)=>{
        //     console.log('sort by totalPrice :', item.totalPrice);
        //     console.log('sort by name :', item.name);
        // })


        let totalPages = Math.ceil(productCount / limit);

        if(sessionId){
            const userData = await User.findById({_id: sessionId});
            console.log('session user information for shopping :', userData.email);
            res.render('shopping', {
                userData : userData, 
                cartCount,
                wishlistCount,
                wishlistItems,
                goldPriceData,
                productData, 
                categoryData, 
                searchQuery,
                sortQuery,
                categoryQuery,
                productCount, 
                limit,
                totalPages,
                currentPage : pageNo, 
                popularProducts
            });

        } else{
            console.log('no session data for shopping');
            res.render('shopping', {
                userData : null, 
                goldPriceData,
                productData, 
                categoryData, 
                categoryQuery,
                searchQuery,
                sortQuery,
                productCount, 
                limit,
                totalPages,
                currentPage : pageNo, 
                popularProducts, 
            });
        }


    } catch (error) {
        console.log('error in loading shopping page :', error.message);
    }
}




// load product details page -------------------------------------
const productDetals = async(req, res)=>{
    try {
        const sessionId = req.session.userId;

        const userData = await User.findOne({_id: sessionId});
        const productData = await Product.findOne({_id: req.query.id}).populate('categoryRef').populate('offerRef');
        const categoryData = await Category.find({});
        const goldPriceData = await GoldPrice.findOne({});
        const similarProducts = await Product.find({categoryRef: productData.categoryRef._id}).populate('offerRef');
        const popularProducts = await Product.find({}).populate('offerRef');
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        const wishlistItems = userWishlist ? userWishlist.product.map((item) => item.productRef) : [];


        let cartCount = 0;
        let wishlistCount = 0;

        
        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        // Find expired offers
        const expiredOffers = await Offer.find({
            expiryDate: { $lt: new Date() },
            isListed: true // Only select offers that are currently listed
        }, '_id');
        const expiredOfferIds = expiredOffers.map(offer => offer._id);
        console.log('found ', expiredOfferIds.length, ' expired active offers in productDetails.');

        // Find unlisted offers
        const unlistedOffers = await Offer.find({
            isListed: false
        }, '_id');
        const unlistedOfferIds = unlistedOffers.map(offer => offer._id);
        console.log('found ', unlistedOfferIds.length, ' unlisted/ blocked offers in productDetails.');

        // Combine both sets of offer IDs
        const offerIdsToCancel = new Set([...expiredOfferIds, ...unlistedOfferIds]);

        // If there are no offers to cancel, skip the update operation
        if (offerIdsToCancel.size === 0) {
            console.log('No offers to cancel.');
            return;
        }

        // cancel the offer from category
        const updatedCategoryOffer = await Category.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer category in productDetails :', updatedCategoryOffer.modifiedCount);
        
        // cancel the offer from products
        const updatedProductOffer = await Product.updateMany(
            { offerRef: { $in: [...offerIdsToCancel] } },
            { offerRef: null }
        );
        console.log('Number of cancelled offer products in productDetails :', updatedProductOffer.modifiedCount);


        if (sessionId) {
            res.render('productDetails', {userData, cartCount, wishlistCount, wishlistItems, productData, categoryData, goldPriceData, similarProducts, popularProducts});

        } else{
            res.render('productDetails', {userData: null, productData, categoryData, goldPriceData, similarProducts, popularProducts });
        }

    } catch (error) {
        console.log('failed to load product details page :', error.message);
        return res.render('500', {errorMessage : ''});
    }
}




// load user logout ----------------------------------------------
const userLogout = async(req, res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}




// verify forgot password mail and send mail -----------------------------------
const verifyForgetMail = async (req, res)=>{
    try {
        const userData = await User.findOne({email: req.body.forgotEmail});
        console.log('find data with forget email :', userData.firstname);

        if(!userData){
            return res.status(404).json({ notFound: true, message: 'The email you provided is not registered with us.' });
        } else {
            if(userData.isVerified === 0){
                return res.status(401).json({ notVerified: true, message: "Your account is not verified yet. Please check your email and complete the verification process." });
            } else {
                const randomToken = randomString.generate();
                console.log('random token is :', randomToken);

                const updatedData = await User.updateOne({email: userData.email}, {token: randomToken});
                console.log('updated user :', updatedData);

                sendforgetPasswordMail(userData, randomToken, res);
                return res.status(200).json({ success: true });
            }
        }

    } catch (error) {
        console.log('failed verify forget password mail');
    }
}




// to send forget password mail ----------------------------------
const sendforgetPasswordMail = async(userData, randomToken, res)=>{
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword
            }
        });


        const mailOptions = {
          from: process.env.emailUser,
          to: userData.email,
          subject: "Request for Reset Password",
          html: `

            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Glitz Jewellery Boutique - Account Verification</title>
                    <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 700px;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                        color: #333;
                    }
                    .main{
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border: 4px solid #9A0056; /* Your special color */
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        padding: 10px;
                        background-color: #fff;
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: 150px;
                    }
                    .header {
                        background-color: #9A0056; /* Your special color */
                        text-align: center;
                        border-top-left-radius: 10px;
                        border-top-right-radius: 10px;
                        margin-top: -4px; /* Remove gap between border and header */
                    }
                    .header h2 {
                        margin: 0;
                        color: #fff;
                        padding: 10px 0; /* Add padding to the h2 directly */
                    }
                    h1 {
                        text-align: center;
                        color: #9A0056; /* Your special color */
                    }
                    p {
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .otp {
                        padding: 10px 20px;
                        color: #fff;
                        background-color: #9A0056; /* Your special color */
                        border-radius: 5px;
                        display: inline-block;
                        margin-bottom: 20px;
                        font-size: 18px;
                    }
                    .contact h5 {
                        color: #9A0056; /* Your special color */
                        line-height: 0.5;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        color: #666;
                        font-size: 12px;
                    }
                    </style>
                </head>

                <body>
                    <div class="main">
                        <div class="header">
                            <h2>Glitz Jewellery Boutique</h2>
                        </div>
                        <div class="container">
                            <div class="logo">
                                <img src="https://glitzjewellery.com/cdn/shop/files/glitz_logo_black_320x.png?v=1665889126" alt="Glitz Jewellery Boutique" alt="Glitz Jewellery Boutique">
                            </div>
                            <h1>Password Reset Request</h1>
                            <p>Dear <strong>${userData.firstname} ${userData.lastname}</strong>,</p>
                            <p>We received a request to reset your password for your account at <strong>Glitz Jewellery Boutique</strong>. If you initiated this request, please follow the instructions below to reset your password:</p>
                            <p>Please click the following link to reset your password:</p>
                            <div class="reset-link"> <a href="https://glitzjwellery.in/reset-password?id=${userData._id}&token=${randomToken}"><strong>Reset Password</strong></a>
                            </div>
                            <p>If you did not request this password reset or if you have any questions, please contact our support team immediately.</p>
                            <p>Thank you,</p><br>
                            <div class="contact">
                                <h5><strong>Glitz Jewellery Team</strong></h5>
                                <h5><strong>+91 9633699766</strong></h5>
                                <img src="https://glitzjewellery.com/cdn/shop/files/glitz_logo_black_320x.png?v=1665889126" width="25%" alt="Glitz Jewellery Boutique" alt="Glitz Jewellery Boutique">
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This email was sent from Glitz Jewellery Boutique. If you have any questions or concerns, please don't hesitate to contact us.</p>
                    </div>
                </body>

            </html>
          

        `,
        };



        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in Sending Forget Password Mail', error);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('forget password email sent: ' + info.response);
                // res.send('Verification email sent successfully');
            }
        });
        
    
        
    } catch (error) {
        console.log(error.message);
    }
}





// load reset password page ---------------------------------------
const loadResetPassword = async (req, res)=>{
    try {
        const tokenUserData = await User.findOne({token: req.query.token});
        console.log('find the user with token : ', tokenUserData.firstname);

        if(!tokenUserData){
            res.render('404', {invalidToken: 'Token is expired or not valid anymore to reset the password !'});
            return;
        } else{
            const sessionId = req.session.userId;
            const userData = await User.findById(sessionId);

            res.render('resetPassword', {tokenUserData, userData});
            return;
        }

    } catch (error) {
        console.log('error in loading reset password page :', error.message);
        // res.render('500'); // Render a 500 page for internal server error
        res.render('404'); // Render a 500 page for internal server error
    }
    
}




// reset new password ---------------------------------------------
const resetPassword = async(req, res)=>{
    try {
        const {newPassword, userId} = req.body;
        const securePass = await bcrypt.hash(newPassword, 10);

        const updatedData = await User.updateOne({_id: userId}, {password: securePass, token: ''});
        console.log('password updated');

        return res.status(200).json({ success: true });

    } catch (error) {
        console.log('failed to reset new password', error.message);
    }
}




// load user-account page----------------------------------------
const loadUserAccount = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        console.log('userData in user account page : ' , userData);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        res.render('userAccount', { userData, cartCount, wishlistCount, goldPriceData });

    } catch (error) {
        console.log('error in loading user account dashboard', error.message);
    }
}



// load user-profile page----------------------------------------
const loadUserProfile = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        let cartCount = 0;
        let wishlistCount = 0;


        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        res.render('userProfile', { userData, cartCount, wishlistCount, goldPriceData });

    } catch (error) {
        console.log('error in loading user profile', error.message);
    }
}



// load user-profile page----------------------------------------
const loadEditUserProfile = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId });


        let cartCount = 0;
        let wishlistCount = 0;


        if (userData && userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        res.render('editUserProfile', { userData, cartCount, wishlistCount, goldPriceData });

    } catch (error) {
        console.log('error in loading edit user profile', error.message);
    }
}




// update user-profile ------------------------------------------
const updateUserProfile = async (req, res)=>{
    try {
        const body = req.body;
        const file = req.file;
        const userId = req.session.userId

        console.log('body from user profile : ', body);
        console.log('file from user profile : ', file);

        console.log('session id in user profile : ', userId);
        
        if (file) {
            const updatedUserData = await User.findByIdAndUpdate(
              { _id: userId },
              { $set: {
                  firstname: req.body.firstname,
                  lastname: req.body.lastname,
                  mobile: req.body.mobile,
                  photo: req.file.filename,
                },
              },
              { new : true }
              
            );

            console.log('updatedUserData with photo : ', updatedUserData);

        } else {
            const updatedUserData = await User.findByIdAndUpdate(
              { _id: userId },
              { $set: {
                  firstname: req.body.firstname,
                  lastname: req.body.lastname,
                  mobile: req.body.mobile,
                },
              },
              { new : true }
            );

            console.log('updatedUserData without photo : ', updatedUserData);
        }

        return res.status(200).json({ success: true });

        
    } catch (error) {
        console.log('error in loading updated user profile :', error.message);
    }
}




// update user-password -----------------------------------------
const updateUserPassword = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const {oldPassword, newPassword} = req.body;
        console.log('oldPassword :', oldPassword);
        console.log('newPassword :', newPassword);
        
        const userData = await User.findOne({_id: sessionId});
        
        // if any password already stored in db. (no password stored if google signup)
        if (userData.password){
            const matchPassword = await bcrypt.compare(oldPassword, userData.password);
            console.log('matchPassword: ', matchPassword);
    
            if (!matchPassword) {
                console.log('incorrect password');
                return res.json({ incorrect: true});
            }
        }

        const securePassword = await bcrypt.hash(newPassword, 10);
        console.log('securePass :', securePassword);

        const updatedUserData = await User.updateOne({_id: req.session.userId}, {password: securePassword});
        console.log('password changed');
        return res.status(200).json({success: true});
        
        
    } catch (error) {
        console.log('error in changing user password :', error.message);
        return res.status(500).json({ message: 'An error occurred' });
    }
}




// load user wallet ---------------------------------------------
const loadCoupons = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});

        let cartCount = 0;
        let wishlistCount = 0;


        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const couponData = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: new Date() },
        })
        .skip(skip).limit(limit);

        const totalCoupons = await Coupon.countDocuments({
            isActive: true,
            expiryDate: { $gte: new Date() },
        });

        console.log('coupon data :', couponData);
        console.log('total coupons :', totalCoupons);


        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('userCoupons', { userData, 
            couponData, 
            totalCoupons,
            totalPages,
            limit,
            page,

            cartCount, wishlistCount, 
            goldPriceData 
        });

    } catch (error) {
        console.log('failed to load the user coupons page :', error.message);

    }
}




// load user wallet ---------------------------------------------
const loadWallet = async (req, res) => {
    try {
        const sessionId = req.session.userId;
        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({ userRef: sessionId });
        const userData = await User.findById(sessionId);

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const skip = (page - 1) * limit;

        // Fetch all transactions for pagination
        const allTransactions = userData.walletHistory || [];
        const totalItems = allTransactions.length;

        // Sort transactions in ascending order by date for correct balance calculation
        allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate balance and paginate transactions
        let runningBalance = 0;
        const transactionsWithBalance = allTransactions.map(transaction => {
            runningBalance += transaction.amount;
            return {
                ...transaction,
                description: transaction.description,
                date: transaction.date,
                debit: transaction.amount < 0 ? Math.abs(transaction.amount).toFixed(2) : '',
                credit: transaction.amount > 0 ? transaction.amount.toFixed(2) : '',
                balance: runningBalance.toFixed(2)
            };
        });

        // Reverse transactions for display (most recent first)
        const paginatedTransactions = transactionsWithBalance.reverse().slice(skip, skip + limit);


        let cartCount = 0;
        let wishlistCount = 0;

        if (userCart) {
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist) {
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        res.render('userWallet', {
            userData,
            cartCount,
            wishlistCount,
            goldPriceData,
            transactions: paginatedTransactions,
            totalItems,
            limit,
            page,
            totalPages: Math.ceil(totalItems / limit)
        });
    } catch (error) {
        console.log('Failed to load the user wallet:', error.message);
    }
};










module.exports = {
    load404,
    loadHome,
    loadLogin,
    verifyLogin,
    loadRegister,
    securePassword,
    insertUser,
    sendOtpVerificationMail,
    loadVerifyAccount,
    verifyAccount,
    resendOtp,
    loadShopping,
    productDetals,
    userLogout,
    verifyForgetMail,
    loadResetPassword,
    resetPassword,
    loadUserAccount,
    loadUserProfile,
    loadEditUserProfile,
    updateUserProfile,
    updateUserPassword,
    loadCoupons,
    loadWallet,
}