const express = require ('express');
const nocache = require ('nocache');


const cron = require('node-cron');
const {getGoldRateFromAPI} = require('./controllers/goldRateController');


const config = require('./config/config');

require('dotenv').config();

const app = express();

app.use(nocache());

app.use(express.static('public'));

getGoldRateFromAPI();


// for user routes
const userRoute = require('./routes/userRoutes');
app.use('/', userRoute);


// for admin routes
const adminRoute = require('./routes/adminRoutes');
app.use('/admin', adminRoute);



const port = process.env.PORT;

app.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`);

});


