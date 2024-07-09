const Address = require ('../models/addressModel');
const User = require ('../models/userModel');
const GoldPrice = require ('../models/goldPriceModel');
const Cart = require ('../models/cartModel');
const Wishlist = require ('../models/wishlistModel');






// load user address page ---------------------------------
const loadUserAddress = async (req, res)=>{
    try {
        const userId = req.session.userId
        const sessionData = await User.findById(userId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: userId });
        const userWishlist = await Wishlist.findOne({userRef : userId});

        let cartCount = 0;
        let wishlistCount = 0;

        if (sessionData && userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }

        const userAddress = await Address.findOne({userRef: userId});

        res.render('userAddress', { sessionData, userAddress, cartCount, wishlistCount, goldPriceData });

    } catch (error) {
        console.log('error in loading user address page', error.message);
    }
}




// add new address -------------------------------
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




// edit user address -------------------------------
const editAddress = async (req, res)=>{
    try {
        const userId = req.session.userId;

        const {
            addressId,
            firstname,
            lastname,
            address,
            city,
            zipcode,
            state,
            phone,
        } = req.body;

        console.log('addressId :', addressId);
        console.log('firstname :', firstname);
        console.log('lastname :', lastname);
        console.log('address :', address);
        console.log('city :', city);
        console.log('zipcode :', zipcode);
        console.log('state :', state);
        console.log('phone :', phone);

        const updatedUserAddress = await Address.findOneAndUpdate(
            { userRef: userId, 'address._id': addressId },
            { $set: {
                    'address.$.firstname': firstname,
                    'address.$.lastname': lastname,
                    'address.$.street': address,
                    'address.$.city': city,
                    'address.$.pincode': zipcode,
                    'address.$.state': state,
                    'address.$.contact': phone
                }
            },
            { new: true }
        );

        console.log('user address updated:');

        return res.json({success: true});

    } catch (error) {
        console.log('error while editing address :', error.message);
        return res.status(500).res.json({error: true});
    }
}




// delete user address -------------------------------
const deleteAddress = async (req, res)=>{
    try {
        const userId = req.session.userId;

        const {
            addressId,
        } = req.body;

        console.log('addressId :', addressId);
        const updatedUserAddress = await Address.findOneAndUpdate(
            {userRef: userId},
            {$pull: {address: {_id: addressId}}},
        );

        console.log('user address deleted');

        return res.json({deleted: true});


    } catch (error) {
        console.log('error while deleting address :', error.message);
        return res.status(500).res.json({error: true});
    }
}




module.exports = {
    loadUserAddress,
    addNewAddress,
    editAddress,
    deleteAddress
}