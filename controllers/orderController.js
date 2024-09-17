const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const GoldPrice = require('../models/goldPriceModel');

const Crypto = require ('crypto');  // for online/razorPay verifyPayment

require('dotenv').config();
const RazorPay = require('razorpay');

const razorPayInstance = new RazorPay ({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET
});

const cron = require('node-cron');  // cron job for pendingOrdersManaging & cancelPendingOrders

const puppeteer = require ('puppeteer');
const zlib = require('zlib');




//load orders list ----------------------------------------
const loadOrderList = async(req, res)=>{
    try {
        const adminData = await User.findOne({_id: req.session.adminId});
        const goldPriceData = await GoldPrice.findOne({});


        const searchQuery = req.query.search || '';
        console.log('searchQuery : ', searchQuery);

        const statusQuery = req.query['order-status'] || 'all';
        console.log('statusQuery : ', statusQuery);

        const methodQuery = req.query['payment-method'] || 'all';
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
        console.log('matchQuery :', matchQuery);

        if (statusQuery != 'all') {
            matchQuery.orderStatus = statusQuery;
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

        } else if (sortQuery === 'shipment-pendings-asc') {
            sortOptions.shipmentPendings = 1;
        } else if (sortQuery === 'shipment-pendings-desc') {
            sortOptions.shipmentPendings = -1;

        } else if (sortQuery === 'delivery-pendings-asc') {
            sortOptions.deliveryPendings = 1;
        } else if (sortQuery === 'delivery-pendings-desc') {
            sortOptions.deliveryPendings = -1;

        } else if (sortQuery === 'cancelled-asc') {
            sortOptions.cancelledCount = 1;
        } else if (sortQuery === 'cancelled-desc') {
            sortOptions.cancelledCount = -1;

        } else if (sortQuery === 'delivered-asc') {
            sortOptions.deliveredCount = 1;
        } else if (sortQuery === 'delivered-desc') {
            sortOptions.deliveredCount = -1;

        } else if (sortQuery === 'returned-asc') {
            sortOptions.returnedCount = 1;
        } else if (sortQuery === 'returned-desc') {
            sortOptions.returnedCount = -1;

        } else if (sortQuery === 'return-requests-asc') {
            sortOptions.returnRequests = 1;
        } else if (sortQuery === 'return-requests-desc') {
            sortOptions.returnRequests = -1;

        } else {
            sortOptions.orderDate = -1; // Default sorting by order date descending
        }

        console.log('sortOptions :', sortOptions);


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



        // UPDATING THE STATUS COUNTS
        // Initialize counters for each status
        let placedCount = 0;
        let confirmedCount = 0;
        let shippedCount = 0;
        let outForDeliveryCount = 0;
        let deliveredCount = 0;
        let returnRequestedCount = 0;
        let returnRequestRejectedCount = 0;
        let returnRequestAcceptedCount = 0;
        let returnedCount = 0;
        let cancelledCount = 0;

        // Iterate over orderedItems to find the count of all statuses
        orderData.orderedItems.forEach(item => {
            switch(item.productStatus) {
                case 'Placed':
                    placedCount++;
                    break;
                case 'Confirmed':
                    confirmedCount++;
                    break;
                case 'Shipped':
                    shippedCount++;
                    break;
                case 'Out for Delivery':
                    outForDeliveryCount++;
                    break;
                case 'Delivered':
                    deliveredCount++;
                    break;
                case 'Return Requested':
                    returnRequestedCount++;
                    break;
                case 'Return Request Rejected':
                    returnRequestRejectedCount++;
                    break;
                case 'Return Request Accepted':
                    returnRequestAcceptedCount++;
                    break;
                case 'Returned':
                    returnedCount++;
                    break;
                case 'Cancelled':
                    cancelledCount++;
                    break;
                default:
                    break;
            }
        });

        let shipmentPendings = placedCount + confirmedCount;
        let deliveryPendings = shippedCount + outForDeliveryCount;
        let returnRequests = returnRequestedCount + returnRequestAcceptedCount;

        let processCompletedCount = cancelledCount + deliveredCount + returnedCount + returnRequestRejectedCount;
        let orderStatus;

        
        if (orderData.orderedItems.length === processCompletedCount){
            orderStatus = 'Process Completed';
        } else if (orderData.orderedItems.length > processCompletedCount){
            orderStatus = 'Processing';
        }


        if (orderData.orderStatus != 'Pending' && orderData.orderStatus != 'Failed'){
            const countUpdatedOrderData = await Order.findOneAndUpdate(
                {_id: orderId},
                { $set:
                    {
                        shipmentPendings : shipmentPendings,
                        deliveryPendings : deliveryPendings,
                        cancelledCount : cancelledCount,
                        deliveredCount : deliveredCount,
                        returnedCount : returnedCount,
                        returnRequests : returnRequests,
                        orderStatus : orderStatus // Processing / Process Completed
                    }
                },
                {new : true}
            );

            if (countUpdatedOrderData){
                console.log(`orderStatus & status counts are updated (orderNo: ${countUpdatedOrderData.orderNo} - orderStatus : ${countUpdatedOrderData.orderStatus})`);
            }
        }






        res.render('orderItems', {adminData, goldPriceData, orderData});


    } catch (error) {
        console.log('error in loading ordered items :', error.message);
        return res.json({error: true});
    }
}




