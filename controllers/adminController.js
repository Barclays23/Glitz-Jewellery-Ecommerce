const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');


const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');



// load admin login page --------------------------------------------------
const loadLogin = async(req, res)=>{
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log('loadLogin failed', error.message);
    }
}



// verify admin login -----------------------------------------------------
const verifyLogin = async(req, res)=>{
    try {
        const { loginEmail, loginPassword } = req.body;
        const userData = await User.findOne({email: loginEmail});
        console.log('logged in admin : ', userData.firstname, userData.lastname, userData.email);

        if(userData){
            const passwordMatch = await bcrypt.compare(loginPassword, userData.password);

            if (passwordMatch){
                if(userData.isAdmin === 1){
                    console.log('this user is an Admin');
                    req.session.adminId = userData._id;
                    console.log('req session of admin : ', req.session);
                    
                    return res.status(200).json({ success: true });
                } else {
                    console.log("User is not an admin");
                    return res.status(401).json({ notAdmin: true, message: "You are not an authorized user! Please contact our admin team." });
                }
            } else {
                return res.status(401).json({ incorrect: true, message: "Incorrect Password!" });
            }
        } else {
            return res.status(404).json({ notFound: true, message: "The email is not registered with us. Please sign up." });
        }


    } catch (error) {
        console.log(error.message, 'verify login error');
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
}




// for verifying the forget password email entered --------------------------
const verifyForgetMail = async(req, res)=>{
    try {
        const userData = await User.findOne({email: req.body.forgotPasswordEmail});
        console.log('userdata is', userData);
        if (userData) {
            console.log('userdata found');
            if (userData.isAdmin === 1) {
                console.log('user is an admin');
                if (userData.isVerified === 1) {

                    console.log('user is verified');
                    const randomString = randomstring.generate();
                    console.log('random string for forget password', randomString);
                    const updatedData = await User.updateOne({email: userData.email}, {token: randomString});
                    console.log('updated data with token', updatedData);
                    sendforgetPasswordMail(userData, randomString, res);

                    return res.status(200).json({ success: true });

                } else {
                    console.log('not a verified user');
                    return res.status(401).json({ notVerified: true, message: "Your account is not verified yet. Please check your email and complete the verification process." });
                }
            }
            else {
                console.log('not admin');
                return res.status(401).json({ notAdmin: true, message: "You are not an authorized user. Please contact our admin team." });
            }
            
        }
        else {
            console.log('userdata is not found');
            return res.status(404).json({ notFound: true, message: "The email is not registered with us." });
        }

    } catch (error) {
        console.log('failed verifying the forget password user/mail', error);
    }
}




// for sending mail for forget password -------------------------------------
const sendforgetPasswordMail = async(userData, randomString, res)=>{
    try {
        // const otp = Math.floor(Math.random()*900000+100000);
        // console.log('generated otp is: ' + otp);
        // const expirationDuration = 5 * 60 * 1000; // 2 minutes in milliseconds
        // const expirationTime = new Date(Date.now() + expirationDuration);
        // const hashedOtp = await bcrypt.hash(otp.toString(), 10);


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
                            <div class="reset-link"> <a href="http://localhost:${process.env.port}/admin/reset-password?id=${userData._id}&token=${randomString}"><strong>Reset Password</strong></a>
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



        // only if reset the password using otp 
        // const userOtpRecord = await UserOtp.findOne({userRef : userData._id});

        // if (userOtpRecord) {
        //     await UserOtp.updateOne({userRef: _id}, {otp: hashedOtp, createdAt: Date.now(), expireAt: expirationTime});
        // } else {
        //     const newUserOtp = new UserOtp ({
        //         otp : hashedOtp,
        //         userRef : _id,
        //         createdAt : Date.now(),
        //         expireAt : expirationTime
        //     });

        //     const otpData = await newUserOtp.save();
        // }


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in Sending Forget Password Mail', error);
                // console.error('Error in Sending OTP Verification Mail', error);
                res.status(500).send('Error sending forget password email');
                // res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('forget password email sent: ' + info.response);
                res.send('Verification email sent successfully');
            }
        });
        
    
        
    } catch (error) {
        console.log(error.message);
    }
}





