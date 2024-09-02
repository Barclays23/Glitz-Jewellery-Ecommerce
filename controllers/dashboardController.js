const User = require('../models/userModel');
const GoldPrice = require('../models/goldPriceModel');
const Order = require('../models/orderModel');


// for PDF downloading.
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

// for excel downloading.
const ExcelJS = require('exceljs');







// fetch orders list (for dashboard & downloading) --------------------------
const getOrderList = async(req, res)=>{
    try {
        // const adminData = await User.findOne({_id: req.session.adminId});
        // const goldPriceData = await GoldPrice.findOne({});

        const searchQuery = req.query.search || '';
        console.log('searchQuery : ', searchQuery);

        const statusQuery = req.query['order-status'] || 'all';
        console.log('statusQuery : ', statusQuery);

        const methodQuery = req.query['payment-method'] || 'all';
        console.log('methodQuery : ', methodQuery);

        const sortQuery = req.query.sort || 'none';
        console.log('sortQuery : ', sortQuery);

        // date range parameters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let pageNo = parseInt(req.query.page) || 1;

        const limit = 10;
        
        
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


        // Adding date range filtering
        if (startDate && endDate) {
            // Parse the start and end dates to ensure proper formatting
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set start time to the beginning of the day
        
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set end time to the end of the day
        
            matchQuery.orderDate = {
                $gte: start,
                $lte: end
            };
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

        return {
            // adminData,
            // goldPriceData,
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage: pageNo,
            startIndex,
            endIndex,
        };

    } catch (error) {
        console.log('failed get order list : ', error);
    }
}



// fetch orders summary (for dashboard & downloading) -----------------------
const getOrderSummary = async (req, res)=>{
    try {
        const allOrders = await Order.find({});

        let totalAmount = 0;
        let totalOfferDiscount = 0;
        let totalCouponDiscount = 0;
        let totalSpecialDiscount = 0;
        let totalNetAmount = 0;


        let shipmentPendings = 0;
        let deliveryPendings = 0;
        let cancelledCount = 0;
        let deliveredCount = 0;
        let returnedCount = 0;
        let returnRequests = 0;

        let pendingReceivables = 0;


        for (let order of allOrders) {

            // for finding the amount summary and status count summary (NEED TO EXCLUDE CANCELLED AND RETURNED ORDER AMOUNTS)
            if (order.orderStatus != 'Pending' && order.orderStatus != 'Failed'){
 
                totalAmount += order.subTotal;
                totalCouponDiscount += order.couponDiscount ? order.couponDiscount : 0;
                totalSpecialDiscount += order.specialDiscount ? order.specialDiscount : 0;
                totalNetAmount += order.netAmount;


                // console.log('orderNo : ', order.orderNo);
                // console.log('orderStatus : ', order.orderStatus);
                
                
                shipmentPendings += order.shipmentPendings;
                deliveryPendings += order.deliveryPendings;
                cancelledCount += order.cancelledCount;
                deliveredCount += order.deliveredCount;
                returnedCount += order.returnedCount;
                returnRequests += order.returnRequests;
                
                for (item of order.orderedItems){
                    let itemQuantity = 0;
                    let itemOfferDiscount = 0;
                    let itemCode = item.code;
                    
                    itemQuantity += item.quantity;
                    itemOfferDiscount += item.offerDiscount ? item.offerDiscount : 0;
                    let result = itemOfferDiscount * itemQuantity;
                    
                    totalOfferDiscount += (itemOfferDiscount * itemQuantity);
                    
                    // console.log(`itemCode : ${itemCode} - item.offerDiscount : ${itemOfferDiscount} x qty : ${itemQuantity} = ${result}`);
                    // console.log('totalOfferDiscount :', totalOfferDiscount);
                }
            }



            // for finding the pendingReceivables
            if (order.paymentMethod === 'Cash On Delivery'){

                // console.log('COD orderNo : ', order.orderNo,);

                let orderSubTotal = order.subTotal;
                let orderCouponValue = order.couponDiscount ? order.couponDiscount : 0;
                let orderSpecialDiscount = order.specialDiscount ? order.specialDiscount : 0;
                let totalCommonDiscount = orderCouponValue + orderSpecialDiscount;
                let commonDiscountPercentage = totalCommonDiscount / orderSubTotal * 100;

                for (item of order.orderedItems){
                    if (item.paymentStatus === 'Pending'){
                        // console.log('item code : ', item.code);

                        let itemOfferAmount = item.offerDiscount ? item.offerDiscount : 0;
                        // console.log('itemOfferAmount : ', itemOfferAmount);
                        let itemTotalPrice = item.totalPrice;
                        let itemQuantity = item.quantity;

                        let equallentItemDiscount = itemTotalPrice * commonDiscountPercentage / 100;
                        let itemNetAmount = itemTotalPrice - equallentItemDiscount;

                        pendingReceivables += (itemNetAmount - itemOfferAmount) * itemQuantity;
                        // console.log('pendingRecievables : ', pendingReceivables);
                    }
                }
            }
        }

        console.log('shipmentPendings :', shipmentPendings);
        console.log('deliveryPendings :', deliveryPendings);
        console.log('cancelledCount :', cancelledCount);
        console.log('deliveredCount :', deliveredCount);
        console.log('returnedCount :', returnedCount);
        console.log('returnRequests :', returnRequests);

        return {
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        }

    } catch (error) {
        console.log('error in getOrderSummary : ', error.message);
    }
}




// fetch category wise sales report -----------------------------------------
const getCategoryWiseSaleReport = async (req, res)=>{
    const filter = req.query.filter || 'yearly'; // Default to 'yearly' if no filter is provided
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) - 1 : null; // Months in JavaScript are 0 index based

    console.log('category sale filter by query : ', filter);
    console.log('category sale filter by year : ', year);
    console.log('category sale filter by month : ', month);

    // Set the start and end dates based on the filter type
    let startDate, endDate;

    if (filter === 'monthly' && month !== null) {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // End of the selected month
    } else {
        startDate = new Date(year, 0, 1); // January 1st of the year
        endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the year
    }
    console.log('category sale filter startDate : ', startDate);
    console.log('category sale filter endDate : ', endDate);

    try {
        const aggregationPipeline = [
            {
                $match: {
                    orderStatus: { $in: ["Processing", "Process Completed"] },
                    orderDate: { $gte: startDate, $lte: endDate } // Filter by date range
                }
            },
            { $unwind: '$orderedItems' },
            {
                $match: {
                    'orderedItems.productStatus': { $nin: ["Cancelled", "Returned"] }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderedItems.productRef',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.categoryRef',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            {
                $group: {
                    _id: '$categoryDetails.name', // Group by category name
                    totalSales: { $sum: '$orderedItems.totalPrice' },
                    totalQuantity: { $sum: '$orderedItems.quantity' }
                }
            },
            { $sort: { totalSales: -1 } } // Sort by total sales in descending order
        ];

        const categoryWiseSalesReport = await Order.aggregate(aggregationPipeline);

        // Calculate total sales amount and quantity
        let totalSaleAmount = 0;   // totalAmount of orderedItems product (without any discount)
        let totalSaleQuantity = 0;
        categoryWiseSalesReport.forEach(report => {
            totalSaleAmount += report.totalSales;
            totalSaleQuantity += report.totalQuantity;
        });


        return {
            categoryWiseSalesReport,
            totalSaleAmount,
            totalSaleQuantity
        };


    } catch (error) {
        console.log('Error in getCategoryWiseSaleReport:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}




// for filtered categorywise-sale-report.
const filterCategorySale = async (req, res) => {
    try {
        const filteredCategorySaleReport = await getCategoryWiseSaleReport(req, res);
        
        console.log('filteredCategorySaleReport : ', filteredCategorySaleReport);

        // passing the data as json (NOT RENDERING OR RETURNING DIRECTLY. Both dashboard & categorywise report are showing in same page);
        return res.json (filteredCategorySaleReport);

    } catch (error) {
        console.error('Error in filterCategorySale report :', error.message);
        res.status(500).json({ error: 'Failed to fetch category-wise sales report' });
    }
};




// fetch product wise sale report --------------------------------
const getMostSoldProducts = async (req, res)=>{
    try {
        const limit = 10;

        const filter = req.query.filter || 'yearly'; // Default to 'yearly' if no filter is provided
        const filterYear = parseInt(req.query.year) || new Date().getFullYear();
        const filterMonth = req.query.month ? parseInt(req.query.month) - 1 : null; // -1 bcoz, Months in JavaScript are 0 index based.
    
        console.log('product sale filter by query : ', filter);
        console.log('product sale filter by year : ', filterYear);
        console.log('product sale filter by month : ', filterMonth);

        // Set the start and end dates based on the filter type
        let startDate, endDate;

        if (filterMonth) {
            startDate = new Date(Date.UTC(filterYear, filterMonth, 1, 0, 0, 0));
            endDate = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999); // End of the selected month

        } else { // 'yearly' or month == null
            startDate = new Date(filterYear, 0, 1, 0, 0, 0); // January 1st of the year
            endDate = new Date(filterYear, 11, 31, 23, 59, 59, 999); // December 31st of the year
        }

        console.log('product sale filter startDate : ', startDate);
        console.log('product sale filter endDate : ', endDate);

        const topSellingProducts = await Order.aggregate([
            // Match orders with specific statuses
            {
                $match: {
                    orderStatus: { $in: ['Processing', 'Process Completed'] },
                    orderDate: { $gte: startDate, $lte: endDate } // Filter by date range
                }
            },
            // Unwind the orderedItems array to get individual items
            {
                $unwind: '$orderedItems'
            },
            // Filter products by productStatus
            {
                $match: {
                    'orderedItems.productStatus': { $nin: ['Cancelled', 'Returned'] }
                }
            },
            // Group by productRef and calculate the total quantity sold
            {
                $group: {
                    _id: '$orderedItems.code',
                    image: { $first: '$orderedItems.image' }, // Use $first to get the image from the first document in each group
                    totalQuantity: { $sum: '$orderedItems.quantity' },
                    totalSales: { $sum: '$orderedItems.totalPrice' } // Optional: sum the sales
                }
            },
            // Sort by totalQuantity in descending order
            {
                $sort: { totalQuantity: -1 }
            },
            // Limit to top N products
            {
                $limit: limit
            }
        ]);

        return topSellingProducts;

    } catch (error) {
        console.error('Error in getMostSoldProducts :', error.message);
    }
}




// for filtered most sold products-sale-report.
const filterProductSale = async (req, res) => {
    try {
        console.log('query for filtering product sale :', req.query);

        // Fetch the filtered top-selling products
        const filteredTopSellingProducts = await getMostSoldProducts(req, res);
        
        console.log('filteredTopSellingProducts :', filteredTopSellingProducts);

        return res.json({ filteredTopSellingProducts });

        
    } catch (error) {
        console.error('Error fetching filtered top selling products:', error.message);
        res.status(500).json({ errorMessage : 'Internal Server Error :'+ error.message });
    }
};




// payment method wise transaction report
const getPaymentModeReport = async (req, res)=> {
    try {
        const filter = req.query.filter || 'yearly'; // Default to 'yearly' if no filter is provided
        const filterYear = parseInt(req.query.year) || new Date().getFullYear();
        const filterMonth = req.query.month ? parseInt(req.query.month) - 1 : null; // -1 bcoz, Months in JavaScript are 0 index based.
    
        console.log('payment method filter by query : ', filter);
        console.log('payment method filter by year : ', filterYear);
        console.log('payment method filter by month : ', filterMonth);

        // Set the start and end dates based on the filter type
        let startDate, endDate;

        if (filterMonth !== null) {
            startDate = new Date(Date.UTC(filterYear, filterMonth, 1, 0, 0, 0));
            endDate = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59, 999); // End of the selected month

        } else { // 'yearly' or month == null
            startDate = new Date(filterYear, 0, 1, 0, 0, 0); // January 1st of the year
            endDate = new Date(filterYear, 11, 31, 23, 59, 59, 999); // December 31st of the year
        }

        console.log('product sale filter startDate : ', startDate);
        console.log('product sale filter endDate : ', endDate);


        const paymentModeReport = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $nin: ['Pending', 'Failed'] }, //  orderStatus is not 'Pending' nor 'Failed'
                    orderDate: { $gte: startDate, $lte: endDate } // Filter by date range
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    netAmount: { $sum: '$netAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                // Sorting the results in descending order
                $sort: { netAmount: -1 }
            },
            {
                // Optionally, rename _id to paymentMethod for clarity in the output
                $project: {
                    _id: 0,
                    paymentMethod: '$_id',
                    netAmount: 1,
                    orderCount: 1
                }
            }
        ]);

        let totalPaymentCount = 0;
        let totalPaymentAmount = 0;

        paymentModeReport.forEach((txn)=>{
            totalPaymentCount += txn.orderCount;
            totalPaymentAmount += txn.netAmount;
        });

        return {
            paymentModeReport,
            totalPaymentCount,
            totalPaymentAmount
        };


    } catch (error) {
        console.error('Error fetching payment report :', error.message);
    }
}




