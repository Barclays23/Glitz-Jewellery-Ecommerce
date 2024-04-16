const express = require ('express');
const nocache = require ('nocache');

const config = require('./config/config');

require('dotenv').config();


const app = express();

app.use(nocache());

app.use(express.static('public'));

// app.use(session({
//     secret: process.env.sessionSecret,
//     saveUninitialized: true,
//     resave: false
// }));


// for user routes
const userRoute = require('./routes/userRoutes');
app.use('/', userRoute);


// for admin routes
// const adminRoute = require('./routes/adminRoutes');
// app.use('/admin', adminRoute);


app.listen(3000, ()=>{
    console.log('server is running on http://localhost:3000');
});


