const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');
const Category = require ('../models/categoryModel');
const Product = require ('../models/productModel');
const Offer = require ('../models/offerModel');




//load products list for admin ----------------------------------------
const loadProductList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({_id: {$exists: true}});

        const searchQuery = req.query.search || '';
        console.log('searchQuery : ', searchQuery);

        const categoryQuery = req.query['filter-category'] || 'all';
        console.log('categoryQuery : ', categoryQuery);
        
        const purityQuery = req.query['filter-purity'] || 'all';
        console.log('purityQuery : ', purityQuery);
        
        const statusQuery = req.query['filter-status'] || 'all';
        console.log('statusQuery : ', statusQuery);

        const sortQuery = req.query.sort || 'none';
        console.log('sortQuery : ', sortQuery);


        let pageNo = parseInt(req.query.page) || 1;

        const limit = 5;

        let productQuery = {};

        // searching
        if(searchQuery){
            productQuery.$or = [
                {name: {$regex: '.*' + searchQuery + '.*', $options: 'i'}},
                {code: {$regex: '.*' + searchQuery + '.*', $options: 'i'}},
            ];
        }



        // filtering category
        if (categoryQuery !== 'all') {
            const category = await Category.findOne({ name: categoryQuery });
            if (category) {
                productQuery.categoryRef = category._id;
            }
        }

        // filtering purity
        if (purityQuery !== 'all') {
            productQuery.purity = purityQuery === '22k' ? '22K (916)' : '18K (750)';
        }

        // filtering status
        if (statusQuery !== 'all') {
            productQuery.isBlocked = statusQuery === 'unlisted';
        }


        // SORTING QUERY OPTIONS
        const sortOptions = {};
        if (sortQuery === 'gross-wt-asc') {
            sortOptions.grossWeight = 1;
        } else if (sortQuery === 'gross-wt-desc') {
            sortOptions.grossWeight = -1;
        } else if (sortQuery === 'net-wt-asc') {
            sortOptions.netWeight = 1;
        } else if (sortQuery === 'net-wt-desc') {
            sortOptions.netWeight = -1;
        } else if (sortQuery === 'stone-wt-asc') {
            sortOptions.stoneWeight = 1;
        } else if (sortQuery === 'stone-wt-desc') {
            sortOptions.stoneWeight = -1;
        } else if (sortQuery === 'va-asc') {
            sortOptions.VA = 1;
        } else if (sortQuery === 'va-desc') {
            sortOptions.VA = -1;
        } else if (sortQuery === 'metal-price-asc') {
            sortOptions.metalPrice = 1;
        } else if (sortQuery === 'metal-price-desc') {
            sortOptions.metalPrice = -1;
        } else if (sortQuery === 'making-charge-asc') {
            sortOptions.makingCharge = 1;
        } else if (sortQuery === 'making-charge-desc') {
            sortOptions.makingCharge = -1;
        } else if (sortQuery === 'stone-charge-asc') {
            sortOptions.stoneCharge = 1;
        } else if (sortQuery === 'stone-charge-desc') {
            sortOptions.stoneCharge = -1;
        } else if (sortQuery === 'total-price-asc') { //
            sortOptions.totalPrice = 1;
        } else if (sortQuery === 'total-price-desc') {
            sortOptions.totalPrice = -1;
        } else if (sortQuery === 'quantity-asc') {
            sortOptions.quantity = 1;
        } else if (sortQuery === 'quantity-desc') {
            sortOptions.quantity = -1;
        } else {
            sortOptions._id = -1; // Default sorting: by _id of products in descending (latest products first).
        }

        console.log('sortOptions query :', sortOptions);


        const productData = await Product.find(productQuery)
        .populate('categoryRef')
        .skip((pageNo - 1) * limit)
        .limit(limit)
        .sort(sortOptions)
        .exec();

        const count = await Product.countDocuments(productQuery);
        console.log('product result count :', count);

        let totalPages = Math.ceil(count / limit);

        const startIndex = (pageNo - 1) * limit + 1;
        const endIndex = Math.min(pageNo * limit, count)

        const categoryData = await Category.find({});

        const currentDate = new Date();
        const offerData = await Offer.find(
            {
                isListed: true, 
                activationDate: {$lte: currentDate},  // activation date is on running
                expiryDate: {$gte: currentDate}  // not expired
            }
        );
        console.log('Number of active running offers :', offerData.length);

        res.render('productList', {
            adminData,
            goldPriceData,
            offerData,
            productData,
            categoryData,
            searchQuery,
            categoryQuery,
            purityQuery,
            statusQuery,
            sortQuery,
            count,
            limit,
            totalPages,
            startIndex,
            endIndex,
            currentPage: pageNo,
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
            productGrossWt,
            productStoneWt,
            productNetWt,
            productMc,
            productSc,
            productPurity,
            productQty,
            productStatus
        } = req.body;

        console.log('add product body received in backend are : ', req.body);
        console.log('type of productSc : ', typeof(productSc));

        const files = await req.files;
        // console.log('files received in backend are : ', files);
        

        // genarate a product code for products
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


        // also calculating & updating product's price details.
        const goldPriceData = await GoldPrice.findOne({});
        console.log('goldPriceData : ', goldPriceData);
        const metalPrice = productNetWt * goldPriceData.price;
        console.log('metalPrice : ', metalPrice);
        const makingCharge = (metalPrice * productMc) /100;
        console.log('makingCharge : ', makingCharge);
        const stoneCharge = parseFloat(productSc);  // productSc is getting as String, so converted to Number.
        console.log('stoneCharge : ', stoneCharge);
        console.log('type of stoneCharge : ', typeof(stoneCharge));
        const GST = (metalPrice + makingCharge + stoneCharge) * 3/100;
        console.log('GST : ', GST);
        const totalPrice = metalPrice + makingCharge + stoneCharge + GST;
        console.log('totalPrice : ', totalPrice);


        const product = new Product({
            images: {
                image1: files[0].filename,
                image2: files[1].filename,
                image3: files[2].filename,
                image4: files[3].filename,
            },
            categoryRef : categoryData._id,
            code : randomProductCode,
            name : productName,
            description : productDescription,
            grossWeight : productGrossWt,
            stoneWeight : productStoneWt,
            netWeight : productNetWt,
            VA : productMc,
            stoneCharge : productSc,
            purity : productPurity,
            quantity : productQty,
            //updating price details
            metalPrice : metalPrice,
            makingCharge : makingCharge,
            GST : GST,
            totalPrice : totalPrice,
            isBlocked : isBlocked
        });


        const productData = await product.save();

        if (productData){
            res.json({success: true});
        } else{
            res.status(400).json({failed: true, message: "Could not save add/new product."});
        }

    } catch (error) {
        console.log('failed to add new product', error);
    }
}