const filterPaymentModeReport = async (req, res) => {
    try {
        console.log('query for filtering payment method report :', req.query);

        // Fetch the filtered payment method report
        const filteredPaymentModeReport = await getPaymentModeReport(req, res);
        const {
            paymentModeReport,
            totalPaymentCount,
            totalPaymentAmount
        } = filteredPaymentModeReport;

        console.log('filteredPaymentModeReport :', filteredPaymentModeReport);

        return res.json(
            {
                paymentModeReport, totalPaymentCount, totalPaymentAmount 
            }
        );


    } catch (error) {
        console.error('Error fetching payment data :', error.message);
        res.status(500).json({ errorMessage : 'Internal Server Error :'+ error.message });
    }
};






// show / render (if needed) the sales report & summary (from getOrderList & getOrderSummary)
const loadSalesReport = async (req, res)=>{
    try {
        const sessionId = req.session.adminId;
        const adminData = await User.findOne({_id: sessionId});
        const goldPriceData = await GoldPrice.findOne({});


        // fetch orderlist and result from getOrderList
        const orderList = await getOrderList(req, res);
        const {
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,
        } = orderList;

        
        // fetch different types of orderSummary from getorderSummary
        const orderSummary = await getOrderSummary(req, res);
        const {
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        } = orderSummary;


        res.render("salesReport", {
            adminData,
            goldPriceData,

            // from oderLlst
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,

            // from orderSummary
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        });
        
    } catch (error) {
        console.log('error while loading the sales-report page :', error.message);
    }
}



