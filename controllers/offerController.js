const User = require('../models/userModel');
const Offer = require('../models/offerModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const GoldPrice = require('../models/goldPriceModel');





// load offer list ----------------------------------
const loadOfferList = async (req, res)=>{
    try {
        const adminData = await User.findById(req.session.adminId);

        const goldPriceData = await GoldPrice.findOne({});

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const skip = (page - 1) * limit;

        let searchQuery = '';
        if (req.query.search){
            searchQuery = req.query.search;
        }

        let matchQuery = {};

        if (searchQuery){
            matchQuery.$or = [
                {offerName: {$regex:'.*'+ searchQuery +'.*', $options: 'i'}},
            ];
        }

        const offerData = await Offer.find(matchQuery)
        .sort({ activationDate: -1 })
        .skip(skip)
        .limit(limit);

        const totalOffers = await Offer.find(matchQuery).countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);

        res.render('offerList', {adminData, 
            goldPriceData, 
            offerData,
            totalOffers, 
            limit, 
            totalPages, 
            currentPage: page,
            searchQuery,
        });

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




// apply offer ----------------------------------
const applyOffer = async (req, res)=>{
    try {
        const {offerId, productId, categoryId} = req.body;
        console.log('data received for apply offer :', req.body);
        
        // for applying offer for product (single)
        if(productId){
            const updatedProductOffer = await Product.findOneAndUpdate(
                {_id: productId},
                {offerRef: offerId},
                {new: true}
            );

            console.log('applied offer to product :', updatedProductOffer.code);

            
        // for applying offer for category (multiple products)
        } else if (categoryId){
            // saving the offerId in product database
            const updatedOfferCategoryProducts = await Product.updateMany(
                {categoryRef: categoryId},
                {offerRef: offerId},
                {new: true}
            );

            // also saving the offerId in category database
            const updatedOfferCategory = await Category.findOneAndUpdate(
                {_id: categoryId},
                {offerRef: offerId},
                {new: true}
            );
            
            console.log('applied offer to category :', updatedOfferCategoryProducts.length);
        }

        return res.json({applied: true});


    } catch (error) {
        console.log('error in applying offer : ', error);
        return res.json({failed: true});
    }
}





// cancel offer ----------------------------------
const cancelOffer = async (req, res)=>{
    try {
        const {offerId, productId, categoryId} = req.body;
        console.log('data received for cancel offer :', req.body);
        
        // for cancelling offer for product (single)
        if(productId){
            const cancelledProductOffer = await Product.findOneAndUpdate(
                {_id: productId},
                {offerRef: null},
                {new: true}
            );

            console.log('cancelled offer from product :', cancelledProductOffer.code);


        // for cancelling offer for category (multiple products)
        } else if (categoryId){
            // cancelling the offerId from category database
            const cancelledOfferCategory = await Category.findOneAndUpdate(
                {_id: categoryId},
                {offerRef: null},
                {new: true}
            );

            // also cancelling the offerId from product database
            const cancelledOfferCategoryProducts = await Product.updateMany(
                {categoryRef: categoryId},
                {offerRef: null},
                {new: true}
            );
            
            console.log('cancelled offer from category :', cancelledOfferCategoryProducts.length);
        }

        return res.json({offerCancelled: true});


    } catch (error) {
        console.log('error in cancelling offer : ', error);
        return res.json({failed: true, message: error.message});
    }
}








module.exports = {
    loadOfferList,
    addOffer,
    editOffer,
    manageOffer,
    applyOffer,
    cancelOffer
}
