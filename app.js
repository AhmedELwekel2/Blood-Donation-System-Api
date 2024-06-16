const path = require("path");
const upload = require("./upload"); // The multer configuration
const authController = require("./controllers/authController");
const dotenv = require("dotenv");
const User = require("./models/User");
const cors = require("cors");
const allowedMethods = ["GET", "POST", "PUT", "DELETE"];

const express = require("express");

const mongoose = require("mongoose");

const app = express();

app.use(
  cors({
    methods: allowedMethods,
  })
);

const cookieParser = require("cookie-parser");

const port = 3000;

const globalErrorHandler = require("./controllers/errorController");

var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve the uploaded files

app.use(cookieParser());

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

app.post("/api/user/upload", authController.protect, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file selected!" });
    }

    try {
      const user = await User.findById(req.user._id).select([
        "name",
        "profileImage",
        "email",
        "username",
        "location",
      ]);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.profileImage = `/uploads/${req.file.filename}`;

      const updatedUser = await user.save({ validateBeforeSave: false });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error saving user", error });
    }
  });
});

mongoose.connect(db).then(() => {
  console.log("DB connection succesfuly");
});
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`app listen in port ${port}`);
});
