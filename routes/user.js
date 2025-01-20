const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const {redirectUrl} = require("../middleware.js");
const userController = require("../controllers/user.js");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.singup))

router.route("/login")
    .get(userController.renderLoginForm)
    .post(redirectUrl,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),wrapAsync(userController.login))

router.route("/logout")
    .get(userController.logout);

module.exports = router;