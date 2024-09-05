const express = require ('express');
const nocache = require ('nocache');




const config = require('./config/config');

require('dotenv').config();

const app = express();

app.use(nocache());

app.use(express.static('public'));


// cron job functions
const cron = require('node-cron');
const {getGoldRateFromAPI} = require('./controllers/goldRateController');
const {pendingOrdersManaging} = require('./controllers/orderController');
getGoldRateFromAPI();
pendingOrdersManaging();



// for admin routes
const adminRoute = require('./routes/adminRoutes');
app.use('/admin', adminRoute);


// for user routes
const userRoute = require('./routes/userRoutes');
app.use('/', userRoute);





const port = process.env.PORT;

app.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`);

});