// load reset password page -------------------------------------------------
const loadResetPassword = async (req, res) => {
    try {
        const userToken = req.query.token;
        console.log('this is the token', userToken);
        const tokenUserData = await User.findOne({ token: userToken });

        if (tokenUserData) {
            console.log('token user is available, tokenData is: ', tokenUserData);
            res.render('resetPassword', {userId: tokenUserData._id});

        } else{
            console.log('token user is not available');
            res.render('404', {invalidToken: 'Token is expired or not valid anymore to reset the password !'});
            return;
        }

    } catch (error) {
        console.log('failed loading reset password page', error);
        res.render('500'); // Render a 500 page for internal server error
    }
}




const resetPassword = async(req, res)=>{
    try {
        const {newPassword, userId} = req.body;
        console.log('userId of new password user: ', userId);
        const securePass = await bcrypt.hash(newPassword, 10);

        const updatedData = await User.findOneAndUpdate({_id: userId}, {password: securePass, token: ''});
        console.log('updatedData after reseting the password & token', updatedData);
        return res.status(200).json({ success: true });
    
    } catch (error) {
        console.log('error occurred while reseting the password.');
    }
}




// load admin dashboard ------------------------------------------
const loadAdminDashboard = async(req, res)=>{
    try {
        const adminData = await User.findById({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});

        console.log('admin name from session : ' , adminData.firstname, adminData.lastname);
        res.render('adminDashboard', {adminData, goldPriceData});

    } catch (error) {
        console.log('failed to load admin dashboard', error.message);
    }
}




// load users list -----------------------------------------------
const loadUsersList = async(req, res)=>{
    try {
        const adminData = await User.findById({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});

        let search = '';
        if(req.query.search){
            search = req.query.search;
        }

        let pageNo = 1;
        if(req.query.page){
            pageNo = req.query.page;
        }

        const limit = 2;


        const userQuery = {
            isAdmin: 0,
            $or: [
                {firstname: {$regex:'.*'+search+'.*', $options: 'i'}},
                {lastname: {$regex:'.*'+search+'.*', $options: 'i'}},
                {email: {$regex:'.*'+search+'.*', $options: 'i'}},
                {mobile: {$regex:'.*'+search+'.*', $options: 'i'}},
            ]
        };

        const userData = await User.find(userQuery)
        .limit(limit * 1)
        .skip((pageNo -1) * limit)
        .exec()


        let count = await User.find(userQuery).countDocuments();

        let totalPages = Math.ceil(count /limit);

        console.log('count of users : ', count);
        console.log('logged admin : ', adminData);


        res.render('usersList', {
            adminData,
            userData,
            totalPages,
            currentPage: pageNo,
            goldPriceData
        });


    } catch (error) {
        console.log('failed to load users list', error.message);
    }
}




//manage user (block and unblock) -------------------------------
const manageUser = async(req, res)=>{
    try {
        console.log('body of manageUSER",' , req.body);
        const userData = await User.findOne({_id: req.body.id});

        if(userData.isBlocked === true){
            await User.updateOne({_id: req.body.id}, {isBlocked: false});
            console.log('changed: blocked to active');
        }
        else{
            await User.updateOne({_id: req.body.id}, {isBlocked: true});
            console.log('changed: active to blocked');
        }


        return res.json({success: true});



    } catch (error) {
        console.log('failed to manage user', error.message);
    }
}





const loadMailDraft = async(req, res)=>{
    try {
        const adminData = await User.findById({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});

        res.render('sendMail', {adminData, goldPriceData});

    } catch (error) {
        console.log('failed to load the mail drafting page', error);
    }
}




