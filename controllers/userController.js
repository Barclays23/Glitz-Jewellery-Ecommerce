const User = require ('../models/userModel');
const UserOtp = require ('../models/otpModel');
const bcrypt =  require ('bcrypt');
const nodemailer = require ('nodemailer');



// load user home page----------------------------------------------
const loadHome = async(req, res)=>{
    try {
        const userData = User.findById({_id : req.session.user_id});
        if(!userData){
            req.session.destroy();
            res.redirect ('/');
        }
        res.render('home', {user: userData});

    } catch (error) {
        console.log(error.message);
    }
}



// load user-login page----------------------------------------
const loadLogin = async (req, res)=>{
    try {
        const verificationSuccess = req.query.verification === 'success';
        const passwordResetSuccess = req.query.passwordReset === 'success';

        res.render('login', { verificationSuccess, passwordResetSuccess });
    } catch (error) {
        console.log(error.message);
    }
}




// verify userlogin -----------------------------------------------
const verifyLogin = async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;
        console.log('req.body is : ', req.body);

        const userData = await User.findOne({ email: loginEmail });
        console.log('userData is : ', userData);

        if (!userData) {
            return res.status(404).json({ notFound: true, message: "The email is not registered with us. Please sign up." });
        } else {
            const passwordMatch = await bcrypt.compare(loginPassword, userData.password);
            if (!passwordMatch) {
                console.log("Incorrect password");
                return res.status(401).json({ incorrect: true, message: "Incorrect Password!" });
            } else {
                console.log('Sign in successful');
                return res.status(200).json({ success: true });
            }
        }
    } catch (error) {
        console.error("Error in login verification:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}






// load user-registration page---------------------------------
const loadRegister = async (req, res)=>{
    try {
        res.render('registration');

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
        const existEmail = await User.findOne({email: req.body.email});
        // const existMobile = await User.findOne({mobile: req.body.mobile});
        if (existEmail) {
            res.render('registration', {message: 'Email Already Exists.!'});
            console.log('Email already und...');
        // } else if (existMobile){
        //     res.render('registration', {message: 'Mobile Number Already Exists.!'});
        } else {
            const securedPass = await securePassword(req.body.registerpassword);
            const user = new User ({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                mobile : req.body.mobile,
                password : securedPass,
                isAdmin : 0
            });

            const userData = await user.save();

            if (userData) {
                sendOtpVerificationMail(userData, res);
                // res.render('registration', {message: "Registration Successful, Please verify your Email."});
                res.redirect(`/verify-account?id=${userData._id}`);
            } else {
                res.render('registration', {message: "Registration Failed !"});
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}




// for sending mail for verification --------------------------
const sendOtpVerificationMail = async({firstname, lastname, email, _id}, res)=>{
    try {
        const otp = Math.floor(Math.random()*900000+100000);
        console.log('generated otp is: ' + otp);
        const expirationDuration = 2 * 60 * 1000; // 2 minutes in milliseconds
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
          to: email,
          subject: "Your One-Time Password (OTP) for Account Verification",
          // html: `<p>Hi ${firstname} ${lastname},<br>Please click <a href="http://localhost:3000/verify?id=${_id}"> here </a> to verify your email ID </p>`
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
                <h1>Welcome to Glitz Jewellery Boutique!</h1>
                <p>Dear <strong>${firstname} ${lastname}</strong>,</p>
                <p>Thank you for registering with <strong>Glitz Jewellery Boutique</strong>! To complete the registration process, please enter the following One-Time Password (OTP) in the provided field:</p>
                <div class="otp">
                    <strong>OTP:</strong> ${otp}
                </div>
                <p>This OTP is valid for a single use and will expire shortly. Please do not share this OTP with anyone for security reasons.</p>
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



        
        const userOtpRecord = await UserOtp.findOne({userRef : _id});

        if (userOtpRecord) {
            await UserOtp.updateOne({userRef: _id}, {otp: hashedOtp, createdAt: Date.now(), expireAt: expirationTime});
        } else {
            const newUserOtp = new UserOtp ({
                otp : hashedOtp,
                userRef : _id,
                createdAt : Date.now(),
                expireAt : expirationTime
            });

            const otpData = await newUserOtp.save();
        }


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in Sending OTP Verification Mail', error);
                // console.error('Error in Sending OTP Verification Mail', error);
                res.status(500).send('Error sending email');
                // res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('Email sent: ' + info.response);
                res.send('Verification email sent successfully');
            }
        });
        
    
        
    } catch (error) {
        console.log(error.message);
    }
}




// load otp verification / account verification page ----------
const loadVerifyAccount = async(req, res)=>{
    try {
        const userId = req.query.id;
        res.render('register-otp', {userId});
    } catch (error) {
        console.log('Register otp page loading failed');
    }
}



// verify user account / user otp --------------------------------
const verifyAccount = async (req, res)=>{
    try {
        const submittedOtp = req.body.OTP;
        const submittedAt = Date.now();
        console.log('body id from hidden form field  or submitted otp & time : ', submittedOtp, submittedAt);


        const otpData = await UserOtp.findOne({userRef: req.body.userID});
        console.log('database hashed otp & time : '+ otpData.otp, otpData.createdAt);

        if (!otpData) {
            return res.status(400).json({ notFound: true, message: 'OTP not found' });
        }   
        
        const isMatch = await bcrypt.compare(submittedOtp, otpData.otp);
        console.log('isMatch OTP: ', isMatch);
        
        if(!isMatch){
            return res.status(400).json({incorrect: true, message : 'Incorrect OTP !'});
        }
        
        if(submittedAt > otpData.expireAt){
            return res.status(400).json({otpExpire: true, message :'OTP Expired !'});
        }

        console.log('OTP verification successful');
        return res.json({ success: true});



    } catch (error) {
        console.log(error);
        console.log('catch error in account verification');
        return res.status(500).json({ message: "Internal server error" });
    }
}






module.exports = {
    loadHome,
    loadLogin,
    verifyLogin,
    loadRegister,
    securePassword,
    insertUser,
    sendOtpVerificationMail,
    loadVerifyAccount,
    verifyAccount,

}