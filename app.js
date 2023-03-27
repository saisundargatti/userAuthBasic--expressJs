const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1 Register user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username ='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  //scenario 3
  if (dbUser === undefined) {
    //scenario 2
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `insert into user(username,name,password,gender,location)
      values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } //scenario 1
  else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2  login API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `select * from user where username='${username}';`;
  const dbUser = await db.get(selectUser);
  //scenario 1
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } //scenario 3
  else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword === true) {
      response.send("Login success!");
    } //scenario 2
    else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 Update Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);

  //scenario 1
  if (comparePassword === true) {
    //scenario 2
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } //scenario 3
    else {
      const newHashPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `update user set password ='${newHashPassword}' where username= '${username}';`;
      const update = await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
