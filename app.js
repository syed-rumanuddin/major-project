if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path=require("path");
const { render } = require("ejs");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js")
const listingsRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore=require("connect-mongo")
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

//const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
const MONGO_ATLAS_URL=process.env.ATLASDB_URL;
async function main(){
    await mongoose.connect (MONGO_ATLAS_URL);
}

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    })

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
const methodoverride = require("method-override");
const cookie = require("express-session/session/cookie.js");
app.use(methodoverride("_method"));

const store=MongoStore.create({
    mongoUrl:MONGO_ATLAS_URL,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
} );

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
})

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie :{
        expires : Date.now() + 1000*60*60*24*7,
        maxAge : 1000*60*60*24*7,
        httpOnly : true,
    }
}

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found")) 
})

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Some Error Occurred"}=err;
    console.log("There is a some error");
    res.status(statusCode).render("error.ejs",{message});
})

app.listen(8080,()=>{
    console.log("server is listening at port 8080");
})