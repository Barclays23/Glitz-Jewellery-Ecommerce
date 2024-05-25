const GoldPrice = require('../models/goldPriceModel');

const axios = require('axios');

const cron = require('node-cron');
const moment = require('moment-timezone');









// manually update gold rate -----------------------------------------
const updateGoldRate = async(req, res)=>{
    try {
        const goldRate = req.body.goldRate;
        console.log('requested gold rate : ', goldRate);

        const existPriceData = await GoldPrice.findOne({});
        console.log('existPriceData : ', existPriceData);
        if (!existPriceData) {
            const goldPrice = new GoldPrice({
                price : goldRate
            })

            const goldPriceData = await goldPrice.save();
            console.log('saved goldrate : ', goldPriceData);

            res.json({success: true});

        } else {
            const updatedGoldPriceData = await GoldPrice.findOneAndUpdate({}, {$set: {price: goldRate}}, { new: true });
            console.log('updatedGoldRateData :', updatedGoldPriceData);
            res.json({success: true});
        }
        
    } catch (error) {
        console.log('failed to update gold rate :', error.message);
        res.status(400).json({failed: true, message: "Failed to create new category."});
    }
}





// get gold rate from API --------------------------------------------
// const getGoldRateAFSAL = async(req, res)=>{

//     cron.schedule('0 10 * * *', () => {
//         console.log('Running a task at 10 AM IST');

//         let goldRateToday = 0;

//         async function findRate (){
//             const options = {
//                 method: 'GET',
//                 url: 'https://gold-rates-india.p.rapidapi.com/api/state-gold-rates',
//                 headers: {
//                   'X-RapidAPI-Key': '42b6aa1f64mshce6165021e64bdep1239ccjsnd8cc0d341067',
//                   'X-RapidAPI-Host': 'gold-rates-india.p.rapidapi.com'
//                 }
//               };
              
//               try {
//                 const response = await axios.request(options);
//                 console.log(response.data);
    
//                 goldRateToday = response.data.GoldRate[18].TenGram22K;
//                 return goldRateToday;
        
//               } catch (error) {
//                   console.error(error);
//               }

//         }

//         const aaa = findRate();
//         console.log('aaa is: ', aaa);
//         const goldRateData = GoldPrice.updateOne({_id: {$exists: true}}, {price: goldRateToday});
//         console.log('updated gold price data: ', goldRateData);

//     },{
//         scheduled: true,
//         timezone: "Asia/Kolkata"
//     });

// };



const getGoldRate = async(req, res)=>{

    // updateGoldRateWithAPI();  // for immediate update turn on this.

    console.log('getGoldRate(); will execute at 10:30 am india.');

    cron.schedule('0 30 10 * * *', () => {
        console.log('Running a job at 10:05 AM IST');
        updateGoldRateWithAPI();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

};





const updateGoldRateWithAPI = async(req, res)=>{
    try {
        // const gramRate = 7000;
        const gramRate = await rapidApiGoldRate(); // gold rate from rapidApiGoldRate
        console.log('gold rate from API : ', gramRate);
        
        const goldRateUpdated = await GoldPrice.updateOne({_id: {$exists: true}}, {price: gramRate});
        console.log('goldPriceUpdated : ', goldRateUpdated);

        const goldRateData = await GoldPrice.findOne({});
        console.log('updated gold price : ', goldRateData.price);

    } catch (error) {
        console.log('error in gettig the gold rate from API: ', error);
    }
}




// Method 1: get gold rate from rapid API --------------------------------------------------
const rapidApiGoldRate = async()=>{
    try {
        const options = {
            method: 'GET',
            // url: 'https://gold-rates-india.p.rapidapi.com/api/gold-rates',
            url: 'https://gold-rates-india.p.rapidapi.com/api/state-gold-rates',
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





module.exports = {
    updateGoldRate,
    getGoldRate,

}