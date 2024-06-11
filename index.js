const express = require ('express');
const nocache = require ('nocache');
// const session = require('express-session');
// const passport = require('passport');



const cron = require('node-cron');
const {getGoldRate} = require('./controllers/goldRateController');


const config = require('./config/config');

require('dotenv').config();

const app = express();

app.use(nocache());

app.use(express.static('public'));

getGoldRate();

// app.use(session({
//     secret: process.env.sessionSecret,
//     saveUninitialized: true,
//     resave: false,
//     cookie: { secure: false } // Note: In production (google Auth), set secure: true if using HTTPS
// }));


// require('./middlewares/googleAuth');
// Initialize Passport and restore authentication state, if any, from the session
// app.use(passport.initialize());
// app.use(passport.session());



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


