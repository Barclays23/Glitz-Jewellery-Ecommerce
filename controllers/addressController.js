const Address = require ('../models/addressModel');
const User = require ('../models/userModel');
const GoldPrice = require ('../models/goldPriceModel');
const Cart = require ('../models/cartModel');
const Wishlist = require ('../models/wishlistModel');






// load user address page ---------------------------------
const loadUserAddress = async (req, res)=>{
    try {
        const sessionId = req.session.userId
        const userData = await User.findById(sessionId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({ userRef: sessionId });
        const userWishlist = await Wishlist.findOne({userRef : sessionId});

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


        const userAddress = await Address.findOne({ userRef: sessionId })
        .skip(skip)
        .limit(limit)
        .lean();

        // Get the total number of addresses for the user
        const totalItems = await Address.countDocuments({ userRef: sessionId });
        console.log('total address length :', totalItems);
        

        res.render('userAddress', { 
            userData, 
            userAddress, page, totalItems,  limit,  
            cartCount, wishlistCount, 
            goldPriceData 
        });

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

        const sessionId = req.session.userId;

        const userAddress = await Address.findOneAndUpdate(
          { userRef: sessionId },
          { $set: { userRef: sessionId }, $push: { address: addressData } },
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
        const sessionId = req.session.userId;

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
            { userRef: sessionId, 'address._id': addressId },
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
        const sessionId = req.session.userId;

        const {
            addressId,
        } = req.body;

        console.log('addressId :', addressId);
        const updatedUserAddress = await Address.findOneAndUpdate(
            {userRef: sessionId},
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