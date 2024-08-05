const User = require ('../models/userModel');
const Product = require ('../models/productModel');
const GoldPrice = require ('../models/goldPriceModel');
const Wishlist = require ('../models/wishlistModel');
const Cart = require ('../models/cartModel');








// load user-wishlist page -------------------------------------
const loadUserWishlist = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findById(sessionId);

        const goldPriceData = await GoldPrice.findOne({});
        const userCart = await Cart.findOne({userRef: sessionId});
        const userWishlist = await Wishlist.findOne({ userRef: sessionId}).populate('product.productRef');

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
        
        res.render('userWishlist', { userData, cartCount, wishlistCount, userWishlist, goldPriceData });

    } catch (error) {
        console.log('error in loading wishlist', error.message);
    }
}




// add product to the wishlist ---------------------------------
const addToWishlist = async(req, res)=>{
    try {
        const productId = req.body.productId;
        console.log('product id received for wishlist : ', productId);

        const userId = req.session.userId;

        const userWishlist = await Wishlist.findOne({userRef: userId});

        if (!userId){
            return res.status(401).json({ nosession: true });

        } else {

            if (!userWishlist){
                console.log('no wishlist for this user.');

                // create new and add product to wishlist
                const userWishlist = new Wishlist({
                    userRef : userId,
                    product : [{
                        productRef : productId,
                    }]
                });

                await userWishlist.save();

                return res.status(200).json({added : true});

            } else {
                const existingProduct = userWishlist.product.find(p => p.productRef.toString() === productId);

                if(existingProduct){                   
                    // remove product from wishlist
                    userWishlist.product.pull({ productRef : productId });
                    await userWishlist.save();

                    return res.status(200).json({removed : true});

                } else {
                    // add product to wishlist
                    userWishlist.product.push({ productRef: productId });
                    await userWishlist.save();

                    return res.status(200).json({added : true});
                }
    
            }
        }

    } catch (error) {
        console.log('error while adding / removing to wishlist', error.message);
    }
}




// save for later ---------------------------------------------
const saveForLater = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const {productId, outOfStockItems} = req.body;

        console.log('received single product id for saveForLater : ', productId);

        const userCart = await Cart.findOne({ userRef: sessionId });


        // for moving the selected product from cart / checkout (single)
        if (productId){    
            // finding the single product with productId
            const singleProduct = userCart.product.find(p => p._id.toString() === productId.toString());
            console.log('single product is : ', singleProduct);

            //get the productRefId of single product.
            const productRefId = singleProduct.productRef;
            console.log('ProductRef._id of single product is : ', productRefId);

            const userWishlist = await Wishlist.findOne({userRef: sessionId});

            if (!userWishlist) {
                const userWishlist = new Wishlist({
                    userRef : sessionId,
                    product : [{
                        productRef : productRefId,
                    }]
                });
                await userWishlist.save();
                console.log('created new wishlist and added in it.');
                
            } else {
                // checking the item is already in wishlist
                const existingProduct = userWishlist.product.find(p => p.productRef.toString() === productRefId.toString());

                if (existingProduct) {
                    console.log('item is already in user wishlist. so dont need to move.');
                } else {
                    userWishlist.product.push({productRef: productRefId});
                    await userWishlist.save();
                    console.log('item saved to userWishlist');
                }

            }

            userCart.product.pull({productRef: productRefId});
            await userCart.save();
            console.log('And product removed from cart.');

            const updatedUserCart = await Cart.findOne({userRef: sessionId});
            console.log('Updated user cart product length :', updatedUserCart.product.length);


            // also remove the couponRef from the cart if cart become empty.
            if (updatedUserCart.product.length === 0 && updatedUserCart.couponRef){
                const removedCouponRef = await Cart.findOneAndUpdate(
                    {userRef: sessionId},
                    {$unset: {couponRef: 1}},
                    {new : true}
                );

                console.log('also removedCouponRef from cart : ', removedCouponRef);  // delete variable removedCouponRef
            }

            return res.status(200).json({ moved: true, cartId: userCart._id});

        }




        // for shifting the out of stock items from cart / checkout (may be multiple items)
        if (outOfStockItems && outOfStockItems.length > 0){

            for (const products of outOfStockItems) {
                let outOfStockProductRef = products.productRef;
                
                console.log('productRefIds of shifting (outOfStockItems) :', outOfStockProductRef._id);

                const userWishlist = await Wishlist.findOne({userRef: sessionId});

                if (!userWishlist){
                    console.log('userkk wishlist illaaa.');
                    const userWishlist = new Wishlist ({
                        userRef : sessionId,
                        product : [{
                            productRef : outOfStockProductRef
                        }]
                    })
                    await userWishlist.save();
                    console.log('created new userWishlist updated');

                } else{
                    console.log('userkk wishlist und.');
                    
                    const existingProduct = userWishlist.product.find(p => {
                        console.log('wishlist productRef.toString() :', p.productRef.toString());
                        console.log('outOfStockProductRef Id .toString() :', outOfStockProductRef._id.toString());
                        return p.productRef.toString() === outOfStockProductRef._id.toString();
                    });
                    

                    if(existingProduct){
                        console.log('this outofstock item is already in user wishlist. so dont need to move.');
                    } else{
                        userWishlist.product.push({productRef: outOfStockProductRef});
                        await userWishlist.save();
                        console.log('updated userWishlist');
                    }
                }

                userCart.product.pull({productRef: outOfStockProductRef});
                await userCart.save();
                console.log('removed item and updated UserCart');
            }


            return res.status(200).json({ movedOutOfStocks: true, cartId: userCart._id });
            
        }

        
    } catch (error) {
        console.log('error while doing save for later :', error.message);
    }
}








module.exports = {
    loadUserWishlist,
    addToWishlist,
    saveForLater
}