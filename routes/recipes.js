const express = require("express");
const router = express.Router();
const axios = require("axios");

require("dotenv").config();
const appId = process.env.EDAMAM_APP_ID;
const appKey = process.env.EDAMAM_APP_KEY;

const { check, validationResult } = require("express-validator");

function redirectLogin(req, res, next) {
  if (!req.session.userId) {
    //session stores user id when logged in
    res.redirect("/users/login"); //go to login if not authenticated
  } else {
    next();
  }
}

router.get("/search", redirectLogin, function (req, res, next) {
  res.render("search.ejs");
});

router.get(
  "/search_recipe",
  redirectLogin,
  [check("search_recipe").optional().isLength({ max: 50 })],
  function (req, res, next) {
    req.body.search_recipe = req.sanitize(req.body.search_recipe);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid search parameters");
    }

    const { search_recipe } = req.query;

    // search the database
    let sqlquery = "SELECT * FROM recipes WHERE 1=1";
    let queryParameters = [];

    //conditions based on search input
    if (search_recipe) {
      sqlquery += " AND name LIKE ?";
      queryParameters.push(`%${search_recipe}%`);
    }
    //sql query
    db.query(sqlquery, queryParameters, (err, result) => {
      if (err) {
        next(err);
      }

      if (result.length === 0) {
        //case where no results were found
        res.render("list.ejs", {
          availableRecipes: [],
          message: "No recipes found",
        });
      } else {
        //show the results
        res.render("list.ejs", { availableRecipes: result });
      }
    });
  }
);

router.get(
  "/search_ingredients",
  redirectLogin,
  [check("search_ingredients").optional().isLength({ max: 255 })],
  function (req, res, next) {
    req.body.search_ingredients = req.sanitize(req.body.search_ingredients);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Invalid search parameters");
    }

    const { search_ingredients } = req.query;

    // search the database
    let sqlquery = "SELECT * FROM recipes WHERE 1=1";
    let queryParameters = [];

    if (search_ingredients) {
      //split ingredients by commas and trim extra spaces
      const ingredientsList = search_ingredients
        .split(",")
        .map((ingredient) => ingredient.trim());

      //loop through ingredients and add a LIKE condition
      ingredientsList.forEach((ingredient) => {
        sqlquery += " AND ingredients LIKE ?";
        queryParameters.push(`%${ingredient}%`);
      });
    }

    //sql query
    db.query(sqlquery, queryParameters, (err, result) => {
      if (err) {
        next(err);
      }

      if (result.length === 0) {
        //case where no results were found
        res.render("list.ejs", {
          availableRecipes: [],
          message: "No recipes found",
        });
      } else {
        //show results
        res.render("list.ejs", { availableRecipes: result });
      }
    });
  }
);

router.get("/list", redirectLogin, function (req, res, next) {
  //get list of recipes and usernames of those that uploaded them
  let sqlquery =
    "SELECT recipes.*, users.username FROM recipes JOIN users ON recipes.user_id = users.id";

  db.query(sqlquery, (err, result) => {
    if (err) {
      next(err);
    }
    res.render("list.ejs", { availableRecipes: result });
  });
});

router.get("/addrecipe", redirectLogin, function (req, res, next) {
  res.render("addrecipe.ejs");
});

router.post(
  "/recipeadded",
  [
    check("name")
      .notEmpty()
      .withMessage("Recipe name is required.")
      .trim()
      .escape(),
    check("description")
      .notEmpty()
      .withMessage("Description is required.")
      .trim()
      .escape(),
    check("cuisine").optional().trim().escape(),
    check("ingredients")
      .notEmpty()
      .withMessage("Ingredients are required.")
      .trim()
      .escape(),
    check("instructions")
      .notEmpty()
      .withMessage("Instructions are required.")
      .trim()
      .escape(),
  ],
  function (req, res, next) {
    req.body.name = req.sanitize(req.body.name);
    req.body.description = req.sanitize(req.body.description);
    req.body.cuisine = req.sanitize(req.body.cuisine);
    req.body.ingredients = req.sanitize(req.body.ingredients);
    req.body.instructions = req.sanitize(req.body.instructions);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      //if form errors, render again with error messages
      return res.render("recipeForm.ejs", {
        errors: errors.array(),
      });
    }

    console.log("Session Data:", req.session);

    if (!req.session.userId) {
      return res.status(400).send("User not logged in.");
    }

    const userId = req.session.userId;

    // saving data into database
    let sqlquery =
      "INSERT INTO recipes (name, description, cuisine_type, ingredients, instructions, user_id) VALUES (?,?,?,?,?,?)";
    //sql query
    let newrecord = [
      req.body.name,
      req.body.description,
      req.body.cuisine_type,
      req.body.ingredients,
      req.body.instructions,
      userId,
    ];

    db.query(sqlquery, newrecord, (err, result) => {
      if (err) {
        next(err);
      } else
        res.send(
          " This recipe has been added to the database." + req.body.name
        );
    });
  }
);

router.get("/:id", redirectLogin, async function (req, res, next) {
  const recipeId = req.params.id; //get recipe id from URL

  //find the recipe with the id
  let sqlquery = "SELECT * FROM recipes WHERE id = ?";
  db.query(sqlquery, [recipeId], async (err, result) => {
    if (err) {
      return next(err);
    }

    if (result.length === 0) {
      return res.status(404).send("Recipe not found.");
    }

    const recipe = result[0]; //get the recipe data
    const ingredients = recipe.ingredients; //get ingredients from  recipe

    //prepare request data for api
    const edamamUrl = `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`;
    const requestData = {
      title: recipe.name,
      ingr: ingredients.split("\n"),
    };

    try {
      //make api call to get nutrition data
      const response = await axios.post(edamamUrl, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      //recipe page with recipe and nutrition data
      res.render("recipe.ejs", { recipe, nutrition: response.data });
    } catch (apiError) {
      console.error(
        "Error calling Edamam API:",
        apiError.response?.data || apiError.message
      );

      //recipe page with recipe data but no nutrition data
      res.render("recipe.ejs", { recipe, nutrition: null });
    }
  });
});

module.exports = router;
