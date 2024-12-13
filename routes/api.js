const express = require("express");
const router = express.Router();

router.get("/recipes", function (req, res, next) {
  const searchTerm = req.query.search_term || "";

  let sqlquery = "SELECT * FROM recipes";

  if (searchTerm) {
    sqlquery += " WHERE ingredients LIKE ?";
  }

  db.query(sqlquery, [`%${searchTerm}%`], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return next(err);
    }

    if (!result || result.length === 0) {
      //no results found return all recipes
      console.log("No matching recipes found, returning all recipes.");
      db.query("SELECT * FROM recipes", [], (fallbackErr, allRecipes) => {
        if (fallbackErr) {
          console.error("Fallback query error:", fallbackErr.message);
          return res.status(500).json({ error: "Internal server error" });
        }
        return res.json(allRecipes);
      });
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
