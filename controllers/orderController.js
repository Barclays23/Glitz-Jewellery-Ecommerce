const User = require('../models/userModel');
// const Address = require('../models/addressModel');
// const Cart = require('../models/cartModel');
// const Wishlist = require('../models/wishlistModel');
const Order = require('../models/orderModel');

const GoldPrice = require('../models/goldPriceModel');






//load orders list ----------------------------------------
const loadOrderList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({});


        let search = '';
        if(req.query.search){
            search = req.query.search;
        }

        let pageNo = parseInt(req.query.page) || 1;
        if(req.query.page){
            pageNo = req.query.page;
        }

        const limit = 3;

        const orderQuery = {
            _id: {$exists: true},
            $or: [
                // { '_id': search }, // Directly search by _id if expecting a specific ObjectId
                { 'shippingAddress.contact': { $regex: '.*' + search + '.*', $options: 'i' } } // Search by contact number
            ]
        };


        const orderData = await Order.find(orderQuery)
        // .populate('productRef')
        .sort({ orderDate: -1 }) // Sort by orderDate in descending order
        .skip((pageNo - 1) * limit)
        .limit(limit)
        .exec();

        const count = await Order.countDocuments(orderQuery);

        let totalPages = Math.ceil(count / limit);

        res.render('orderList', {
            adminData,
            goldPriceData,
            orderData,
            // categoryData,
            search,
            count,
            limit,
            totalPages,
            currentPage: pageNo,
        });

    } catch (error) {
        console.log('failed loading product page: ', error);
    }
}




// load order items of an order ------------------------------
const loadOrderItems = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({});
        const orderId = req.query.id;

        const orderData = await Order.findOne({_id: orderId}).populate('userRef');

        res.render('orderItems', {adminData, goldPriceData, orderData});

    } catch (error) {
        console.log('error in loading ordered items :', error.message);
        return res.json({error: true});
    }
}



// update order status -------------------------------------
const updateOrderStatus = async(req, res)=>{
    try {

        const {userId, orderId, itemId, newStatus} = req.body;
        console.log('details received for edit order status :', req.body);

        const orderData = await Order.findOne({_id: orderId});

        const orderProduct = orderData.orderedItems.find(item => item._id.toString() === itemId);

        orderProduct.orderStatus = newStatus;
        orderData.save();
        console.log('order status updated');

        return res.json({success: true});
        
    } catch (error) {
        console.log('error while updating the order status:', error);
        return res.json({error : true});
    }
}




module.exports = {
    loadOrderList,
    loadOrderItems,
    updateOrderStatus
}