// update order status -------------------------------------
const updateOrderStatus = async(req, res)=>{
    try {

        const {orderId, itemProductRef, newStatus} = req.body;
        console.log('details received for updateOrderStatus :', req.body);

        const orderData = await Order.findOne({_id: orderId});

        // finding the item to change the order status
        const orderProduct = orderData.orderedItems.find(item => item.productRef.toString() === itemProductRef);

        orderProduct.productStatus = newStatus;


        if (newStatus === 'Delivered') {
            console.log('order item ', orderProduct?.code, ' is delivered.');
            orderProduct.deliveryDate = Date.now();

            // if COD order, collect the money from the customer and update the paymentStatus
            if (orderData.paymentMethod === 'Cash On Delivery'){
                orderProduct.paymentStatus = 'Success';
            }
        }
        
        
        if (newStatus === 'Returned'){
            console.log('order item ', orderProduct?.code, ' is returned.');
            orderProduct.returnDate = Date.now();

            // calculating the refund amount to user wallet
            let subTotal = orderData.subTotal; // total cart amount without any discounts.
            let specialDiscount = orderData.specialDiscount ? orderData.specialDiscount : 0 ;  // old discount structure.
            let couponDiscount = orderData.couponDiscount ? orderData.couponDiscount : 0 ;
            let totalCommonDiscount = specialDiscount + couponDiscount;
            let commonDiscountPercentage = totalCommonDiscount / subTotal * 100;
            
            console.log('specialDiscount of returned order :', specialDiscount);
            console.log('couponDiscount of returned order :', couponDiscount);
            console.log('totalCommonDiscount of returned order :', totalCommonDiscount);
            console.log('commonDiscountPercentage of returned order :', commonDiscountPercentage);


            const itemName = orderProduct.name;
            const itemPrice = orderProduct.totalPrice;
            const itemQuantity = orderProduct.quantity;
            const itemTotalPrice = itemPrice * itemQuantity;
            console.log('itemName is :', itemName);
            console.log('itemPrice is :', itemPrice);
            console.log('itemQuantity is :', itemQuantity);
            console.log('itemTotalPrice is :', itemTotalPrice);

            let equallentItemDiscount = itemTotalPrice * commonDiscountPercentage / 100;
            console.log('equallentItemDiscount is :', equallentItemDiscount);
    
            let offerDiscount = (orderProduct.offerDiscount ? orderProduct.offerDiscount : 0) * itemQuantity; //offer discount value of cancelled item * itemQuantity.
            console.log('offerDiscount of canceled item :', offerDiscount);
    
            // refund amount should be after deducting the discount (user paid the amount after discount)
            const refundAmount = itemTotalPrice - (equallentItemDiscount + offerDiscount);
            console.log('refundAmount to add into user wallet :', refundAmount);

            
            // transfer the money to user wallet.
            const transactionDetails = {
                date : orderProduct.returnDate,
                amount : refundAmount,
                description : `Returning of order - ${itemName}. Order No: ${orderData.orderNo}`,
            }

            const updatedUserWallet = await User.findOneAndUpdate(
                {_id: orderData.userRef},
                {
                    $inc: {walletBalance: refundAmount},
                    $push: {walletHistory: transactionDetails},
                },
                {new: true}
            );
            console.log('updated user wallet amount :', updatedUserWallet.walletBalance);


            // updating the payment status to 'Refunded' after the amount refunded to to wallet.
            orderProduct.paymentStatus = 'Refunded';


            // reverting the order quantity to the product stock inventory.
            const updatedProductData = await Product.findOneAndUpdate(
                {_id: itemProductRef},
                {$inc: {quantity: itemQuantity}},
                {new: true}
            );
            console.log('updated product invetory quantity :', updatedProductData.quantity);

        }


        orderData.save();
        console.log('productStatus is updated to :', newStatus);



        // UPDATING THE STATUS COUNTS
        // Initialize counters for each status
        let placedCount = 0;
        let confirmedCount = 0;
        let shippedCount = 0;
        let outForDeliveryCount = 0;
        let deliveredCount = 0;
        let returnRequestedCount = 0;
        let returnRequestRejectedCount = 0;
        let returnRequestAcceptedCount = 0;
        let returnedCount = 0;
        let cancelledCount = 0;

        // Iterate over orderedItems to find the count of all statuses
        orderData.orderedItems.forEach(item => {
            switch(item.productStatus) {
                case 'Placed':
                    placedCount++;
                    break;
                case 'Confirmed':
                    confirmedCount++;
                    break;
                case 'Shipped':
                    shippedCount++;
                    break;
                case 'Out for Delivery':
                    outForDeliveryCount++;
                    break;
                case 'Delivered':
                    deliveredCount++;
                    break;
                case 'Return Requested':
                    returnRequestedCount++;
                    break;
                case 'Return Request Rejected':
                    returnRequestRejectedCount++;
                    break;
                case 'Return Request Accepted':
                    returnRequestAcceptedCount++;
                    break;
                case 'Returned':
                    returnedCount++;
                    break;
                case 'Cancelled':
                    cancelledCount++;
                    break;
                default:
                    break;
            }
        });

        let shipmentPendings = placedCount + confirmedCount;
        let deliveryPendings = shippedCount + outForDeliveryCount;
        let returnRequests = returnRequestedCount + returnRequestAcceptedCount;

        let processCompletedCount = cancelledCount + deliveredCount + returnedCount + returnRequestRejectedCount;
        let orderStatus;

        if (orderData.orderedItems.length === processCompletedCount){
            orderStatus = 'Process Completed';
        } else if (orderData.orderedItems.length > processCompletedCount){
            orderStatus = 'Processing';
        }

        const countUpdatedOrderData = await Order.findOneAndUpdate(
            {_id: orderId},
            { $set:
                {
                    shipmentPendings : shipmentPendings,
                    deliveryPendings : deliveryPendings,
                    cancelledCount : cancelledCount,
                    deliveredCount : deliveredCount,
                    returnedCount : returnedCount,
                    returnRequests : returnRequests,
                    orderStatus : orderStatus // Processing / Process Completed
                }
            },
            {new : true}
        );


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

        // changing the order status to "Cancelled" & updating cancelledCount & shipmentPendings count
        const cancelledOrderData = await Order.findOneAndUpdate(
            { _id: cancelOrderId, 'orderedItems.productRef': cancelProductRef },
            { 
                $set: {
                    'orderedItems.$.productStatus': 'Cancelled',
                    'orderedItems.$.cancelReason': cancelReason,
                    'orderedItems.$.cancelDate': new Date(),
                },
                $inc: {
                    cancelledCount: 1,
                    // shipmentPendings: -1  // -1 count  counting at end of this function
                }
            },
            { new: true }
        );


        if (cancelledOrderData){
            console.log('order is cancelled. cancelled count added. cancelledOrderData.orderNo :', cancelledOrderData.orderNo);

            // calculating the refund amount to user wallet
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
                    date : cancelledItem.cancelDate,
                    amount : refundAmount,
                    description : `Cancellation of Product - ${itemName}. Order No: ${cancelledOrderData.orderNo}`,
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


                // updating the payment status to 'Refunded' after the amount refunded to to wallet.
                const updatedOrderData = await Order.findOneAndUpdate(
                    { _id: cancelOrderId, 'orderedItems.productRef': cancelProductRef },
                    { $set: { 'orderedItems.$.paymentStatus': 'Refunded' } },
                    { new: true }
                );

                if (updatedOrderData) {
                    console.log('Payment status updated to Refunded for item:', cancelledItem.name);
                }

            }




            // reverting the order quantity to the product stock inventory.
            const updatedProductData = await Product.findOneAndUpdate(
                {_id: cancelProductRef},
                {$inc: {quantity: itemQuantity}},
                {new: true}
            );
            console.log('updated product invetory quantity :', updatedProductData.quantity);



            
            // UPDATING THE STATUS COUNTS
            // Initialize counters for each status
            let placedCount = 0;
            let confirmedCount = 0;
            let shippedCount = 0;
            let outForDeliveryCount = 0;
            let deliveredCount = 0;
            let returnRequestedCount = 0;
            let returnRequestRejectedCount = 0;
            let returnRequestAcceptedCount = 0;
            let returnedCount = 0;
            let cancelledCount = 0;

            // Iterate over orderedItems to find the count of all statuses
            cancelledOrderData.orderedItems.forEach(item => {
                switch(item.productStatus) {
                    case 'Placed':
                        placedCount++;
                        break;
                    case 'Confirmed':
                        confirmedCount++;
                        break;
                    case 'Shipped':
                        shippedCount++;
                        break;
                    case 'Out for Delivery':
                        outForDeliveryCount++;
                        break;
                    case 'Delivered':
                        deliveredCount++;
                        break;
                    case 'Return Requested':
                        returnRequestedCount++;
                        break;
                    case 'Return Request Rejected':
                        returnRequestRejectedCount++;
                        break;
                    case 'Return Request Accepted':
                        returnRequestAcceptedCount++;
                        break;
                    case 'Returned':
                        returnedCount++;
                        break;
                    case 'Cancelled':
                        cancelledCount++;
                        break;
                    default:
                        break;
                }
            });

            let shipmentPendings = placedCount + confirmedCount;
            let deliveryPendings = shippedCount + outForDeliveryCount;
            let returnRequests = returnRequestedCount + returnRequestAcceptedCount;

            let processCompletedCount = cancelledCount + deliveredCount + returnedCount + returnRequestRejectedCount;
            let orderStatus;

            if (cancelledOrderData.orderedItems.length === processCompletedCount){
                orderStatus = 'Process Completed';
            } else if (cancelledOrderData.orderedItems.length > processCompletedCount){
                orderStatus = 'Processing';
            }

            const countUpdatedOrderData = await Order.findOneAndUpdate(
                {_id: cancelOrderId},
                { $set:
                    {
                        shipmentPendings : shipmentPendings,
                        deliveryPendings : deliveryPendings,
                        cancelledCount : cancelledCount,
                        deliveredCount : deliveredCount,
                        returnedCount : returnedCount,
                        returnRequests : returnRequests,
                        orderStatus : orderStatus // Processing / Process Completed
                    }
                },
                {new : true}
            );

            if (countUpdatedOrderData){
                console.log('order status and status counts are updated.');
            }
            


            return res.json({ success: true, message: 'Ordered item has been cancelled successfully.' });
            
        }

        orderedItems


    } catch (error) {
        console.log('error while cancel the order :', error);
        return res.status(500).json({ error: true, message: 'Failed to cancel order and process refund' });
    }
}




