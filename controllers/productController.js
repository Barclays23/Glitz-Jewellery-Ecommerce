const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');
const Category = require ('../models/categoryModel');
const Product = require ('../models/productModel');




//load product page ----------------------------------------
const loadProductList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});


        let search = '';
        if(req.query.search){
            search = req.query.search;
        }

        let pageNo = 1;
        if(req.query.page){
            pageNo = req.query.page;
        }

        const limit = 5;

        let productData = await Product.find({
            _id: {$exists: true},
            $or: [
                {name: {$regex:'.*'+search+'.*', $options: 'i'}},
                {category: {$regex:'.*'+search+'.*', $options: 'i'}},
                {code: {$regex:'.*'+search+'.*', $options: 'i'}},
                // {price: {$regex:'.*'+search+'.*', $options: 'i'}},
            ],
        }).populate('categoryRef')
        .skip((pageNo -1) * limit)
        .limit(limit *1)
        .exec()


        let count = await Product.find({
            _id: {$exists: true},
            $or: [
                {name: {$regex:'.*'+search+'.*', $options: 'i'}},
                {category: {$regex:'.*'+search+'.*', $options: 'i'}},
                {code: {$regex:'.*'+search+'.*', $options: 'i'}},
                // {price: {$regex:'.*'+search+'.*', $options: 'i'}},
            ]
        })
        .countDocuments();

        let totalPages = Math.ceil(count / limit);

        const categoryData = await Category.find({});

        res.render('productList', {
            adminData,
            goldPriceData,
            productData,
            categoryData,
            totalPages,
            currentPage: pageNo
        });

    } catch (error) {
        console.log('failed loading product page: ', error);
    }
}




// add new product -----------------------------------------
const addProduct = async(req, res)=>{
    try {
        const {
            productCategory,
            productName,
            productDescription,
            // productCode,
            // productPrice,
            productWeight,
            productMc,
            productQty,
            productStatus
        } = req.body;
        
        console.log('add product body received in backend are : ', req.body);
        
        // const existProduct = await Product.findOne({code: productCode});

        // if (existProduct) {
        //     res.json({exists: true, message: "Product code already exists."});
        // } else {
            function generateProductCode() {
                let categoryPrefix = productCategory.substring(0, 2).toUpperCase();
                if (categoryPrefix === 'FI'){
                    categoryPrefix = 'FR'
                } else if (categoryPrefix === 'PE'){
                    categoryPrefix = 'PT'
                } else if (categoryPrefix === 'EA'){
                    categoryPrefix = 'ER'
                }

                const currentDate = new Date();
                const year = currentDate.getFullYear().toString();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 as months are zero-indexed
                const day = currentDate.getDate().toString().padStart(2, '0');
                const hour = currentDate.getHours().toString().padStart(2, '0');
                const minute = currentDate.getMinutes().toString().padStart(2, '0');
            
                const randomCode = categoryPrefix + year + month + day + hour + minute;
                return randomCode;
            }

            const randomProductCode = generateProductCode();
            console.log('randomCode is :', randomProductCode);

            const isBlocked = productStatus === 'Unlist';
            console.log('added product isBlocked : ', isBlocked);

            const categoryData = await Category.findOne({name: productCategory});
            console.log('found category data from ProductCategory', categoryData);

            // const GST = 0.03;

            const product = new Product({
                categoryRef : categoryData._id,
                name : productName,
                description : productDescription,
                weight : productWeight,
                VA : productMc,
                code : randomProductCode,
                // GST : GST,
                // price : productPrice,
                quantity : productQty,
                isBlocked : isBlocked
            });

            const productData = await product.save();

            if (productData){
                res.json({success: true});
            } else{
                res.status(400).json({failed: true, message: "Could not save add/new product."});
            }
        // }

    } catch (error) {
        console.log('failed to add new product', error);
    }
}




// edit / update product -----------------------------------
const updateProduct = async (req, res)=>{
    try {
        console.log('updated data received from edit product form : ' , req.body);
        const {
            productId,
            productCategory,
            productName,
            productDescription,
            productWeight,
            productMc,
            // productPrice,
            productCode,
            productQty,
            productStatus
        } = req.body;

        // const existProduct = await Product.findOne({ _id: { $ne: productId }, code: productCode });

        // if (existProduct) {
        //     // console.log('product code already existing : ', productCode);
        //     return res.json({exists: true, message: "Product code already exists."});
        // } else {

            function generateProductCode() {
                let categoryPrefix = productCategory.substring(0, 2).toUpperCase();
                if (categoryPrefix === 'FI'){
                    categoryPrefix = 'FR'
                } else if (categoryPrefix === 'PE'){
                    categoryPrefix = 'PT'
                } else if (categoryPrefix === 'EA'){
                    categoryPrefix = 'ER'
                }


                const existingCode = productCode.substring(2); // Remove the first two characters of the existing product code
                const randomCode = categoryPrefix + existingCode;
                return randomCode;
            }

            const randomProductCode = generateProductCode();
            console.log('new randomCode is :', randomProductCode);

            const isBlocked = productStatus === 'unlist';
            console.log('isblocked status in updateProduct :', isBlocked);
            const categoryData = await Category.findOne({name: productCategory});

            const updatedProductData = await Product.findOneAndUpdate({_id: productId}, {
                categoryRef : categoryData._id,
                name : productName,
                description : productDescription,
                weight : productWeight,
                VA : productMc,
                code : randomProductCode,
                // price : productPrice,
                quantity : productQty,
                isBlocked : isBlocked
            });

            if(updatedProductData){
                console.log('product details updated');
                return res.status(200).json({success: true});
            }
        // }

    } catch (error) {
        console.log('failed to update product :', error.message);
    }
}




// manage product (block / unblock) -----------------------------------
const manageProduct = async (req, res)=>{
    try {
        const ProductId = req.body.id;
        const productData = await Product.findOne({_id: ProductId});
        const categoryData = await Category.findOne({_id: productData.categoryRef});
        console.log('categorydata in manageProduct: ', categoryData);
        
        if (categoryData.isListed === true){
            if (productData.isBlocked === true) {
                const updatedProductData = await Product.updateOne({_id: ProductId}, {isBlocked: false});
                return res.json({success: true});
            } else {
                const updatedProductData = await Product.updateOne({_id: ProductId}, {isBlocked: true});
                return res.json({success: true});
            }
        } else {
            if (productData.isBlocked === true) {
                return res.json({categoryBlocked: true, message: "Cannot list this item. Product category is blocked!"});
            } else {
                const updatedProductData = await Product.updateOne({_id: ProductId}, {isBlocked: true});
                return res.json({success: true});
            }
        }

    } catch (error) {
        console.log('failed to manage the product : ', error.message);
    }
}




module.exports = {
    loadProductList,
    addProduct,
    updateProduct,
    manageProduct
}