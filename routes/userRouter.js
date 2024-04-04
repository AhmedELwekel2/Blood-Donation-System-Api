const express = require("express");
const authController = require("./../controllers/authController");
const userRouter = express.Router();

userRouter.post("/signup", authController.signup);

userRouter.post("/login", authController.login);

userRouter.post(
  "/verfiyEmail",
  authController.protect,
  authController.verfiyEmail
);
userRouter.post("/forgotPassword", authController.forgotPassword);

userRouter.post("/resetPassword/:token", authController.resetPassword);
module.exports = userRouter;