// return order item ----------------------------------------
const returnOrder = async (req, res)=>{
    try {
        const {returnOrderId, returnProductRef, returnReason} = req.body;
        console.log('received data for returnOrder :', req.body);

        // changing the order status to "Return Requested"
        const returnOrderData = await Order.findOneAndUpdate(
            { _id: returnOrderId, 'orderedItems.productRef': returnProductRef },
            { 
                $set: { 
                    'orderedItems.$.productStatus': 'Return Requested',
                    'orderedItems.$.returnReason': returnReason,
                    // 'orderedItems.$.returnDate': new Date(), // add the date after admin change to "Returned"
                }
            },
            { new: true }
        );


        if (returnOrderData){

            // UPDATING THE STATUS COUNTS
            // Initialize counters for each status
            let placedCount = 0;
            let confirmedCount = 0;
            let shippedCount = 0;
            let outForDeliveryCount = 0;
            let deliveredCount = 0;
            let returnRequestedCount = 0;
            let returnRequestRejectedCount = 0;
            let returnRequestAcceptedCount = 0;
            let returnedCount = 0;
            let cancelledCount = 0;

            // Iterate over orderedItems to find the count of all statuses
            returnOrderData.orderedItems.forEach(item => {
                switch(item.productStatus) {
                    case 'Placed':
                        placedCount++;
                        break;
                    case 'Confirmed':
                        confirmedCount++;
                        break;
                    case 'Shipped':
                        shippedCount++;
                        break;
                    case 'Out for Delivery':
                        outForDeliveryCount++;
                        break;
                    case 'Delivered':
                        deliveredCount++;
                        break;
                    case 'Return Requested':
                        returnRequestedCount++;
                        break;
                    case 'Return Request Rejected':
                        returnRequestRejectedCount++;
                        break;
                    case 'Return Request Accepted':
                        returnRequestAcceptedCount++;
                        break;
                    case 'Returned':
                        returnedCount++;
                        break;
                    case 'Cancelled':
                        cancelledCount++;
                        break;
                    default:
                        break;
                }
            });

            let shipmentPendings = placedCount + confirmedCount;
            let deliveryPendings = shippedCount + outForDeliveryCount;
            let returnRequests = returnRequestedCount + returnRequestAcceptedCount;

            let processCompletedCount = cancelledCount + deliveredCount + returnedCount + returnRequestRejectedCount;
            let orderStatus;

            if (returnOrderData.orderedItems.length === processCompletedCount){
                orderStatus = 'Process Completed';
            } else if (returnOrderData.orderedItems.length > processCompletedCount){
                orderStatus = 'Processing';
            }

            const countUpdatedOrderData = await Order.findOneAndUpdate(
                {_id: returnOrderId},
                { $set:
                    {
                        shipmentPendings : shipmentPendings,
                        deliveryPendings : deliveryPendings,
                        cancelledCount : cancelledCount,
                        deliveredCount : deliveredCount,
                        returnedCount : returnedCount,
                        returnRequests : returnRequests,
                        orderStatus : orderStatus // Processing / Process Completed
                    }
                },
                {new : true}
            );
            

            return res.json({ returnRequested: true, message: 'Return request submitted and refund will be processed once the item is returned.' });

        }



    } catch (error) {
        console.log('error in returnOrder :', error.message);
        return res.json({error: true, message: error.message});
    }
}





