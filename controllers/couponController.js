const User = require('../models/userModel');
const Coupon = require('../models/couponModel');
const GoldPrice = require('../models/goldPriceModel');






// load coupon list -----------------------------------------
const loadCouponList = async(req, res)=>{
    try {
        const adminData = await User.findById(req.session.adminId);

        const goldPriceData = await GoldPrice.findOne({});

        const couponData = await Coupon.find({});


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

        existingCoupon = await Coupon.findOne({
            $or: [
              { name: couponName },
              { code: couponCode }
            ]
        });

        if(existingCoupon){
            console.log('coupon name / id already exist.');
            return res.json({exist: true, couponName, couponCode});

        } else {
            const newCoupon = new Coupon(
                {
                    name : couponName,
                    code : couponCode,
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

            return res.json({created: true, couponName, couponCode});
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

        const existingCoupon = await Coupon.findOne({name: couponName, code: couponCode, _id: {$ne: couponId}});

        if (existingCoupon){
            console.log('coupon name / code already existing');
            return res.json({exist: true, couponName, couponCode});
        } else{
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

            console.log('coupon edited.');
            return res.json({updated: true});

        }


    } catch (error) {
        console.log('error in adding coupon : ', error);
        return res.json({failed: true});
    }
}





// manage offer ----------------------------------
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









module.exports = {
    loadCouponList,
    addCoupon,
    editCoupon,
    manageCoupon,
}