// Create a new router
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const { check, validationResult } = require("express-validator");

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/users/login"); //redirect to the login page
  } else {
    next();
  }
};

router.get("/logout", redirectLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/home");
    }
    res.render("about.ejs");
  });
});

router.get("/register", function (req, res, next) {
  res.render("register.ejs");
});

router.get("/login", function (req, res, next) {
  req.body.username = req.sanitize(req.body.username);
  res.render("login.ejs");
});

router.post(
  "/registered",
  [
    check("email").isEmail(),
    check("first")
      .notEmpty()
      .isAlpha()
      .withMessage("First name should contain alphabets"),
    check("last")
      .notEmpty()
      .isAlpha()
      .withMessage("Last name should contain only alphabets"),
    check("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isLength({ max: 15 })
      .withMessage("Username cannot exceed 15 characters."),
    check("password")
      .isLength({ min: 4, max: 10 })
      .withMessage("Password must be between 4 and 10 characters long."),
  ],
  function (req, res, next) {
    req.body.first = req.sanitize(req.body.first);
    req.body.last = req.sanitize(req.body.last);
    req.body.username = req.sanitize(req.body.username);
    req.body.email = req.sanitize(req.body.email);
    req.body.password = req.sanitize(req.body.password);

    const errors = validationResult(req);
 
    if (!errors.isEmpty()) {
      return res.render("register.ejs", {
        errors: errors.array(), // validation errors
      });
    } else {
      const plainPassword = req.body.password;

      //hash password
      bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .send("Error registering user. Please try again later.");
        }

        //sql query to insert user data into the users table
        let sqlquery = `INSERT INTO users (username, first_name, last_name, email, hashed_password) 
                        VALUES (?, ?, ?, ?, ?)`;

        const values = [
          req.body.username,
          req.body.first,
          req.body.last,
          req.body.email,
          hashedPassword,
        ];

        db.query(sqlquery, values, function (error, results) {
          if (error) {
            console.error(error); 
            return res.status(500).send("Error saving user to database. If an ongoing error change your email, username as they may already be in use."); 
          }

          //successful registration
          console.log(
            `User registered successfully: ${req.body.username}, Email: ${req.body.email}`
          );

          //prepare the result message without exposing plain password
          result = `Hello ${req.body.first} ${req.body.last}, you are now registered! We will send an email to you at ${req.body.email}. `;
          result += `Your hashed password is: ${hashedPassword}`; //display only the hashed password

          // res.send(result); // send response back to the user
          res.render("login.ejs");
        });
      });
    }
  }
);

router.post("/loggedin", function (req, res, next) {
  req.body.username = req.sanitize(req.body.username);
  req.body.password = req.sanitize(req.body.password);

  const username = req.body.username;
  const plainPassword = req.body.password;

  //query to find the user by username
  let sqlquery = `SELECT * FROM users WHERE username = ?`;

  db.query(sqlquery, [username], function (error, results) {
    if (error) {
      console.error(error);
      return res.status(500).send("Error logging in user. Please try again.");
    }

    //check if user exists
    if (results.length === 0) {
      return res.status(401).send("Login failed. Invalid username or password.");
    }

    const user = results[0];

    //check if the account is locked
    const now = new Date();
    if (user.is_locked && user.lock_until && now < new Date(user.lock_until)) {
      return res.status(403).send("Your account is temporarily locked. Please try again later.");
    }

    bcrypt.compare(plainPassword, user.hashed_password, function (err, result) {
      if (err) {
        console.error(err);
        return res.status(500).send("Error logging in user. Please try again.");
      }

      if (result === true) {
        //reset login attempts and unlock the account on successful login
        let resetQuery = `UPDATE users SET login_attempts = 0, is_locked = FALSE, lock_until = NULL WHERE id = ?`;
        db.query(resetQuery, [user.id], function (updateError) {
          if (updateError) {
            console.error(updateError);
            return res.status(500).send("Error resetting login attempts.");
          }

          //save user session
          req.session.userId = user.id;
          return res.render("search.ejs");
        });
      } else {
        // increment login attempts
        const newAttempts = user.login_attempts + 1;

        if (newAttempts >= 3) {
          //lock the account
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 5); // Lock for 5 minutes

          let lockQuery = `UPDATE users SET login_attempts = ?, is_locked = TRUE, lock_until = ? WHERE id = ?`;
          db.query(lockQuery, [newAttempts, lockUntil, user.id], function (lockError) {
            if (lockError) {
              console.error(lockError);
              return res.status(500).send("Error locking the account.");
            }

            return res.status(403).send("Too many failed attempts. Your account is now locked. Please go back and try again in 5 minutes.");
          });
        } else {
          // Update attempts
          let attemptQuery = `UPDATE users SET login_attempts = ? WHERE id = ?`;
          db.query(attemptQuery, [newAttempts, user.id], function (attemptError) {
            if (attemptError) {
              console.error(attemptError);
              return res.status(500).send("Error updating login attempts.");
            }

            return res.status(401).send("Login failed. Invalid username or password. Please go back and try again");
          });
        }
      }
    });
  });
});

module.exports = router;