const loadRetryPayment = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const pendingOrderId = req.query.orderId;
        const userWishlist = await Wishlist.findOne({ userRef: sessionId});
        const userCart = await Cart.findOne({ userRef: sessionId});
        
        let cartCount = 0;
        let wishlistCount = 0;

        if (userWishlist){
            userWishlist.product.forEach((product) => {
                wishlistCount += product.quantity;
            });
        }


        if (userCart){
            userCart.product.forEach((product) => {
                cartCount += product.quantity;
            });
        }


        const pendingOrderData = await Order.findOne({_id: pendingOrderId});

        if (pendingOrderData){
            let subTotal = 0;   //total checkout/order amount without any discount/offer/coupon/wallet
            let totalOfferDiscount = 0;
    
            pendingOrderData.orderedItems.forEach((item)=>{
                let itemUnitPrice = item.totalPrice;
                let itemQuantity = item.quantity;
                let individualTotal = (itemUnitPrice * itemQuantity);
                subTotal += individualTotal;
    
                itemOfferAmount = (item.offerDiscount ? item.offerDiscount : 0) * itemQuantity;  // each item's offer amount * itemQuantity
                totalOfferDiscount += itemOfferAmount;
            });

            let shippingCharge = pendingOrderData.deliveryCharge ? pendingOrderData.deliveryCharge : 0;
            let couponDiscount = pendingOrderData.couponDiscount ? pendingOrderData.couponDiscount : 0;
            let specialDiscount = pendingOrderData.specialDiscount ? pendingOrderData.specialDiscount : 0;  // was implemented before offer and coupon (now no more needed).
            
            console.log('pendingOrderData subTotal : ', subTotal);
            console.log('pendingOrderData shippingCharge : ', shippingCharge);
            console.log('pendingOrderData totalOfferDiscount : ', totalOfferDiscount);
            console.log('pendingOrderData specialDiscount : ', specialDiscount);
            console.log('pendingOrderData couponDiscount : ', couponDiscount);

            let payableAmount = subTotal + shippingCharge - specialDiscount - couponDiscount - totalOfferDiscount;
            console.log('pendingOrderData payableAmount : ', payableAmount);
    
            let roundOffAmount = payableAmount - Math.floor(payableAmount);
            console.log('pendingOrderData roundOffAmount : ', roundOffAmount);

            const userData = await User.findOne({_id: sessionId});


            if (pendingOrderData.orderStatus === 'Pending'){
                res.render('retryPayment', 
                    {   pendingOrderData, 
                        subTotal, 
                        shippingCharge, 
                        totalOfferDiscount, 
                        specialDiscount, 
                        couponDiscount, 
                        payableAmount, 
                        roundOffAmount,
                        userData, 
                        cartCount, 
                        wishlistCount, 
                    }
                );

            } else {
                res.redirect('/orders');
            }

        } else {
            console.log('cannot find the pending order data.');
        }

    } catch (error) {
        return res.status(400).json({error: true, message: error.message});
    }
}




