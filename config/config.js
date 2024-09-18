const mongoose = require('mongoose');
// const connectDB = mongoose.connect('mongodb://127.0.0.1:27017/glitz_jewellery');


const connectDB = async () => {
    try {
      await mongoose.connect('mongodb+srv://itsmesajeer:IuUIUVs8ij3ZgYmi@glitzjewellerydb.9nk5o.mongodb.net/glitz_jewellery?retryWrites=true&w=majority&appName=GlitzJewelleryDB')
      console.log('Connected to MongoDB Atlas');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
    }
  };





module.exports = {
    connectDB,
}