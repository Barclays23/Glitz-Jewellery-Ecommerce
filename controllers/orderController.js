const User = require('../models/userModel');
const Order = require('../models/orderModel');

const GoldPrice = require('../models/goldPriceModel');






//load orders list ----------------------------------------
const loadOrderList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({});


        const searchQuery = req.query.search || '';
        console.log('searchQuery : ', searchQuery);

        const statusQuery = req.query['filter-status'] || 'all';
        console.log('statusQuery : ', statusQuery);

        const methodQuery = req.query['filter-method'] || 'all';
        console.log('methodQuery : ', methodQuery);

        const sortQuery = req.query.sort || 'none';
        console.log('sortQuery : ', sortQuery);



        let pageNo = parseInt(req.query.page) || 1;

        const limit = 4;
        
        let matchQuery = {};

        if (searchQuery) {
            matchQuery.$or = [
                { orderNo: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { 'userRef.email': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { 'userRef.mobile': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
            ];
        }

        // Log the query
        // console.log('matchQuery :', matchQuery);

        if (statusQuery != 'all') {
            matchQuery.paymentStatus = statusQuery;
        }

        if (methodQuery != 'all') {
            matchQuery.paymentMethod = methodQuery;
        }


        // sorting
        const sortOptions = {};
        if (sortQuery === 'orderNo-asc') {
            sortOptions.orderNo = 1;
        } else if (sortQuery === 'orderNo-desc') {
            sortOptions.orderNo = -1;
        } else {
            sortOptions.orderDate = -1; // Default sorting by order date descending
        }


        const ordersAggregate = Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userRef',
                    foreignField: '_id',
                    as: 'userRef'
                }
            },
            { $unwind: '$userRef' },
            { $match: matchQuery },
            { $sort: sortOptions },
            { $skip: (pageNo - 1) * limit },
            { $limit: limit }
        ]);

        // Fetch all matching orders
        const orderData = await ordersAggregate.exec();


        // Log the aggregated data
        // orderData.forEach((item) => {
        //     console.log('orderData[0].orderNo :', item.orderNo);
        //     console.log('orderData[0].userRef.email :', item.userRef.email);
        //     console.log('orderData[0].userRef.mobile :', item.userRef.mobile);
        // });


        const countAggregate = Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userRef',
                    foreignField: '_id',
                    as: 'userRef'
                }
            },
            { $unwind: '$userRef' },
            { $match: matchQuery },
            { $count: 'count' }
        ]);

        const countResult = await countAggregate.exec();
        const count = countResult.length > 0 ? countResult[0].count : 0;
        console.log('count of order result :', count);

        let totalPages = Math.ceil(count / limit);

        const startIndex = (pageNo - 1) * limit + 1;
        const endIndex = Math.min(pageNo * limit, count)

        res.render('orderList', {
            adminData,
            goldPriceData,
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            count,
            limit,
            totalPages,
            currentPage: pageNo,
            startIndex,
            endIndex,
        });

    } catch (error) {
        console.log('failed loading order list : ', error);
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

        if (newStatus === 'Delivered'){
            orderProduct.deliveryDate = Date.now();
        }

        orderProduct.orderStatus = newStatus;
        orderData.save();
        console.log('order status updated');

        return res.json({success: true});
        
    } catch (error) {
        console.log('error while updating the order status:', error);
        return res.json({error : true});
    }
}




// cancel order -------------------------------------------
const cancelOrder = async(req, res)=>{
    try {
        const {cancelOrderId, cancelProductRef, cancelReason} = req.body;
        console.log('received data for cancel order :', req.body);

        // changing the order status to "Cancelled"
        const canceledOrderData = await Order.findOneAndUpdate(
            { _id: cancelOrderId, 'orderedItems.productRef': cancelProductRef },
            { 
                $set: { 
                    'orderedItems.$.orderStatus': 'Cancelled',
                    'orderedItems.$.cancelReason': cancelReason 
                }
            },
            { new: true }
        );
        // console.log('canceledOrderData is : ', canceledOrderData);


        // transfer the money to user wallet if payment method is not COD
        if (canceledOrderData.paymentMethod != 'Cash On Delivery'){  //for testing, it's Online Payment
            let netAmount = canceledOrderData.netAmount;
            let discountAmount = canceledOrderData.discountAmount; // also add the coupon discount tp discountAmount
            let dicountPercentage = discountAmount / netAmount * 100;


            const canceledItem = canceledOrderData.orderedItems.find(item => item.productRef.toString() === cancelProductRef);
            console.log('cancelledItem :', canceledItem);

            const itemPrice = canceledItem.totalPrice;  // check whether the product have discountedPrice
            const itemQuantity = canceledItem.quantity;
            const itemTotalPrice = itemPrice * itemQuantity;

            const refundAmount = itemTotalPrice * dicountPercentage


            await User.findByIdAndUpdate(
                {_id: req.session.userId},
                {$inc: {walletBalance: refundAmount}},
                {$push: {walletHistory}}

            )
            // what for coupon and other payment methods ?
        }



        return res.json({success: true});


    } catch (error) {
        console.log('error while cancel the order :', error);
        return res.json({error: true});
    }
}







module.exports = {
    loadOrderList,
    loadOrderItems,
    updateOrderStatus,
    cancelOrder,
}