// retry the failed/ pending payment and change order status
const retryPayment = async (req, res)=>{
    try {
        const sessionId = req.session.userId;
        const userData = await User.findOne({_id: sessionId});

        console.log('data received in retryPayment :', req.body);

        const pendingOrderId = req.body.pendingOrderId;
        const selectedPaymentMethod = req.body.selectedPaymentMethod;

        const pendingOrderData = await Order.findOne({_id: pendingOrderId});


        if (pendingOrderData){

            // Calculate time difference in minutes between current time and orderDate
            const currentTime = new Date();
            const orderDate = new Date(pendingOrderData.orderDate);
            const timeDifferenceInMinutes = Math.floor((currentTime - orderDate) / (1000 * 60));  // 60 seconds
            const timeDifferenceInSeconds = Math.floor((currentTime - orderDate) / (1000 * 1));   // 1 second

            console.log('currentTime in retryPayment:', currentTime);
            console.log('orderDate in retryPayment:', orderDate);
            console.log('timeDifferenceInSeconds in retryPayment:', timeDifferenceInSeconds);
            console.log('timeDifferenceInMinutes in retryPayment:', timeDifferenceInMinutes);
            
            // cancel the expired pending orders after 10 minute from orderDate.
            if (timeDifferenceInMinutes >= 1) { // 1 minutes from orderDate. (same duration should be there in front end. check frontend script)
                console.log('Retry payment time expired after 10 minutes of order.');
                
                // change the orderStatus ('Failed'), paymentStatus ('Failed') & productStatus ('Not Applicable').
                const failedOrderData = await Order.findOneAndUpdate(
                    {_id: pendingOrderId},
                    { $set : {
                        orderStatus : 'Failed',
                        'orderedItems.$[].paymentStatus': 'Failed',
                        'orderedItems.$[].productStatus': 'Not Applicable',
                    }},
                    {new : true}
                );
                
                console.log('failedOrderData.orderStatus :', failedOrderData.orderStatus);
                console.log('failedOrderData.orderedItems[0].paymentStatus :', failedOrderData.orderedItems[0].paymentStatus);
                console.log('failedOrderData.orderedItems[0].productStatus :', failedOrderData.orderedItems[0].productStatus);

                
                // return the product inventory stock quantity after order failed.
                for (const item of failedOrderData.orderedItems) {
                    let productId = item.productRef;
                    let productCode = item?.code;
                    let orderQuantity = item.quantity;

                    console.log('Product code of failed order:', productCode);
                    console.log('Order quantity of failed order:', orderQuantity);

                    try {
                        const updatedProductInventory = await Product.findOneAndUpdate(
                            { _id: productId },
                            { $inc: { quantity: orderQuantity } },
                            { new: true }
                        );
                        console.log('Updated product inventory of :', updatedProductInventory?.code);

                    } catch (err) {
                        console.error('Error updating product inventory:', err);
                    }
                }

                return res.json({ retryExpired : true, message: 'Your payment retry period has expired. Please proceed with a new order.' });

            } else {  // time not expired

                let paymentStatus;
            
                if (selectedPaymentMethod === 'Cash On Delivery'){
                    console.log('Retry Payment with COD.');
                    
                    paymentStatus = 'Pending';
                    
                    return res.json({updateOrder: true, pendingOrderId, selectedPaymentMethod, paymentStatus});
    
                    
                } else if (selectedPaymentMethod === 'Wallet'){
                    console.log('Retry Payment with Wallet.');
    
                    const walletBalance = userData.walletBalance ? userData.walletBalance : 0;
                    
                    if (walletBalance < pendingOrderData.netAmount) {
                        console.log('Wallet balance is insufficient.');
                        return res.json({lowBalance: true, walletBalance});
                        
                    } else {
                        paymentStatus = 'Pending'; // or what can give for wallet or at initial stage for wallet?
                        console.log('Wallet balance is sufficient and can make payment.');
                        
                        return res.json({updateOrder: true, pendingOrderId, selectedPaymentMethod, paymentStatus});
                    }
                    
                    
                // if payment method is 'Online Payment', create order instance for razorPay payment integration.
                } else if (selectedPaymentMethod === 'Online Payment'){
                    console.log('Retry Payment with Online Payment.');
                    
                    // const timeOptions = { timeZone: 'Asia/Kolkata', hour12: false };
                    // const receiptString = `${userData._id}_${new Date().toLocaleString('sv-SE', timeOptions).replace(/[-:]/g, "").replace(" ", "T")}`;
                    // timeOptions & receiptString are replaced by pendingOrderId.
                    
                    const options = {
                        amount : pendingOrderData.netAmount * 100, // in currency subunits (paise). Default currency is INR. Hence, amount * 100 paise.
                        currency : "INR",
                        receipt : pendingOrderId   // pendingOrderId instead of receiptString.
                    }
                    console.log('options for razorPayInstance :', options);
                    
                    razorPayInstance.orders.create(options, (err, order)=> {
                        if (err) {
                            console.log('Failed to create razorPay order instance :', err);
                            paymentStatus = 'Failed';
                            return res.json({instanceFailed: true, err, paymentStatus});  // need to send paymentStatus & userData ??
                            
                        } else {
                            console.log('razorPay order instance created for retry payment :', order);
                            paymentStatus = 'Pending'; // until the payment verification complete (success).
                            return res.json({proceedToRazorPay: true, order, selectedPaymentMethod, paymentStatus, userData});
                        }
      
                    });
                        
                }
            }


        }
        
        
    } catch (error) {
        console.log('error in retryPayment :', error);
        return res.json({error: true});
    }
}





