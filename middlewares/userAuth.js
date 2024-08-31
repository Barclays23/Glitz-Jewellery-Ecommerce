// const session = require("express-session");
const User = require ('../models/userModel');


const isLogin = async(req, res, next)=>{
    try {
        if(req.session.userId){
            next();
        }
        else{
            res.redirect('/');
        }
        
    } catch (error) {
        console.log(error.message);
    }
}



const isLogout = async(req, res, next)=>{
    try {
        if (req.session.userId) {
            res.redirect('/');
            
        } else {
            next();
        }

    } catch (error) {
        console.log(error.message);
    }
}



const isBlocked = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);

            if (user && user.isBlocked) {
                return res.render('userBlocked', {
                    message: 'Your account is blocked by admin. Please contact support for more information.'
                });
            }
        }

        // If not blocked, proceed to the next middleware or route
        next();

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = {
    isLogin,
    isLogout,
    isBlocked
}