// send mail to users ---------------------------------------------
const sendMail = async(req, res)=>{
    try {

        let {recipientName, recipientEmail, emailSubject, emailMessage, emailFile} = req.body;
        console.log('req body: ', req.body);

        if (recipientName === '') {
            recipientName = 'Concerned'
        } else {

        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword
            }
        });


        const mailOptions = {
          from: process.env.emailUser,
          to: recipientEmail,
          subject: emailSubject,
          html: `

            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Glitz Jewellery Boutique - Account Verification</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
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
                    .contact {
                        display: flex;
                        align-items: center;
                    }
                    .contact img {
                        max-width: 100%;
                        height: auto;
                    }
                    .contact h5 {
                        color: #9A0056; /* Your special color */
                        line-height: 0.5;
                        margin-bottom: 3px;
                        font-size: 13px;
                    }
                    .contact a {
                        color: #9A0056;
                        text-decoration: none;
                    }
                    .vertical-line {
                        border-left: 1px solid black;
                        height: auto;
                        margin: 0 10px;
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
                            <h2>${emailSubject}</h2>
                        </div>
                        <div class="container">
                            <div class="logo">
                                <img src="https://glitzjewellery.com/cdn/shop/files/glitz_logo_black_320x.png?v=1665889126" alt="Glitz Jewellery Boutique">
                            </div>
                            <h1>${emailSubject}</h1>
                            <p>Dear <strong>${recipientName}</strong>,</p>
                            <p>${emailMessage}</p>
                            <p>Thank you,</p>
                            <br>
                            <div class="row contact">
                                <div class="contact">
                                    <img src="https://scontent.fcok6-1.fna.fbcdn.net/v/t1.6435-9/64306097_2400851473307196_4593893454978744320_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=5f2048&_nc_ohc=gJ4pH_IP2_MQ7kNvgGV5m2t&_nc_ht=scontent.fcok6-1.fna&oh=00_AYAn-H33GV-qI95f_Ho8jD9GuGpfgPDAR6ob3NsfXcC9Mw&oe=6678CE8C" width="60" height="auto" alt="profile-pic">
                                </div>
                                <div class="vertical-line"></div>
                                <div>
                                    <h5><strong>MOHAMMED SAJEER M</strong></h5>
                                    <div class="about-me">
                                    <p>
                                        Mern Stack Developer <strong><span style="color: #9A0056;"> | </span></strong>
                                        +91 9633699766 <strong><span style="color: #9A0056;"> | </span></strong>
                                    </p>
                                    </div>
                                    <a href="https://www.linkedin.com/in/barclays23/"> <img src="https://toppng.com/uploads/preview/linkedin-logo-png-11660255206h6vpja2o2i.png" width="25" height="auto"</a>
                                    <a href="https://github.com/Barclays23"> <img src="https://toppng.com/uploads/preview/github-logo-no-background-11659780007hi1mf26doa.png" width="25" height="auto"</a>
                                    <a href="https://wa.me/919633699766"> <img src="https://toppng.com/uploads/preview/whatsapp-logo-png-download-11662156013fmfqqlrnja.png" width="25" height="auto"</a>
                                    <a href="https://www.facebook.com/sajee23"> <img src="https://toppng.com/uploads/preview/facebook-transparent-l-11545516607i8qwg3zwap.png" width="25" height="auto"</a>
                                    <a href="https://www.instagram.com/barclays_sajeer_23/"> <img src="https://toppng.com/uploads/preview/instagram-logo-png-image-11658867227dorxuzmfwf.png" width="25" height="auto"</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This email was sent from Glitz Jewellery Boutique. If you have any questions or concerns, please don't hesitate to contact us.</p>
                    </div>
                    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
                    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
                </body>

            </html>

        `,
        };



        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in sending mail', error);

                res.status(500).send('Error sending email');
                // res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('email sent to user : ' + info.response);
                return res.status(200).json({success: true});
            }
        });
        
    
        
    } catch (error) {
        console.log('failed sending email', error.message);
    }
}



// load admin logout --------------------------------------------------
const adminLogout = async(req, res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin/login');
    } catch (error) {
        console.log('admin logout failed', error.message);
    }
}





module.exports = {
    loadLogin,
    verifyLogin,
    loadAdminDashboard,
    verifyForgetMail,
    loadResetPassword,
    resetPassword,
    loadUsersList,
    manageUser,
    loadMailDraft,
    sendMail,
    adminLogout,
}