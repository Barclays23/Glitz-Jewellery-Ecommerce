const User = require('../models/userModel');
const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');
const GoldPrice = require('../models/goldPriceModel');






// load coupon list for admin -----------------------------------------
const loadCouponList = async(req, res)=>{
    try {
        const adminData = await User.findById(req.session.adminId);

        const goldPriceData = await GoldPrice.findOne({});

        const couponData = await Coupon.find({});  // find all coupons for admin


        res.render('couponList', {adminData, goldPriceData, couponData });

    } catch (error) {
        console.log('error in loading coupon list :', error);
    }
}




// add coupon -----------------------------------------
const addCoupon = async(req, res)=>{
    try {
        const {
            couponName,
            couponCode,
            criteriaAmount,
            couponValue,
            startDate,
            expiryDate,
            couponCount,
            isActive} = req.body;
        console.log('received data to add coupon :', req.body);

        const existingCode = await Coupon.findOne({code: couponCode});

        if (existingCode){
            console.log('coupon code already exist.');
            return res.json({codeExist: true, couponCode});

        } else {
            const couponImage = req.file ? req.file.filename : null;
            console.log('received image of coupon :', couponImage);
    
            const newCoupon = new Coupon(
                {
                    name : couponName,
                    code : couponCode,
                    image : couponImage,
                    criteriaAmount: criteriaAmount,
                    couponValue: couponValue,
                    activationDate: startDate,
                    expiryDate: expiryDate, // new Date('2024-07-31'),
                    couponCount: couponCount,
                    usedCount: 0,
                    isActive: isActive
                }
            );
            
            const createdCoupon = await newCoupon.save();
            console.log('created new coupon');

            return res.json({created: true});
        }


    } catch (error) {
        console.log('error while adding coupon :', error);
    }
}




// edit coupon ----------------------------------
const editCoupon = async (req, res)=>{
    try {
        const {
            couponId,
            couponName,
            couponCode,
            criteriaAmount,
            couponValue,
            startDate,
            expiryDate,
            couponCount,
            isActive
        } = req.body;

        console.log('data recieved for editing coupon :', req.body);

        const existingCoupon = await Coupon.findOne({code: couponCode, _id: {$ne: couponId}});

        if (existingCoupon){
            console.log('coupon code already existing');
            return res.json({exist: true, couponCode});

        } else {
            const couponImage = req.file ? req.file.filename : null;
            console.log('received image of coupon :', couponImage);

            if (couponImage){
                const updatedCouponrData =  await Coupon.findOneAndUpdate(
                    {_id: couponId},
                    {$set: {
                        image: couponImage,
                        name : couponName,
                        code : couponCode,
                        criteriaAmount : criteriaAmount,
                        couponValue : couponValue,
                        activationDate : startDate,
                        expiryDate : expiryDate,
                        couponCount : couponCount,
                        isActive : isActive                    
                        }
                    }
                )
                console.log('coupon edited with new image.');

            } else {
                const updatedCouponrData =  await Coupon.findOneAndUpdate(
                    {_id: couponId},
                    {$set: {
                        name : couponName,
                        code : couponCode,
                        criteriaAmount : criteriaAmount,
                        couponValue : couponValue,
                        activationDate : startDate,
                        expiryDate : expiryDate,
                        couponCount : couponCount,
                        isActive : isActive                    
                        }
                    }
                )

                console.log('coupon edited without image.');
            }

            return res.json({updated: true});

        }


    } catch (error) {
        console.log('error in adding coupon : ', error);
        return res.json({failed: true});
    }
}





// manage offer (block and unblock) ----------------------------------
const manageCoupon = async (req, res)=>{
    try {
        const {couponId} = req.body;
        console.log('couponId received :', couponId);

        const couponData = await Coupon.findOne({_id: couponId});
        
        if(couponData.isActive == true){
            couponData.isActive = false;
            console.log('changed to false (inactive / blocked)');
        } else {
            couponData.isActive = true;
            console.log('changed to true (active / not blocked)');
        }

        couponData.save();
        return res.json({done : true})

    } catch (error) {
        console.log('error in managing coupon : ', error);
    }
}




// apply coupon discount --------------------------
const applyCoupon = async(req, res)=>{
    try {
        sessionId = req.session.userId;
        const {couponCode} = req.body;

        const userCart = await Cart.findOne({userRef: sessionId}).populate('product.productRef');

        let subTotal = 0;
        userCart.product.forEach((product) => {
            subTotal += (product.productRef.totalPrice * product.quantity);  // without discount
        });
        console.log('subTotal of cart (totalAmount) : ', subTotal);

        const couponData = await Coupon.findOne({code: couponCode});
        console.log('coupon data for applying coupon discount :', couponData);

        if (!couponData) {
            console.log(`coupon code ${couponCode} not found in database.`);
            return res.json({notfound: true, message: 'Invalid coupon code!'})
        } else {
            const currentDate = new Date();
            console.log('currentDate is :', currentDate);
    
            if (couponData.expiryDate < currentDate){
                console.log('coupon is expired. Expired on :', couponData.expiryDate);
                return res.json({expired: true, message: 'Coupon code you entered is expired.!'});
    
            } else if (!couponData.isActive){
                console.log('coupon is blocked');
                return res.json({inactive: true, message: 'The coupon code you entered is temporarily blocked.! Please try again later.'});
    
            } else if (couponData.criteriaAmount >= subTotal){
                console.log('not eligible: subtotal is not sufficient.');
                criteriaAmount = couponData.criteriaAmount;
    
                return res.json({notEligible: true, message: `This coupon is only applicable for the purchase worth ₹${criteriaAmount}`});
    
            } else {
                console.log('eligible for coupon.');
    
                const updatedUserCart = await Cart.findOneAndUpdate(
                    {userRef: sessionId},
                    {$set: {couponRef: couponData._id}},
                    {new: true}
                ).populate('couponRef');
    
                console.log('couponRef is added to userCart.');
    
                const couponDiscount = updatedUserCart.couponRef.couponValue;
                console.log('couponDiscount in the updatedUserCart :', couponDiscount);
    
                const cartId = userCart._id;  // for refreshing the summary area.
        
                return res.json({applied: true, couponDiscount, cartId});
            }
        }


    } catch (error) {
        console.log('error in apply coupon :', error);
    }
}




// cancel coupon discount --------------------------
const cancelCoupon = async(req, res)=>{
    try {
        sessionId = req.session.userId;

        const updatedUserCart = await Cart.findOneAndUpdate(
            {userRef: sessionId},
            {$unset: {couponRef: true}},
            {new: true}
        )

        console.log('couponRef removed from userCart.');
        const cartId = updatedUserCart._id; // for refreshing the summary area.

        return res.json({cancelled: true, cartId});


    } catch (error) {
        console.log('error in cancel coupon :', error);
    }
}





module.exports = {
    loadCouponList,
    addCoupon,
    editCoupon,
    manageCoupon,
    applyCoupon,
    cancelCoupon
}