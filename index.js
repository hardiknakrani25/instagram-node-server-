const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const passport = require("passport");
const passportJWT = require("passport-jwt");

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = "wowwow";

// lets create our strategy for web token
let strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log("payload received", jwt_payload);
  let user = getUser({ id: jwt_payload.id });

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});
// use the strategy
passport.use(strategy);

const app = express();
// initialize passport with express
app.use(passport.initialize());

// parse application/json
app.use(bodyParser.json());
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const Sequelize = require("sequelize");

// initialze an instance of Sequelize
const sequelize = new Sequelize({
  database: "users_db",
  username: "root",
  password: "",
  dialect: "mysql"
});

// check the databse connection
sequelize
  .authenticate()
  .then(() => console.log("Connection has been established successfully."))
  .catch(err => console.error("Unable to connect to the database:", err));

// create user model
const User = sequelize.define("user", {
  email: {
    type: Sequelize.STRING
  },
  fullname: {
    type: Sequelize.STRING
  },
  username: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  }
});

// create table with user model
User.sync()
  .then(() => console.log("User table created successfully"))
  .catch(err => console.log("oooh, did you enter wrong database credentials?"));

// create some helper functions to work on the database
const createUser = async ({ email, fullname, username, password }) => {
  return await User.create({ email, fullname, username, password });
};

const getAllUsers = async () => {
  return await User.findAll();
};

const getUser = async obj => {
  return await User.findOne({
    where: obj
  });
};

// set some basic routes
app.get("/", function(req, res) {
  res.json({ message: "Express is up!" });
});

// get all users
app.get("/users", function(req, res) {
  getAllUsers().then(user => res.json(user));
});

// register route
app.post("/register", function(req, res, next) {
  const { email, fullname, username, password } = req.body;
  getUser({ email }).then(user => {
    if (user) {
      res.status(401).json({ message: "User Already exsist" });
    } else {
      createUser({ email, fullname, username, password }).then(user =>
        res.json({ user, msg: "account created successfully" })
      );
    }
  });
});

//login route
app.post("/login", async function(req, res, next) {
  const { email, password } = req.body;
  if (email && password) {
    let user = await getUser({ email });
    if (!user) {
      res.status(401).json({ msg: "No such user found" });
    }
    if (user.password === password) {
      // from now on we'll identify the user by the id and the id is the
      // only personalized value that goes into our token
      let payload = { id: user.id };
      let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ msg: "ok", token: token });
    } else {
      res.status(401).json({ msg: "Password is incorrect" });
    }
  }
});

// protected route
app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  function(req, res) {
    res
      .status(200)
      .json({ msg: "Success! You can now see this without a token." });
  }
);

// start app
app.listen(3000, function() {
  console.log("Express is running on port 3000");
});