// download sales report in PDF
const salesReportPdf = async(req, res)=>{
    try {
        // fetch orderlist and result from getOrderList
        const orderList = await getOrderList(req, res);
        const {
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,
        } = orderList;

        
        // fetch different types of orderSummary from getorderSummary
        const orderSummary = await getOrderSummary(req, res);
        const {
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        } = orderSummary;


    
        // Path to the EJS template
        const ejsFilePath = path.join(__dirname, '../views/admin/salesReport.ejs');
        const htmlString = fs.readFileSync(ejsFilePath, 'utf8');

        // Render the EJS template with data
        const htmlPageContent = ejs.render(htmlString, {
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,
            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        });



        // Launch Puppeteer browser instance
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set the content to the page
        // await page.setContent(htmlPageContent, { waitUntil: 'networkidle0' });
        await page.setContent(htmlPageContent);

        // const pdfBuffer = await page.pdf();

        // Generate the PDF & page style and layout
        const pdfBuffer = await page.pdf({
            // format: 'A4',
            width: '1200px', // Increase the width to fit all columns
            height: '842px', // Use height similar to A4
            landscape: true, // Set landscape mode for horizontal layout
            scale: 0.6, // Adjust scale to reduce size
            // printBackground: true, // Include background graphics
            margin: {
            // top: '20px',
            // right: '20px',
            // bottom: '20px',
            // left: '20px'
            },
            // Adjust quality to reduce size (lower quality results in smaller file size)
            quality: 10,
            dpi: 150,
            compress: true,
            timeout: 20000
        });



        // Compress the PDF
        const compressedBuffer = await new Promise((resolve, reject) => {
            zlib.gzip(pdfBuffer, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        

        await browser.close();

        // Set headers to send the PDF as a downloadable file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report.pdf"`);
        res.send(compressedBuffer);



    } catch (error) {
        console.log('error in salesReportPdf :', error.message);
        // res.status(500).render('500');
        res.status(500).send('Error generating PDF');
    }
}



// download sales report in Excel
const salesReportExcel = async(req, res)=>{
    try {
        // fetch orderlist and result from getOrderList
        const orderList = await getOrderList(req, res);
        const {
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            startDate,
            endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,
        } = orderList;

        
        // fetch different types of orderSummary from getorderSummary
        const orderSummary = await getOrderSummary(req, res);
        const {
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        } = orderSummary;



        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        
        const orderListWorksheet = workbook.addWorksheet('Sales Report');

        // Define the columns for the orderListWorksheet
        orderListWorksheet.columns = [
            { header: 'SL NO', key: 'slNo', width: 5 },
            { header: 'ORDER NO', key: 'orderNo', width: 25 },
            { header: 'ORDER DATE', key: 'orderDate', width: 15 },
            { header: 'CUSTOMER DETAIL', key: 'customerDetail', width: 30 },
            { header: 'TOTAL AMOUNT', key: 'totalAmount', width: 15 },
            { header: 'OFFER DISCOUNT', key: 'offerDiscount', width: 15 },
            { header: 'COUPON DISCOUNT', key: 'couponDiscount', width: 15 },
            { header: 'SPECIAL DISCOUNT', key: 'specialDiscount', width: 15 },
            { header: 'NET AMOUNT', key: 'netAmount', width: 15 },
            { header: 'PAYMENT MODE', key: 'paymentMode', width: 20 },
            { header: 'ORDER STATUS', key: 'orderStatus', width: 20 }
        ];

        // add columns for the orderListWorksheet.
        orderData.forEach((order, index) => {
            let orderOfferDiscount = 0;
            for (item of order.orderedItems) {
                let itemOfferAmount = 0;
                itemOfferAmount += (item.offerDiscount ? item.offerDiscount : 0);
                itemQuantity = item.quantity;
                orderOfferDiscount += (itemOfferAmount * itemQuantity);
            }

            orderListWorksheet.addRow({
                slNo: index + 1,
                orderNo: order.orderNo,
                orderDate: order.orderDate.toLocaleDateString('en-GB'),
                customerDetail: order.userRef.email,
                totalAmount: order.subTotal,
                offerDiscount: orderOfferDiscount,
                couponDiscount: order.couponDiscount ? order.couponDiscount : 0,
                specialDiscount: order.specialDiscount ? order.specialDiscount : 0,
                netAmount: order.netAmount,
                paymentMode: order.paymentMethod,
                orderStatus: order.orderStatus
            });
        });


        const orderSummaryWorksheet = workbook.addWorksheet('Order Summary');

        // define columns for the orderSummaryWorksheet
        orderSummaryWorksheet.columns = [
            { header: 'FIELD', key: 'field', width: 25 },
            { header: 'VALUE', key: 'value', width: 15 },
        ];


        // add rows for the orderSummaryWorksheet
        orderSummaryWorksheet.addRow(['Total Sale Amount', totalAmount]);
        orderSummaryWorksheet.addRow(['Offer Discount', totalOfferDiscount]);
        orderSummaryWorksheet.addRow(['Total Coupon Discount', totalCouponDiscount]);
        orderSummaryWorksheet.addRow(['Total Special Discount', totalSpecialDiscount]);
        orderSummaryWorksheet.addRow(['Net Income', totalNetAmount]);
        orderSummaryWorksheet.addRow(['Pending Receivables', pendingReceivables]);

        orderSummaryWorksheet.addRow(['Delivery Pendings', deliveryPendings]);
        orderSummaryWorksheet.addRow(['Shipment Pendings', shipmentPendings]);
        orderSummaryWorksheet.addRow(['Cancelled Count', cancelledCount]);
        orderSummaryWorksheet.addRow(['Delivered Count', deliveredCount]);
        orderSummaryWorksheet.addRow(['Returned Count', returnedCount]);
        orderSummaryWorksheet.addRow(['Return Requests', returnRequests]);


        // APPLYING THE STYLE FOR THE EXCEL COLUMNS / HEADING.
        applyCellStyle(orderListWorksheet);
        // applyDataRowStyle(orderListWorksheet);
        applyCellStyle(orderSummaryWorksheet);
        // applyDataRowStyle(orderSummaryWorksheet);


        const buffer = await workbook.xlsx.writeBuffer();


        // Set response headers to send the Excel file as a downloadable attachment
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

        // Write the Excel workbook to the response
        // await workbook.xlsx.write(res);
        res.send(buffer);


    } catch (error) {
        console.log('error in salesReportExcel :', error.message);
        res.status(500).render('500', { errorMessage : error.message });
    }
}



// for applying the style for the excel columns & rows.
const applyCellStyle = (worksheet) => {
    
    // for the header row (first row)
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = {
            name: 'Trebuchet MS',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFF' },  // font color (white)
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF9A0056' } // Background color: #9a0056
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' }; // Center the text
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // for the data row (remaining rows)
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > 1) { // Exclude the header row
            row.eachCell((cell) => {
                cell.font = {
                    name: 'Trebuchet MS',
                    size: 11,
                    bold: false,
                    color: { argb: 'FF000000' }
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' } // Very light grey background color
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left' }; // Align text to the left
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        }
    });

};





// load admin dashboard ------------------------------------------
const loadAdminDashboard = async (req, res)=>{
    try {
        const sessionId = req.session.adminId;

        const adminData = await User.findOne({_id: sessionId});
        const goldPriceData = await GoldPrice.findOne({});

        // fetch orderlist and result from getOrderList
        const orderList = await getOrderList(req, res);
        const {
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            // startDate,
            // endDate,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,
        } = orderList;

        
        // fetch different types of orderSummary from getorderSummary
        const orderSummary = await getOrderSummary(req, res);
        const {
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,
        } = orderSummary;


        const categorySaleReport = await getCategoryWiseSaleReport(req, res);
        const {
            categoryWiseSalesReport = [], // Default to empty array if undefined
            totalSaleAmount = 0,          // Default to 0 if undefined
            totalSaleQuantity = 0         // Default to 0 if undefined
        } = categorySaleReport || {}; // Default to empty object if undefined
        
        
        const topSellingProducts = await getMostSoldProducts(req, res);


        const paymentModeWiseReport = await getPaymentModeReport(req, res);
        const {
            paymentModeReport,
            totalPaymentCount,
            totalPaymentAmount
        } = paymentModeWiseReport;

        console.log('paymentModeReport for dashboard :', paymentModeReport);


        res.render("adminDashboard", {
            adminData,
            goldPriceData,

            // from oderLlst
            orderData,
            searchQuery,
            statusQuery,
            methodQuery,
            sortQuery,
            count,
            limit,
            totalPages,
            currentPage,
            startIndex,
            endIndex,

            // from orderSummary
            totalAmount,
            totalOfferDiscount,
            totalCouponDiscount,
            totalSpecialDiscount,
            totalNetAmount,
            pendingReceivables,

            shipmentPendings,
            deliveryPendings,
            cancelledCount,
            deliveredCount,
            returnedCount,
            returnRequests,

            // from categorySaleReport
            categoryWiseSalesReport,
            totalSaleAmount,
            totalSaleQuantity,

            // from topSellingProducts
            topSellingProducts,

            // from paymentModeWiseReport
            paymentModeReport,
            totalPaymentCount,
            totalPaymentAmount

        });
        


    } catch (error) {
        console.log('error in loading admin dashboard', error.message);
        return res.render('500', {errorMessage : error.message});
    }
}










module.exports = {
    loadAdminDashboard,
    filterCategorySale,
    filterProductSale,
    filterPaymentModeReport,

    loadSalesReport,
    salesReportPdf,
    salesReportExcel,
}