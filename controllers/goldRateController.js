const GoldPrice = require('../models/goldPriceModel');
const Product = require('../models/productModel');

const axios = require('axios');

const cron = require('node-cron');
const moment = require('moment-timezone');









// manually update gold rate (manually)-----------------------------------------
const updateGoldRateManually = async(req, res)=>{
    try {
        const gramRate = req.body.goldRate;
        console.log('requested gold rate : ', gramRate);

        if(gramRate){
            const updatedManualGoldPriceData = await GoldPrice.findOneAndUpdate({}, {$set: {price: gramRate}}, { upsert: true, new: true });
            console.log('updatedManualGoldPriceData : ', updatedManualGoldPriceData);
            
            if(updatedManualGoldPriceData){
                const productData = await Product.find({});
            
                // also updating each product's price details based on updated gold rate
                for(i=0; i < productData.length; i++){
                    const productId = productData[i]._id;
                    
                    const metalPrice = productData[i].netWeight * updatedManualGoldPriceData.price;
                    // console.log('metalPrice : ', metalPrice);
                    const makingCharge = metalPrice * productData[i].VA /100;
                    // console.log('makingCharge : ', makingCharge);
                    const stoneCharge = productData[i].stoneCharge;
                    // console.log('stoneCharge : ', stoneCharge);
                    const GST = (metalPrice + makingCharge + stoneCharge) * 3/100;
                    // console.log('GST : ', GST);
                    const totalPrice = metalPrice + makingCharge + stoneCharge + GST;
                    console.log('totalPrice :', totalPrice);
    
                    const updatedProductPriceData = await Product.findByIdAndUpdate(
                        { _id: productId },
                        { $set: {
                            metalPrice : metalPrice,
                            makingCharge : makingCharge,
                            stoneCharge : stoneCharge,
                            GST : GST,
                            totalPrice : totalPrice,
                        },
                        },
                        { new : true }
                    );
                    
                    console.log('updated the price of ',productData[0].code);
    
                }
    
                // console.log('updated the price details of each products');
                return res.json({success: true});
            }
            
        }
        

    } catch (error) {
        console.log('failed to update gold rate manually :', error.message);
    }
}




// cron job gold rate API call function
const getGoldRateFromAPI = async(req, res)=>{

    // to get the price from API immediately (turn on this)
    // updateGoldRateWithAPIs();

    // to get the price from API at cron job specified time.
    console.log('getGoldRateFromAPI(); will execute at 10:30 am india.');

    cron.schedule('0 30 10 * * *', () => {
        console.log('Running a job at 10:30 AM IST');
        updateGoldRateWithAPIs();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

};




// update the API gold rate in database -----------------------------------------
const updateGoldRateWithAPIs = async(req, res)=>{
    try {
        // const gramRate = 7000; // for testing
        // const gramRate = await rapidApiGoldRate1(); // Method 1 - gold rate from rapidApiGoldRate1
        const gramRate = await rapidApiGoldRate2(); // Method 2 - gold rate from rapidApiGoldRate2
        console.log('gold rate from API : ', gramRate);
        
        if(gramRate){
            const updatedAPIGoldPriceData = await GoldPrice.findOneAndUpdate({}, {$set: {price: gramRate}}, { upsert: true, new: true });
            console.log('updatedAPIGoldPriceData : ', updatedAPIGoldPriceData);

            if(updatedAPIGoldPriceData){
                const productData = await Product.find({});
            
                // updating each products price details based on API updated gold rate
                for(i=0; i < productData.length; i++){
                    const productId = productData[0]._id;
                    
                    const metalPrice = productData[0].netWeight * updatedAPIGoldPriceData.price;
                    // console.log('metalPrice : ', metalPrice);
                    const makingCharge = metalPrice * productData[0].VA /100;
                    // console.log('makingCharge : ', makingCharge);
                    const stoneCharge = productData[0].stoneCharge;
                    // console.log('stoneCharge : ', stoneCharge);
                    const GST = (metalPrice + makingCharge + stoneCharge) * 3/100;
                    // console.log('GST : ', GST);
                    const totalPrice = metalPrice + makingCharge + stoneCharge + GST;
                    console.log('totalPrice : ', totalPrice);
                    
                    const updatedProductPriceData = await Product.findByIdAndUpdate(
                    { _id: productId },
                    { $set: {
                        metalPrice : metalPrice,
                        makingCharge : makingCharge,
                        stoneCharge : stoneCharge,
                        GST : GST,
                        totalPrice : totalPrice,
                        },
                    },
                    { new : true }
                    );

                    console.log('updated the price of ',productData[0].code);
    
                }
    
                // console.log('updated the price details of each products');
            }

        }


    } catch (error) {
        console.log('error in gettig the gold rate from API: ', error);
    }
}




// Get gold rate from rapid API (Method 1) ---------------- gold-rates-india.p.rapidapi.com
const rapidApiGoldRate1 = async()=>{
    try {
        const options = {
            method: 'GET',
            url: 'https://gold-rates-india.p.rapidapi.com/api/gold-rates', //Link 1 - Limit 20/month
            // url: 'https://gold-rates-india.p.rapidapi.com/api/state-gold-rates', //Link 2 - Limit 300/month
            headers: {
              'X-RapidAPI-Key': '42b6aa1f64mshce6165021e64bdep1239ccjsnd8cc0d341067',
              'X-RapidAPI-Host': 'gold-rates-india.p.rapidapi.com'
            }
        };
        
        const response = await axios.request(options);
        // console.log('response data of all states :', response.data.GoldRate);
        // console.log('response data of Mumbai :', response.data.GoldRate[20]);
        console.log('response data of Kerala :', response.data.GoldRate[18]);

        const tenGramRate = response.data.GoldRate[18].TenGram22K;
        console.log('22K 10gm rate: ', tenGramRate);

        const perGramRate = tenGramRate/10;
        console.log('per gram rate: ', perGramRate);
        return perGramRate;
    
    } catch (error) {
        console.log(error);
    }
}



// Get gold rate from rapid API (Method 2) ---------------- world-gold-price-live-api.p.rapidapi.com  Limit 5000/month
const rapidApiGoldRate2 = async() => {
    try {
        const options = {
            method: 'GET',
            url: 'https://world-gold-price-live-api.p.rapidapi.com/api/World-Gold-Rates/',  // Limit 5000/month
            params: { country: 'in' }, // in for india
            headers: {
                'x-rapidapi-key': '42b6aa1f64mshce6165021e64bdep1239ccjsnd8cc0d341067',
                'x-rapidapi-host': 'world-gold-price-live-api.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        // console.log('response data of all states :', response);
        console.log('ounce price (string) :', response.data.gold_price);

        // Remove commas and convert the string to a float
        const ouncePriceString = response.data.gold_price.replace(/,/g, '');
        const ouncePrice = parseFloat(ouncePriceString);
        
        console.log('ounce price (number) :', ouncePrice);
        
        // Check if the conversion was successful
        if (isNaN(ouncePrice)) {
            throw new Error('Failed to convert ounce price to a number');
        }

        const convertedPerGramRate = ouncePrice / 31.1034768;
        console.log('converted to gram rate from ounce price :', convertedPerGramRate);

        const additionalCharges = convertedPerGramRate * 6.11 / 100;
        console.log('additionalCharges (6.11%) : ', additionalCharges);
        const marketPrice = Math.round(convertedPerGramRate + additionalCharges);
        console.log('marketPrice : ', marketPrice);

        return marketPrice;

    } catch (error) {
        console.log(error);
    }
}






module.exports = {
    updateGoldRateManually,
    getGoldRateFromAPI,
}