const updateRetryOrder = async(req, res)=>{
    try {
        const sessionId = req.session.userId;
        const {razorPayOrder, pendingOrderId, paymentMethod, paymentStatus} = req.body;

        console.log('paymentMethod in updateRetryOrder :', paymentMethod);
        console.log('paymentStatus in updateRetryOrder :', paymentStatus);
        console.log('razorPayOrder in updateRetryOrder :', razorPayOrder);  // if online payment
        console.log('pendingOrderId in updateRetryOrder :', pendingOrderId);  // if COD or Wallet Payment

        const orderId = razorPayOrder != undefined ? razorPayOrder.receipt : pendingOrderId;

        console.log('orderId for updating the updateRetryOrder :', orderId);


        // Update the orderStatus, and the paymentStatus & productStatus of all orderedItems.
        const orderData = await Order.findOne({ _id: orderId });

        if (orderData) {
            // if payment method is COD and no more process left in ordering.
            if (paymentMethod === 'Cash On Delivery'){
                console.log('orderNo for updation :', orderData.orderNo);

                const updatedOrderData = await Order.findOneAndUpdate(
                    {orderNo : orderData.orderNo},
                    { $set : {
                        paymentMethod : 'Cash On Delivery',  // change from 'Online' to 'COD'.
                        orderStatus : 'Processing',
                        shipmentPendings : orderData.orderedItems.length,
                        'orderedItems.$[].paymentStatus': 'Pending', // change from 'Failed' to 'Pending' for COD
                        'orderedItems.$[].productStatus': 'Placed',
                    }},
                    {new : true}
                );

                console.log('updatedOrderData.orderStatus :', updatedOrderData.orderStatus);
                console.log('updatedOrderData.orderedItems[0].paymentStatus :', updatedOrderData.orderedItems[0].paymentStatus);
                console.log('updatedOrderData.orderedItems[0].productStatus :', updatedOrderData.orderedItems[0].productStatus);
                
                console.log('retry order success with COD.');
                return res.json({updateSuccess: true, });
            

            // if payment method is 'Wallet', debit the money from user wallet.
            } else if (paymentMethod === 'Wallet'){

                const transactionDetails = {
                    date : orderData.orderDate,
                    amount : -orderData.netAmount,
                    description : `Purchasing of ornaments - Order No: ${orderData.orderNo}`,
                }
                console.log('Amount to debit from user wallet :', transactionDetails.amount);
    
    
                const updatedUserWallet = await User.findOneAndUpdate(
                    {_id: sessionId},
                    {
                        $inc: {walletBalance: -orderData.netAmount},
                        $push: {walletHistory: transactionDetails},
                    },
                    {new: true}
                );
                console.log('updated user wallet amount :', updatedUserWallet.walletBalance);

                // change the paymentStatus to "Success".
                if (updatedUserWallet){
                    const updatedOrderData = await Order.findOneAndUpdate(
                        {orderNo : orderData.orderNo},
                        {
                            $set : {
                                paymentMethod : 'Wallet',  // change from 'Online' to 'Wallet'.
                                orderStatus : 'Processing',
                                shipmentPendings : orderData.orderedItems.length,
                                'orderedItems.$[].paymentStatus': 'Success',
                                'orderedItems.$[].productStatus': 'Placed',
                            }
                        },
                        {new : true}
                    );
                    
                    console.log('updatedOrderData.orderStatus :', updatedOrderData.orderStatus);
                    console.log('updatedOrderData.orderedItems[0].paymentStatus :', updatedOrderData.orderedItems[0].paymentStatus);
                    console.log('updatedOrderData.orderedItems[0].productStatus :', updatedOrderData.orderedItems[0].productStatus);
                    
                    console.log('retry order success with Wallet Payment.');
                    return res.json({updateSuccess: true});
                }
    
    
            // if payment method is 'Online Payment'
            } else if (paymentMethod === 'Online Payment'){

                if (paymentStatus === 'Success'){
                    const successOrderData = await Order.findOneAndUpdate(
                        {orderNo : orderData.orderNo},
                        { $set : {
                            orderStatus : 'Processing',
                            shipmentPendings : orderData.orderedItems.length,
                            'orderedItems.$[].paymentStatus': 'Success',
                            'orderedItems.$[].productStatus': 'Placed',
                        }},
                        {new : true}
                    );

                    console.log('successOrderData.orderStatus :', successOrderData.orderStatus);
                    console.log('successOrderData.orderedItems[0].paymentStatus :', successOrderData.orderedItems[0].paymentStatus);
                    console.log('successOrderData.orderedItems[0].productStatus :', successOrderData.orderedItems[0].productStatus);

                    console.log('retry order success with Online Payment.');
                    return res.json({updateSuccess: true});

                } else {
                    const pendingOrderData = await Order.findOneAndUpdate(
                        {orderNo : orderData.orderNo},
                        {   $set : {
                                // orderStatus : 'Pending',  // no need to change. orderStatus is 'Pending' initially.
                                'orderedItems.$[].paymentStatus': paymentStatus,  // 'Failed' again.
                                'orderedItems.$[].productStatus': 'Not Applicable',  // no need to 'Placed' for pending order.    
                            }
                        },
                        {new : true}
                    );

                    console.log('pendingOrderData.orderStatus :', pendingOrderData.orderStatus);
                    console.log('pendingOrderData.orderedItems[0].paymentStatus :', pendingOrderData.orderedItems[0].paymentStatus);
                    
                    console.log('retry order failed with Online Payment.');
                    return res.json({proceedRetry: true, pendingOrderData});
                }
                
            }
             

        } else {
            console.log('Order not found or not updated.');
            // res.json({ updateFailed : true, message: 'Order not found or not updated.'});
        }
        


    } catch (error) {
        console.log('error in updatePendingOrder :', error.message);
        return res.json({error: true, message: error.message});
    }
}




