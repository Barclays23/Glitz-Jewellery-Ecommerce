const Category = require ('../models/categoryModel');
const Product = require ('../models/productModel');
const User = require('../models/userModel');



//load product page ----------------------------------------
const loadProductList = async(req, res)=>{
    try {
        const adminData = await ({_id: req.session.adminId});

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
            productData,
            categoryData,
            adminData,
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
        const { productCategory, productCode, productName, productDescription, productPrice, productQty, productStatus} = req.body;
        
        console.log('add product body received in backend are : ');

        console.log("productCategory : ", productCategory);
        console.log("productCode : ", productCode);
        console.log("productName : ", productName);
        console.log("productDescription : ", productDescription);
        console.log("productPrice : ", productPrice);
        console.log("productQty : ", productQty);
        console.log("productStatus : ", productStatus);
        
        const existProduct = await Product.findOne({code: productCode});

        if (existProduct) {
            res.json({exists: true, message: "Product code already exists. Please provide another code."});
        } else {

            const isBlocked = productStatus === 'Unlist';
            console.log('added product isBlocked : ', isBlocked);

            const categoryData = await Category.findOne({name: productCategory});
            console.log('found category data from ProductCategory', categoryData);

            const product = new Product({
                categoryRef : categoryData._id,
                code : productCode,
                name : productName,
                description : productDescription,
                price : productPrice,
                quantity : productQty,
                isBlocked : isBlocked
            });

            const productData = await product.save();

            if (productData){
                res.json({success: true});
            } else{
                res.status(400).json({failed: true, message: "Could not save add/new product."});
            }
        }

    } catch (error) {
        console.log('failed to add new product', error);
    }
}




// edit / update product -----------------------------------
const updateProduct = async (req, res)=>{
    try {
        console.log('updated data received from edit product form : ' , req.body);
        const {productId, productCategory, productCode, productName, productDescription, productPrice, productQty, productStatus} = req.body;

        const existProduct = await Product.findOne({ _id: { $ne: productId }, code: productCode });

        if (existProduct) {
            console.log('product code already existing : ', productCode);
            return res.json({exists: true, message: "Product code already exists."});
        } else {
            const isBlocked = productStatus === 'unlist';
            console.log('isblocked status in updateProduct :', isBlocked);
            const categoryData = await Category.findOne({name: productCategory});

            const updatedProductData = await Product.findOneAndUpdate({_id: productId}, {
                categoryRef : categoryData._id,
                code : productCode,
                name : productName,
                description : productDescription,
                price : productPrice,
                quantity : productQty,
                isBlocked : isBlocked
            });

            if(updatedProductData){
                console.log('product details updated');
                return res.status(200).json({success: true});
            }
        }

    } catch (error) {
        console.log('failed to update product :', error.message);
    }
}



module.exports = {
    loadProductList,
    addProduct,
    updateProduct
}