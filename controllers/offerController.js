const User = require('../models/userModel');
const Offer = require('../models/offerModel');
const GoldPrice = require('../models/goldPriceModel');





// load offer list ----------------------------------
const loadOfferList = async (req, res)=>{
    try {
        const adminData = await User.findById(req.session.adminId);

        const goldPriceData = await GoldPrice.findOne({});

        const offerData = await Offer.find({}).sort({ activationDate: -1 });

        res.render('offerList', {adminData, goldPriceData, offerData});

    } catch (error) {
        console.log('error while loading the offer list :', error);
    }
}




// add new offer ----------------------------------
const addOffer = async (req, res)=>{
    try {
        const {
            offerName,
            offerPercentage,
            startDate,
            expiryDate,
            isListed,
        } = req.body;

        console.log('data recieved for adding offer :', req.body);

        const existOffer = await Offer.findOne({offerName: offerName});

        if (existOffer){
            console.log('offer name already existing');
            return res.json({exist: true, offerName});
        } else{
            newOffer = new Offer({
                offerName : offerName,
                offerPercentage : offerPercentage,
                activationDate : startDate,
                expiryDate : expiryDate,
                isListed : isListed
            });

            const offerData = await newOffer.save();
            console.log('new offer created :', offerData);

            return res.json({added: true});

        }
        


    } catch (error) {
        console.log('error in adding offer : ', error);
        return res.json({failed: true});
    }
}




// add new offer ----------------------------------
const editOffer = async (req, res)=>{
    try {
        const {
            offerId,
            offerName,
            offerPercentage,
            startDate,
            expiryDate,
            isListed,
        } = req.body;

        console.log('data recieved for editing offer :', req.body);

        const existOffer = await Offer.findOne({offerName: offerName, _id: {$ne: offerId}});

        if (existOffer){
            console.log('offer name already existing');
            return res.json({exist: true, offerName});
        } else{
           const updatedOfferData =  await Offer.findOneAndUpdate(
                {_id: offerId},
                {$set: {
                    offerName : offerName,
                    offerPercentage : offerPercentage,
                    activationDate : startDate,
                    expiryDate : expiryDate,
                    isListed : isListed
                    }
                }
            )

            console.log('offer edited :', updatedOfferData);
            return res.json({updated: true});

        }
        


    } catch (error) {
        console.log('error in adding offer : ', error);
        return res.json({failed: true});
    }
}




// manage offer ----------------------------------
const manageOffer = async (req, res)=>{
    try {
        const {offerId} = req.body;
        console.log('offerId received :', offerId);

        const offerData = await Offer.findOne({_id: offerId});
        
        if(offerData.isListed == true){
            offerData.isListed = false;
            console.log('changed to false (blocked)');
        } else {
            offerData.isListed = true;
            console.log('changed to true (unblocked)');
        }

        offerData.save();
        return res.json({done: true})


    } catch (error) {
        console.log('error in managing offer : ', error);
        return res.json({failed: true});
    }
}









module.exports = {
    loadOfferList,
    addOffer,
    editOffer,
    manageOffer,
}
