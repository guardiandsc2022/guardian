if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// packages

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const request = require("request");
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const users = [];
const fields = [];

app.set("view-engine", "ejs");
app.use(express.static(__dirname + "/images"));
app.use(express.static(__dirname + "/css"));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

/* *********************************************** HOMEPAGE *********************************************** */

/* SHOWS HOMEPAGE */
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { field: fields });
});

/* SHOWS FORM PAGE */
app.get("/form", checkAuthenticated, (req, res) => {
  res.render("form.ejs", { name: req.user.name });
});

/* RETRIEVES DATA FROM FORM PAGE AND REDIRECTS TO HOMEPAGE */
app.post("/form", checkAuthenticated, async (req, res) => {
  fields.push({
    med: req.body.med,
    contact: req.body.contact,
    time: req.body.time,
  });
  res.redirect("/");

  // if (
  //   req.body.captcha === undefined ||
  //   req.body.captcha === "" ||
  //   req.body.captcha === null
  // ) {
  //   return res.json({ success: false, msg: "Please select captcha" });
  // }

  // // SECRET KEY
  // const secretKey = "6LfW2DMfAAAAAOvorW1SaLE5-z8wKsPJX2SDK9aP";

  // // VERIFY URL
  // const verifyURL = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

  // // MAKE REQUEST TO VERIFYURL
  // request(verifyURL, (err, response, body) => {
  //   body = JSON.parse(body);

  //   // if not successful
  //   if (body.success !== undefined && !body.success) {
  //     return res.json({ success: false, msg: "Failed captcha verification" });
  //   }

  //   // if successful
  //   return res.json({ success: true, msg: "Captcha passed" });
  // });
});

/* *********************************************** LOGIN *********************************************** */

// shows login page
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

// on login page, redirect to home page on success or back to login on failure. shows message if failure
app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

/* *********************************************** REGISTER *********************************************** */

// shows register page
app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

// retrieves data from register page and redirects to login page on success or back to register on failure
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

/* *********************************************** DELETE *********************************************** */

// logout to login page
app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

/* *********************************************** AUTHENTICATION *********************************************** */

// check if user is authenticated. otherwise, redirect to login page
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

// check if user is not authenticated. otherwise, redirect to home page
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(port);
