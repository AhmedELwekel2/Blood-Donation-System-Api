const express = require("express");
const authController = require("./../controllers/authController");
const userRouter = express.Router();
const userController = require("./../controllers/userController");
userRouter.get(
  "/patient/searchNearestDonors",
  authController.protect,
  authController.restrictTo("patient"),
  userController.searchNearestDonors
);

userRouter.post("/signup", authController.signup);

userRouter.post("/login", authController.login);

userRouter.post(
  "/verfiyEmail",
  authController.protect,
  authController.verfiyEmail
);
userRouter.post("/forgotPassword", authController.forgotPassword);

userRouter.post("/resetPassword", authController.resetPassword);

userRouter.post(
  "/patient/requestDonations/:donorsId",
  authController.protect,
  authController.restrictTo("patient"),
  userController.createDonationRequest
);

userRouter.get(
  "/donor/sentedRequests",
  authController.protect,
  authController.restrictTo("donor"),
  userController.sentedRequests
);

userRouter.post(
  "/patient/createRequestForm",
  authController.protect,
  authController.restrictTo("patient"),
  userController.createRequestForm
);
userRouter.post(
  "/donor/updateRequest/:requestId/:status",
  authController.protect,
  authController.restrictTo("donor"),
  userController.updateRequest
);

userRouter.post(
  "/donor/updateDonationCheck/:id",
  authController.protect,
  authController.restrictTo("donor"),
  userController.updateDonationCheck
);

userRouter.get(
  "/patient/acceptedRequests/",
  authController.protect,
  authController.restrictTo("patient"),
  userController.getAcceptedRequests
);
userRouter.post(
  "/admin/verfiyBloodBank/:id",
  authController.protect,
  authController.restrictTo("admin"),
  userController.verfiyBloodBank
);
userRouter.post(
  "/bloodBank/createDonationCamp",
  authController.protect,
  authController.restrictTo("bloodBank"),
  userController.createDonationCamp
);

userRouter.get(
  "/bloodBank/acceptedRequests/:donationCamp",
  authController.protect,
  authController.restrictTo("bloodBank"),
  userController.getAcceptedRequestsDonationCamp
);
module.exports = userRouter;
