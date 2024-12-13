// Import express and ejs
var express = require("express");
var ejs = require("ejs");

var session = require("express-session");
var validator = require("express-validator");

require("dotenv").config();

//Import mysql module
var mysql = require("mysql2");

// Create the express application object
const app = express();
const port = 8000;

const expressSanitizer = require("express-sanitizer");

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs");

// Set up the body parser
app.use(express.urlencoded({ extended: true }));

// Set up public folder (for css and statis js)
app.use(express.static(__dirname + "/public"));

app.use(expressSanitizer());

// Create a session
app.use(
  session({
    secret: "somerandomstuff",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

app.use(express.json());

// Define the database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "rico_recipes_app",
  password: "mary123",
  database: "rico_recipes",
});

// Connect to the database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});
global.db = db;

// Define our application-specific data
app.locals.shopData = { shopName: "Rico Recipes" };

// Load the route handlers
const mainRoutes = require("./routes/main");
app.use("/", mainRoutes);

// Load the route handlers for /users
const usersRoutes = require("./routes/users");
app.use("/users", usersRoutes);

// Load the route handlers for /recipes
const recipesRoutes = require("./routes/recipes");
app.use("/recipes", recipesRoutes);

const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`));
