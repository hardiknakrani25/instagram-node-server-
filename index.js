const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");

const app = express();

//initialize an instance of sequelize

const sequelize = new Sequelize({
  database: "users_db",
  username: "root",
  password: "",
  dialect: "mysql"
});

//check the database connections

sequelize
  .authenticate()
  .then(() => console.log("connection establish successfully"))
  .catch(err => console.error("Unable to connect to the database : ", err));

//create user model
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

//create table with user model

User.sync()
  .then(() => console.log("User Table created Successfully."))
  .catch(err => console.error("Did you enter wrong database credentials?"));

//helper functions to work on the database
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

//parse application json
app.use(bodyParser.json());
//parse application/x-www-form-urlencoded

app.use(bodyParser.urlencoded({ extended: true }));

//add a basic route
app.get("/", (req, res) => {
  res.json({
    message: "Express is up!"
  });
});

//get all users

app.get("/users", function(req, res) {
  getAllUsers().then(user => res.json(user));
});

//register new user
app.post("/register", function(req, res, next) {
  const { email, fullname, username, password } = req.body;
  createUser({ email, fullname, username, password }).then(user =>
    res.json({ user, msg: "account created successfully" })
  );
});

//start the app
app.listen(3000, () => {
  console.log("====================================");
  console.log("Express is running on port 3000");
  console.log("====================================");
});