// to cancel pending orders after 10 minutes
const cancelPendingOrders = async (req, res) => {
    try {
        const nowTime = new Date(Date.now());
        const tenMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);  // 10 minutes before the current time.

        console.log('nowTime :', nowTime);
        console.log('tenMinutesAgo :', tenMinutesAgo);

        // Find orders where orderStatus is "Pending" and orderDate is more than 10 minutes ago
        const expiredPendingOrders = await Order.find({
            orderStatus: "Pending",
            orderDate: { $lte: tenMinutesAgo },
        });


        for (const order of expiredPendingOrders) {
            try {
                // Update orderStatus and paymentStatus of each order.
                order.orderStatus = "Failed";

                for (const item of order.orderedItems) {
                    item.paymentStatus = "Failed";
                    item.productStatus = "Not Applicable";

                    // Update the product inventory stock
                    const inventoryProduct = await Product.findOneAndUpdate(
                        { _id: item.productRef },
                        { $inc: { quantity: item.quantity } }
                    );
                    console.log(`updated the inventory stock count of : ${inventoryProduct?.code}.`);

                }

                console.log(`${order.orderNo} is expired and cancelled.`);

                // Save the updated order
                await order.save();
            } catch (err) {
                console.error(`Error updating order ${order.orderNo}:`, err);
            }
        }

        console.log(`Cancelled ${expiredPendingOrders.length} expired 'Pending' orders.`);

    } catch (err) {
        console.error("Error cancelling pending orders:", err);
    }
};




