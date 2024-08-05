const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

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
        const cancelledOrderData = await Order.findOneAndUpdate(
            { _id: cancelOrderId, 'orderedItems.productRef': cancelProductRef },
            { 
                $set: { 
                    'orderedItems.$.orderStatus': 'Cancelled',
                    'orderedItems.$.cancelReason': cancelReason,
                    'orderedItems.$.cancelDate': new Date(),
                }
            },
            { new: true }
        );

        console.log('order is cancelled. cancelledOrderData.orderNo :', cancelledOrderData.orderNo);


        let subTotal = cancelledOrderData.subTotal; // total cart amount without any discounts.
        let specialDiscount = cancelledOrderData.specialDiscount ? cancelledOrderData.specialDiscount : 0 ;  // old discount structure.
        let couponDiscount = cancelledOrderData.couponDiscount ? cancelledOrderData.couponDiscount : 0 ;
        let totalCommonDiscount = specialDiscount + couponDiscount;
        let commonDiscountPercentage = totalCommonDiscount / subTotal * 100;
        
        console.log('specialDiscount of canceled order :', specialDiscount);
        console.log('couponDiscount of canceled order :', couponDiscount);
        console.log('totalCommonDiscount of canceled order :', totalCommonDiscount);
        console.log('commonDiscountPercentage of canceled order :', commonDiscountPercentage);


        const cancelledItem = cancelledOrderData.orderedItems.find(item => item.productRef.toString() === cancelProductRef);

        const itemName = cancelledItem.name;
        const itemPrice = cancelledItem.totalPrice;
        const itemQuantity = cancelledItem.quantity;
        const itemTotalPrice = itemPrice * itemQuantity;
        console.log('itemName is :', itemName);
        console.log('itemPrice is :', itemPrice);
        console.log('itemQuantity is :', itemQuantity);
        console.log('itemTotalPrice is :', itemTotalPrice);
        
        let equallentItemDiscount = itemTotalPrice * commonDiscountPercentage / 100;
        console.log('equallentItemDiscount is :', equallentItemDiscount);

        let offerDiscount = cancelledItem.offerDiscount ? cancelledItem.offerDiscount : 0; //offer discount value of cancelled item.
        console.log('offerDiscount of canceled item :', offerDiscount);

        // refund amount should be after deducting the discount (user paid the amount after discount)
        const refundAmount = itemTotalPrice - (equallentItemDiscount + offerDiscount);
        console.log('refundAmount to add into user wallet :', refundAmount);


        // transfer the money to user wallet if payment method is not COD
        if (cancelledOrderData.paymentMethod != 'Cash On Delivery'){

            const transactionDetails = {
                date : cancelledOrderData.cancelDate,
                amount : refundAmount,
                description : `Cancellation of order: ${itemName}. Order No: ${cancelledOrderData.orderNo}`,
            }


            const updatedUserWallet = await User.findOneAndUpdate(
                {_id: req.session.userId},
                {
                    $inc: {walletBalance: refundAmount},
                    $push: {walletHistory: transactionDetails},
                },
                {new: true}
            );
            console.log('updated user wallet amount :', updatedUserWallet.walletBalance);
        }


        // reverting the order quantity to the product stock inventory.
        const updatedProductData = await Product.findOneAndUpdate(
            {_id: cancelProductRef},
            {$inc: {quantity: itemQuantity}},
            {new: true}
        );
        console.log('updated product invetory quantity :', updatedProductData.quantity);


        return res.json({ success: true, message: 'Order cancelled and refund processed successfully.' });


    } catch (error) {
        console.log('error while cancel the order :', error);
        return res.status(500).json({ error: true, message: 'Failed to cancel order and process refund' });
    }
}







module.exports = {
    loadOrderList,
    loadOrderItems,
    updateOrderStatus,
    cancelOrder,
}