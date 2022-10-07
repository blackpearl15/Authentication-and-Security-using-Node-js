
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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
  password : String
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user,done){
  done(null,user);
});
passport.deserializeUser(function(user,done){
  done(null,user);
});


app.get("/",function(req,res){
  res.render("home");
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
