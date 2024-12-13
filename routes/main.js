const express = require("express");
const router = express.Router();

router.get("/home", function (req, res, next) {
  const userId = req.session.userId;
  res.render("index.ejs", { userId: userId });
});

router.get("/about", function (req, res, next) {
  res.render("about.ejs");
});

function redirectLogin(req, res, next) {
  if (!req.session.userId) {
    //session stores userId when logged in
    res.redirect("/users/login"); //redirect to login if not authenticated
  } else {
    next();
  }
}

router.get("/logout", redirectLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/home");
    }
    res.send("you are now logged out. <a href=" + "./" + ">Home</a>");
  });
});

module.exports = router;
