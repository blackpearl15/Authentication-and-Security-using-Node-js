
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.API);

const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user,done){
  done(null,user);
});
passport.deserializeUser(function(user,done){
  done(null,user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));


app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/logout",function(req,res){
    req.logout(function(err){
      if(err)
       console.log(err);
       else
       res.redirect("/");
    });

});

app.get("/secrets",function(req,res){
   if(req.isAuthenticated()){
     res.render("secrets");
   }
   else{
     res.render("/login");
   }
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.render("/login");
  }
});

app.post("/submit",function(req,res){

    const submittedSceret = req.body.secret;

    console.log(req.body._id);

    User.findOne(req.user._id,function(err,foundUser){
      if(err){
        console.log(err);
      }
      else{
        if(foundUser){
          foundUser.secret = submittedSceret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
});

app.post("/register",function(req,res){

    User.register({username : req.body.username},req.body.password,function(err,user){
      if(err){
        console.log(err);
        res.redirect("/");
      }
      else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    });
});

app.post("/login",function(req,res){

     const user = new User({
       email : req.body.username,
       password : req.body.password
     });

     req.login(user,function(err){
       if(err){
         console.log(err);
       }
       else{
         passport.authenticate("local")(req,res,function(){
           res.redirect("/secrets");
         });
       }
     });

});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
