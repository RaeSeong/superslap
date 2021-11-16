const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/User");

const dotenv = require("dotenv");
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      console.log("profile: ", profile);
      User.findOne({ id: profile.email, type: "google" }).then(
        (existingUser) => {
          if (existingUser) {
            done(null, existingUser);
          } else {
            new User({
              id: profile.email,
              name: profile.displayName,
              type: profile.provider,
            })
              .save()
              .then((user) => {
                done(null, user);
              });
          }
        }
      );
    }
  )
);

module.exports = passport;