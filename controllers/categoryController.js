const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');
const Category = require ('../models/categoryModel');
const Offer = require ('../models/offerModel');
const Product = require ('../models/productModel');




// load category page ------------------------------------------
const loadCategoryList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});

        const categoryData = await Category.find({});
        // console.log('category data is : ', categoryData);

        const currentDate = new Date();
        const offerData = await Offer.find(
            {
                isListed: true, 
                activationDate: {$lte: currentDate},  // activation date is on running
                expiryDate: {$gte: currentDate}  // not expired
            }
        );
        console.log('Number of active running offers :', offerData.length);

        res.render('categoryList', {adminData, categoryData, offerData, goldPriceData});

    } catch (error) {
        console.log('failed to load category page', error.message);
    }
}



// add new category ---------------------------------------------------
const addCategory = async(req, res)=>{
    try {
        const {categoryName, categoryDescription, categoryStatus} = req.body

        const existCategory = await Category.findOne({name: categoryName});

        if (existCategory) {
            console.log('exist category :', existCategory.name);
            res.json({exists: true, message: "This category already exists. Please create a different one."});
        } else {
            const isListed = categoryStatus === "list";

            const category = new Category({
                name : categoryName,
                description : categoryDescription,
                isListed : isListed
            });

            const categoryData = await category.save();

            if (categoryData){
                console.log('category created');
                res.json({success: true});
            } else{
                res.status(400).json({failed: true, message: "Failed to create new category."});
            }
        }

    } catch (error) {
        console.log('adding category failed : ', error.message);
    }
}





// edit category ---------------------------------------------------
const updateCategory = async(req, res)=>{
    try {
        const {categoryId, categoryName, categoryDescription, categoryStatus} = req.body;
        console.log('body received to edit category :', req.body);

        const existCategory = await Category.findOne({ _id: { $ne: categoryId }, name: categoryName });

        if (existCategory) {
            console.log('category name is already existing.');
            return res.json({exists: true, message: "Category name already exists. Choose a another name."})

        } else {
            console.log('category name is not already existing.');
            const isListed = categoryStatus === "list";
            console.log('isListed is :', isListed);

            const updatedCategoryData = await Category.findOneAndUpdate({_id: categoryId}, {name: categoryName, description: categoryDescription, isListed: isListed}, { new: true });
            console.log('updated category details :', updatedCategoryData);


            // also blocking all products in that category.
            if (updatedCategoryData.isListed === true) {
                const unblockedProductStatus = await Product.updateMany({categoryRef: categoryId}, {isBlocked: false});
                console.log('unblockedProductStatus', unblockedProductStatus);

                const productData = await Product.find({categoryRef: categoryId});
                console.log('product[2] isBlocked status after edit category : ', productData[2].isBlocked);

            } else {
                const blockedProductStatus = await Product.updateMany({categoryRef: categoryId}, {isBlocked: true});
                console.log('blockedProductStatus', blockedProductStatus);

            }
    
            return res.status(200).json({success: true});
        }
        

    } catch (error) {
        console.log('error in editing category :', error.message);
    }
}



module.exports = {
    loadCategoryList,
    addCategory,
    updateCategory
}
