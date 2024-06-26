const Address = require ('../models/addressModel');
const User = require ('../models/userModel');
const GoldPrice = require ('../models/goldPriceModel');
const Cart = require ('../models/cartModel');





// load user address page ---------------------------------
const loadUserAddress = async (req, res)=>{
    try {
        const userId = req.session.userId
        const sessionData = await User.findById(userId);

        const goldPriceData = await GoldPrice.findOne({});

        const userCart = await Cart.findOne({ userRef: userId });

        // to show the cart count in navbar
        let cartCount = 0;
        if (sessionData && userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        const userAddress = await Address.findOne({userRef: userId});

        res.render('userAddress', { sessionData, userAddress, cartCount, goldPriceData });

    } catch (error) {
        console.log('error in loading user profile', error.message);
    }
}




// add new address for users -------------------------------
const addNewAddress = async (req, res)=>{
    try {
        const addressData = {
            firstname : req.body.firstname, 
            lastname : req.body.lastname, 
            street : req.body.address,
            city : req.body.city,
            pincode : req.body.zipcode,
            state : req.body.state,
            contact : req.body.phone,
        }

        console.log('body recieved for add address :', req.body);

        const userId = req.session.userId;

        const userAddress = await Address.findOneAndUpdate(
          { userRef: userId },
          { $set: { userRef: userId }, $push: { address: addressData } },
          { upsert: true, new: true }
        );

        console.log('added user address :', userAddress);

        return res.json({success: true});


    } catch (error) {
        console.log('error while adding new address :', error.message);
        return res.status(500).res.json({error: true});
    }
}




// add new address for users -------------------------------
const editAddress = async (req, res)=>{
    try {
        const addressData = {
            firstname : req.body.firstname, 
            lastname : req.body.lastname, 
            street : req.body.address,
            city : req.body.city,
            pincode : req.body.zipcode,
            state : req.body.state,
            contact : req.body.phone,
        }

        console.log('body recieved for edit address :', req.body);

        const userId = req.session.userId;

        // const updatedUserAddress = await Address.findOneAndUpdate(
        //   { userRef: userId },
        //   { $set: { userRef: userId }, $push: { address: addressData } },
        //   { upsert: true, new: true }
        // );

        // console.log('added user address :', updatedUserAddress);

        // return res.json({success: true});


    } catch (error) {
        console.log('error while adding new address :', error.message);
        return res.status(500).res.json({error: true});
    }
}






module.exports = {
    loadUserAddress,
    addNewAddress,
    editAddress,
}