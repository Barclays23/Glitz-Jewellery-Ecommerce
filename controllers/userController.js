const User = require ('../models/userModel');
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
        res.render('login');
    } catch (error) {
        console.log(error.message);
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
                sendVerifyMail(req.body.firstname, req.body.lastname, req.body.email, userData._id);
                res.render('registration', {message: "Registration Successful, Please verify your Email."});
            } else {
                res.render('registration', {message: "Registration Failed !"});
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}




// for sending mail for verification --------------------------
const sendVerifyMail = async(firstname, lastname, email, user_id)=>{
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.emailUser,
                pass: process.env.emailPassword
            }
        });

        const otp = Math.floor(Math.random()*900000+100000);

        const mailOptions = {
            from: process.env.emailUser,
            to: email,
            subject: "Your One-Time Password (OTP) for Account Verification",
            // html: `<p>Hi ${firstname} ${lastname},<br>Please click <a href="http://localhost:3000/verify?id=${user_id}"> here </a> to verify your email ID </p>`
            html: `<p>Dear ${firstname} ${lastname},<br> Thank you for registering with <b>Glitz Jewellery Boutique</b> ! To complete the registration process, please enter the following One-Time Password (OTP) in the provided field:
            <br><br>
            OTP: <b>${otp}</b>
            <br><br>
            This OTP is valid for a single use and will expire shortly. Please do not share this OTP with anyone for security reasons.
            <br>
            If you did not request this registration or if you have any questions, please contact our support team immediately.
            <br><br>
            Thank you, <br>
            <b>Glitz Jewellery Team <br>
            +91 9633699766 </b>
            </p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);
                res.send('Email sent successfully');
            }
        });
    
    } catch (error) {
        console.log(error.message);
    }
}




const loadVerifyAccount = async(req, res)=>{
    try {
        res.render('register-otp');
    } catch (error) {
        console.log('Register otp page loading failed');
    }
}



module.exports = {
    loadHome,
    loadLogin,
    loadRegister,
    securePassword,
    insertUser,
    sendVerifyMail,
    loadVerifyAccount

}