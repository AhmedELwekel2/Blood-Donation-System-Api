const path = require("path");

const dotenv = require("dotenv");

const express = require("express");

const mongoose = require("mongoose");

const app = express();

const port = 3000;

const globalErrorHandler = require("./controllers/errorController");

var bodyParser = require("body-parser");

app.use(bodyParser.json());

const userRouter = require("./routes/userRouter");

dotenv.config({ path: ".env" });

const db = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

app.get("/", (req, res) => {
  res.status(300).json({
    message: "Welcome To Our Blood Donation System Api ",
  });
});

app.use("/api/user", userRouter);

app.use(globalErrorHandler);

mongoose.connect(db).then(() => {
  console.log("DB connection succesfuly");
});

app.listen(port, () => {
  console.log(`app listen in port ${port}`);
});
