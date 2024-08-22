const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require ('../models/userModel');
const config = require('../config/config');



passport.use(new GoogleStrategy({
      clientID: process.env.googleClientId,
      clientSecret: process.env.googleClientSecret,
      callbackURL: "http://localhost:3000/auth/google/callback",
      // callbackURL: "/auth/google/callback"
      // callbackURL: process.env.NODE_ENV === 'production' ?
      // "https://www.your-ecommerce-site.com/auth/google/callback" :
      // "http://localhost:3000/auth/google/callback"
   },
   
   async (accessToken, refreshToken, profile, cb) => {
      try {
         console.log("profile information from googleAuth : ", profile);
  
         const existingUserData = await User.findOne({ email: profile.emails[0].value });
         console.log('existing userData :', existingUserData);

         let userData = '';

         if (existingUserData) {
            // Update existing user with Google profile data
            const updatedData = await User.updateOne({email: existingUserData.email}, {
               $set: {
                  'googleAccount.googleId': profile.id,
                  'googleAccount.displayName': profile.displayName,
                  'googleAccount.firstname': profile.name.givenName,
                  'googleAccount.lastname': profile.name.familyName,
                  'googleAccount.googlePhoto': profile.photos[0].value, //only change googlePhoto (bcoz google account data can be changed any time)
                  isVerified: 1
              }
            });
            console.log('userData is updated :', updatedData);
            userData = existingUserData;

         } else {
            // Create a new user with Google profile data
            const newUserData = await User.create({
               'googleAccount.googleId': profile.id,
               // 'googleAccount.email': profile.emails[0].value,
               'googleAccount.displayName': profile.displayName,
               'googleAccount.firstname': profile.name.givenName,
               'googleAccount.lastname': profile.name.familyName,
               'googleAccount.googlePhoto': profile.photos[0].value,

               firstname : profile.name.givenName,
               lastname : profile.name.familyName,
               email : profile.emails[0].value,
               // photo: profile.photos[0].value,
               // mobile : req.body.userMobile,
               // password : securedPass,
               isBlocked : false,
               isVerified: 1,
               isAdmin : 0,
            });

            userData = newUserData;
            
         }
  
         return cb(null, userData);
         
      } catch (err) {
         return cb(err);
      }
   }
   
));


// Serialize user into the session
passport.serializeUser(function(user, done) {
   done(null, user.id);
});

 // Deserialize user from the session
passport.deserializeUser(async function(id, done) {
   try {
     const user = await User.findById(id);
     done(null, user);
   }
   catch (err) {
     done(err, null);
   }
});


module.exports = passport;