// edit / update product -----------------------------------
const updateProduct = async (req, res)=>{
    try {
        const {
            productId,
            productCategory,
            productName,
            productDescription,
            productCode,
            productGrossWt,
            productStoneWt,
            productNetWt,
            productMc,
            productSc,
            productPurity,
            productQty,
            productStatus
        } = req.body;

        const files = await req.files;
        
        console.log('edit product body received in edit backend are : ', req.body);
        console.log('files received in edit backend are : ', req.files);

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


            // calculating & updating product's price details.
            const goldPriceData = await GoldPrice.findOne({});
            console.log('goldPriceData : ', goldPriceData);
            const metalPrice = productNetWt * goldPriceData.price;
            console.log('metalPrice : ', metalPrice);
            const makingCharge = (metalPrice * productMc) /100;
            console.log('makingCharge : ', makingCharge);
            const stoneCharge = parseFloat(productSc);  // productSc is getting as String, so converted to Number.
            console.log('stoneCharge : ', stoneCharge);
            console.log('type of stoneCharge : ', typeof(stoneCharge));
            const GST = (metalPrice + makingCharge + stoneCharge) * 3/100;
            console.log('GST : ', GST);
            const totalPrice = metalPrice + makingCharge + stoneCharge + GST;
            console.log('totalPrice : ', totalPrice);


            const existingProduct = await Product.findById(productId); //for existing product images

            const updatedProductData = await Product.findOneAndUpdate({_id: productId}, {
                images : {
                    image1: req.files[0] ? req.files[0].filename : existingProduct.images.image1,
                    image2: req.files[1] ? req.files[1].filename : existingProduct.images.image2,
                    image3: req.files[2] ? req.files[2].filename : existingProduct.images.image3,
                    image4: req.files[3] ? req.files[3].filename : existingProduct.images.image4,
                },
                categoryRef : categoryData._id,
                code : randomProductCode,
                name : productName,
                description : productDescription,
                grossWeight : productGrossWt,
                stoneWeight : productStoneWt,
                netWeight : productNetWt,
                VA : productMc,
                stoneCharge : productSc,
                purity : productPurity,
                quantity : productQty,
                //updating price details
                metalPrice : metalPrice,
                makingCharge : makingCharge,
                GST : GST,
                totalPrice : totalPrice,
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