// function calls the cron job function cancelPendingOrders.
const pendingOrdersManaging = async (req, res)=>{
    
    // Schedule the cron job to run every minute
    cron.schedule('* * * * *', () => {
        console.log('Running cancelPendingOrders job...');
        cancelPendingOrders();
    });
}



// to get the data for the invoice page.
const getInvoiceData = async(req, res)=>{
    try {
        // const sessionId = req.session.userId;
        const orderId = req.query.id;
        console.log('order id for getting invoice data :', orderId);
        
        // const userData = await User.findById(sessionId);
        const orderData = await Order.findOne({_id : orderId}).populate('userRef');

        console.log('Invoice data found :', orderData.orderNo);

        let totalOfferDiscount = 0;
        let totalGST = 0;

        orderData.orderedItems.forEach((item)=>{
            offerDiscount = item.offerDiscount ? item.offerDiscount : 0;
            totalOfferDiscount += offerDiscount;

            let itemGST = item.GST * item.quantity;
            totalGST += itemGST;
        });


        return { orderData, totalOfferDiscount, totalGST };

        
    } catch (error) {
        console.log('error in getInvoiceData :', error.message);
    }
}




// load invoice for user -------------------------------------
const loadInvoice = async(req, res)=>{
    try {

        const invoiceData = await getInvoiceData (req, res);

        const { 
            // userData, 
            orderData, 
            totalOfferDiscount, 
            totalGST 
        } = invoiceData;

        // to load the invoice page.
        res.render('orderInvoice1', { orderData, totalOfferDiscount, totalGST });

    } catch (error) {
        console.log('Error in loading the invoice page.', error.message);
    }
}




// for downloading the order invoice for user -----------------
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.id;
        console.log('order id for downloading invoice :', orderId);

        // Fetch order invoice details
        const invoiceData = await getInvoiceData(req, res); // Set forPdf to true

        const { 
            orderData, 
        } = invoiceData;

        // Launch a headless browser instance
        const browser = await puppeteer.launch();
        const page = await browser.newPage();


        // Replace `localhost:3000` with the actual URL if necessary
        // const invoiceUrl = `http://localhost:3000/invoice?id=${orderId}`;
        const invoiceUrl = `http://glitzjwellery.in/invoice?id=${orderId}`;

        console.log('Navigating to URL :', invoiceUrl);

        // Navigate to the invoice page
        await page.goto(invoiceUrl, { waitUntil: 'networkidle0' });

        // Log page title and URL to check what is being loaded
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log('Download Page title :', pageTitle);
        console.log('Download Page URL :', pageUrl);
        
        // Generate PDF from the page content
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        });


        // Compress the PDF
        const compressedBuffer = await new Promise((resolve, reject) => {
            zlib.gzip(pdfBuffer, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // Close the browser
        await browser.close();

        // Set response headers to trigger a download in the browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderData.orderNo}.pdf`);

        // Send the generated PDF as a response
        res.send(compressedBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
};






module.exports = {
    loadOrderList,
    loadOrderItems,
    updateOrderStatus,
    cancelOrder,
    returnOrder,
    loadRetryPayment,
    retryPayment,
    updateRetryOrder,
    pendingOrdersManaging,
    loadInvoice,
    downloadInvoice
}